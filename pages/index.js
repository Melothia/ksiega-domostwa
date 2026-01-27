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

    setLoading(true);

    supabase
      .from("monthly_progress")
      .select("*")
      .eq("player_id", player.id)
      .eq("year", year)
      .eq("month", month)
      .single()
      .then(({ data }) => {
        setProgress(data);
        setLoading(false);
      });
  }, [player]);

  /* ===== QUESTS ===== */
  useEffect(() => {
    if (!player) return;

    const loadQuests = async () => {
      const { data: all } = await supabase
        .from("quests_with_status")
        .select("*");

      const { data: completed } = await supabase
        .from("quest_completions")
        .select("quest_id")
        .gte("completed_at", new Date(year, month - 1, 1).toISOString())
        .lt("completed_at", new Date(year, month, 1).toISOString());

      const completedIds = completed?.map(c => c.quest_id) || [];

      setQuests(
        (all || [])
          .filter(q => !completedIds.includes(q.id))
          .sort((a, b) => b.is_emergency - a.is_emergency)
      );
    };

    loadQuests();
  }, [player]);

  /* ===== RECENT ===== */
  useEffect(() => {
    supabase
      .from("quest_completions")
      .select(`
        completed_at,
        quests(name),
        players(nick, avatar_url)
      `)
      .order("completed_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setRecent(data || []));
  }, []);

  const completeQuest = async (questId) => {
    setLoading(true);
    await supabase.rpc("complete_quest", {
      p_player_id: player.id,
      p_quest_id: questId,
    });
    setLoading(false);
  };

  /* ===== UI ===== */

  if (!player) {
    return (
      <main className="container">
        <h1>📖 Księga Domostwa</h1>

        <div className="player-list">
          {players.map(p => (
            <button
              key={p.id}
              className="player-btn"
              onClick={() => setPlayer(p)}
            >
              <img
                src={p.avatar_url || "https://api.dicebear.com/7.x/adventurer/svg?seed=default"}
                alt=""
                className="avatar"
              />
              {p.nick}
            </button>
          ))}
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  if (loading || !progress) {
    return (
      <main className="container">
        <p>⏳ Przeglądanie kronik…</p>
        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>📖 Księga Domostwa</h1>

      <section className="card player-card">
        <img
          src={player.avatar_url}
          alt=""
          className="avatar large"
        />
        <div>
          <h2>{player.nick}</h2>
          <p>
            Poziom {progress.level}<br />
            XP {progress.xp}/{progress.level * 100}
          </p>
        </div>
      </section>

      <section className="card chronicle">
        <h3>📜 Kroniki Gildii</h3>

        <div className="chronicle-list">
          {recent.map((r, i) => (
            <div key={i} className="log">
              <img
                src={r.players.avatar_url}
                className="avatar small"
              />
              <div>
                <strong>{r.players.nick}</strong>{" "}
                wykonał(a) <em>{r.quests.name}</em>
                <span className="time">{timeAgo(r.completed_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>🗺️ Questy</h3>

        {quests.map(q => (
          <div key={q.id} className={`quest ${q.is_emergency ? "emergency" : ""}`}>
            <strong>{q.name}</strong>
            {q.is_emergency && <span className="alert">⚠ EMERGENCY</span>}
            <div className="muted">
              {q.time_minutes} min • {q.base_xp} XP
            </div>
            <button className="btn small" onClick={() => completeQuest(q.id)}>
              Wykonane
            </button>
          </div>
        ))}
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

.player-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.player-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #6b4f1d;
  border: none;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #333;
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

.chronicle-list {
  max-height: 160px;
  overflow: hidden;
  mask-image: linear-gradient(to bottom, black 70%, transparent 100%);
}

.log {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}

.time {
  display: block;
  font-size: 12px;
  color: #b9b2a3;
}

.quest.emergency {
  border-left: 4px solid #b63c2d;
  padding-left: 8px;
}

.alert {
  color: #ff6b5c;
  margin-left: 6px;
}

.muted {
  color: #b9b2a3;
  font-size: 14px;
}

.btn {
  width: 100%;
  background: #6b4f1d;
  color: #fff;
  padding: 10px;
  border-radius: 6px;
  border: none;
}

.btn.small {
  margin-top: 6px;
  padding: 6px;
}
`;
