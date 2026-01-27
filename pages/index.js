import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://zhywdorfllurbkwzesii.supabase.co",
  "sb_publishable_dm5fyZedKgGD3OccGT2yDg_38bv-Efd"
);

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "dzisiaj";
  if (diffDays === 1) return "wczoraj";
  if (diffDays < 7) return `${diffDays} dni temu`;
  return date.toLocaleDateString("pl-PL");
}

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [player, setPlayer] = useState(null);
  const [progress, setProgress] = useState(null);
  const [quests, setQuests] = useState([]);
  const [slots, setSlots] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);

  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  /* ===== PLAYERS ===== */
  useEffect(() => {
    supabase
      .from("players")
      .select("id, nick, avatar_url")
      .then(({ data }) => setPlayers(data || []));
  }, []);

  /* ===== PROGRESS ===== */
  useEffect(() => {
    if (!player) return;

    supabase
      .from("monthly_progress")
      .select("*")
      .eq("player_id", player.id)
      .eq("year", year)
      .eq("month", month)
      .single()
      .then(({ data }) => setProgress(data));
  }, [player]);

  /* ===== QUESTS ===== */
  const loadQuests = async () => {
    const { data } = await supabase
      .from("quests_with_status")
      .select("*");

    setQuests(data || []);
  };

  /* ===== SLOTS ===== */
  const loadSlots = async () => {
    const { data } = await supabase
      .from("quest_slots")
      .select(`
        quest_id,
        players(id, nick, avatar_url)
      `);

    setSlots(data || []);
  };

  /* ===== RECENT ===== */
  const loadRecent = async () => {
    const { data } = await supabase
      .from("quest_completions")
      .select(`
        completed_at,
        quests(name),
        players(nick, avatar_url)
      `)
      .order("completed_at", { ascending: false })
      .limit(5);

    setRecent(data || []);
  };

  useEffect(() => {
    if (!player) return;
    loadQuests();
    loadSlots();
    loadRecent();
  }, [player]);

  /* ===== SLOT ACTIONS ===== */
  const joinSlot = async (questId) => {
    const { error } = await supabase.rpc("join_quest_slot", {
      p_player_id: player.id,
      p_quest_id: questId,
    });

    if (error) alert(error.message);
    loadSlots();
  };

  const completeQuest = async (questId) => {
    setLoading(true);

    const { error } = await supabase.rpc("complete_quest", {
      p_player_id: player.id,
      p_quest_id: questId,
    });

    if (error) alert(error.message);

    setLoading(false);
    loadQuests();
    loadSlots();
    loadRecent();
  };

  /* ===== UI ===== */

  if (!player) {
    return (
      <main className="container">
        <h1>📖 Księga Domostwa</h1>

        {players.map(p => (
          <button key={p.id} className="player-btn" onClick={() => setPlayer(p)}>
            <img src={p.avatar_url} className="avatar" />
            {p.nick}
          </button>
        ))}

        <style jsx>{styles}</style>
      </main>
    );
  }

  if (!progress) {
    return <p className="container">⏳ Ładowanie…</p>;
  }

  return (
    <main className="container">
      <h1>📖 Księga Domostwa</h1>

      <section className="card player-card">
        <img src={player.avatar_url} className="avatar large" />
        <div>
          <strong>{player.nick}</strong><br />
          Poziom {progress.level}<br />
          XP {progress.xp}/{progress.level * 100}
        </div>
      </section>

      <section className="card chronicle">
        <h3>📜 Kronika</h3>
        {recent.map((r, i) => (
          <div key={i} className="log">
            <img src={r.players.avatar_url} className="avatar small" />
            <div>
              <strong>{r.players.nick}</strong> – {r.quests.name}
              <div className="time">{timeAgo(r.completed_at)}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="card">
        <h3>🗺️ Questy</h3>

        {quests.map(q => {
          const questSlots = slots.filter(s => s.quest_id === q.id);
          const isJoined = questSlots.some(s => s.players.id === player.id);

          return (
            <div key={q.id} className={`quest ${q.is_emergency ? "emergency" : ""}`}>
              <strong>{q.name}</strong>
              {q.is_emergency && <span className="alert">⚠ EMERGENCY</span>}

              <div className="muted">
                {questSlots.length}/{q.max_slots} sloty
              </div>

              <div className="slot-list">
                {questSlots.map((s, i) => (
                  <img
                    key={i}
                    src={s.players.avatar_url}
                    title={s.players.nick}
                    className="avatar small"
                  />
                ))}
              </div>

              {!isJoined && questSlots.length < q.max_slots && (
                <button className="btn small" onClick={() => joinSlot(q.id)}>
                  Dołącz
                </button>
              )}

              {isJoined && (
                <button className="btn small" onClick={() => completeQuest(q.id)}>
                  Wykonane
                </button>
              )}
            </div>
          );
        })}
      </section>

      <style jsx>{styles}</style>
    </main>
  );
}

/* ===== STYLES ===== */
const styles = `
.container {
  max-width: 420px;
  margin: auto;
  padding: 16px;
  background: #1e1b16;
  color: #f4f1ea;
  min-height: 100vh;
  font-family: serif;
}

.player-btn {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px;
  margin-bottom: 8px;
  background: #6b4f1d;
  border: none;
  border-radius: 6px;
  color: #fff;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

.avatar.large {
  width: 64px;
  height: 64px;
}

.avatar.small {
  width: 28px;
  height: 28px;
}

.card {
  background: #2a251d;
  border: 1px solid #3b3428;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.player-card {
  display: flex;
  gap: 12px;
  align-items: center;
}

.quest {
  border-top: 1px solid #3b3428;
  padding-top: 10px;
  margin-top: 10px;
}

.quest.emergency {
  border-left: 4px solid #b63c2d;
  padding-left: 8px;
}

.alert {
  color: #ff6b5c;
  margin-left: 6px;
}

.slot-list {
  display: flex;
  gap: 6px;
  margin: 6px 0;
}

.log {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
}

.time {
  font-size: 12px;
  color: #b9b2a3;
}

.muted {
  color: #b9b2a3;
  font-size: 14px;
}

.btn {
  width: 100%;
  background: #6b4f1d;
  color: #fff;
  padding: 6px;
  border-radius: 6px;
  border: none;
  margin-top: 6px;
}
`;
