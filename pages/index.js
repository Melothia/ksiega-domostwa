import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://zhywdorfllurbkwzesii.supabase.co",
  "sb_publishable_dm5fyZedKgGD3OccGT2yDg_38bv-Efd"
);

/* ===== helper: human readable time ===== */
function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor(
    (now - date) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "dzisiaj";
  if (diffDays === 1) return "wczoraj";
  if (diffDays < 7) return `${diffDays} dni temu`;

  return date.toLocaleDateString("pl-PL");
}

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [playerId, setPlayerId] = useState(null);
  const [playerNick, setPlayerNick] = useState(null);

  const [progress, setProgress] = useState(null);
  const [quests, setQuests] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);

  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  /* ===== LOAD PLAYERS ===== */
  useEffect(() => {
    supabase
      .from("players")
      .select("id, nick")
      .then(({ data }) => setPlayers(data || []));
  }, []);

  /* ===== LOAD PROGRESS ===== */
  useEffect(() => {
    if (!playerId) return;

    const loadProgress = async () => {
      setLoading(true);

      const { data } = await supabase
        .from("monthly_progress")
        .select("*")
        .eq("player_id", playerId)
        .eq("year", year)
        .eq("month", month)
        .single();

      if (!data) {
        const { data: created } = await supabase
          .from("monthly_progress")
          .insert({
            player_id: playerId,
            year,
            month,
            xp: 0,
            level: 1,
          })
          .select()
          .single();

        setProgress(created);
      } else {
        setProgress(data);
      }

      setLoading(false);
    };

    loadProgress();
  }, [playerId]);

  /* ===== LOAD QUESTS (GLOBAL) ===== */
  useEffect(() => {
    if (!playerId) return;

    const loadQuests = async () => {
      const { data: allQuests } = await supabase
        .from("quests")
        .select("*")
        .order("name");

      const { data: completed } = await supabase
        .from("quest_completions")
        .select("quest_id")
        .gte("completed_at", new Date(year, month - 1, 1).toISOString())
        .lt("completed_at", new Date(year, month, 1).toISOString());

      const completedIds = completed?.map((c) => c.quest_id) || [];

      setQuests(
        (allQuests || []).filter((q) => !completedIds.includes(q.id))
      );
    };

    loadQuests();
  }, [playerId]);

  /* ===== LOAD RECENT ACTIVITY ===== */
  useEffect(() => {
    const loadRecent = async () => {
      const { data } = await supabase
        .from("quest_completions")
        .select(`
          completed_at,
          quests ( name ),
          players ( nick )
        `)
        .order("completed_at", { ascending: false })
        .limit(5);

      setRecent(data || []);
    };

    loadRecent();
  }, []);

  /* ===== COMPLETE QUEST ===== */
  const completeQuest = async (questId) => {
    setLoading(true);

    const { error } = await supabase.rpc("complete_quest", {
      p_player_id: playerId,
      p_quest_id: questId,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setPlayerId((prev) => prev); // refresh
    setLoading(false);
  };

  /* ===== UI ===== */

  if (!playerId) {
    return (
      <main className="container">
        <h1>📖 Księga Domostwa</h1>
        <p className="subtitle">Wybierz bohatera:</p>

        {players.map((p) => (
          <button
            key={p.id}
            className="btn"
            onClick={() => {
              setPlayerId(p.id);
              setPlayerNick(p.nick);
            }}
          >
            {p.nick}
          </button>
        ))}

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

  const xpNeeded = progress.level * 100;

  return (
    <main className="container">
      <h1>📖 Księga Domostwa</h1>

      <section className="card">
        <h2>{playerNick}</h2>
        <p>
          Poziom: <strong>{progress.level}</strong><br />
          XP: <strong>{progress.xp}/{xpNeeded}</strong>
        </p>
      </section>

      <section className="card">
        <h3>📜 Kroniki Gildii</h3>
        {recent.length === 0 && (
          <p className="muted">Brak wieści z wypraw…</p>
        )}

        {recent.map((r, i) => (
          <div key={i} className="log">
            <strong>{r.players?.nick}</strong>{" "}
            wykonał(a) <em>{r.quests?.name}</em>
            <span className="time">
              {timeAgo(r.completed_at)}
            </span>
          </div>
        ))}
      </section>

      <section className="card">
        <h3>🗺️ Questy do wykonania</h3>

        {quests.length === 0 && (
          <p className="muted">Domostwo chwilowo w spokoju ✨</p>
        )}

        {quests.map((q) => (
          <div key={q.id} className="quest">
            <strong>{q.name}</strong>
            <div className="muted">
              {q.time_minutes} min • {q.base_xp} XP
            </div>

            <button
              className="btn small"
              onClick={() => completeQuest(q.id)}
            >
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
  margin: 0 auto;
  padding: 16px;
  font-family: serif;
  background: #1e1b16;
  color: #f4f1ea;
  min-height: 100vh;
}

h1 {
  text-align: center;
  margin-bottom: 12px;
}

.subtitle {
  text-align: center;
  color: #c9c4b8;
}

.card {
  background: #2a251d;
  border: 1px solid #3b3428;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.quest {
  border-top: 1px solid #3b3428;
  padding-top: 10px;
  margin-top: 10px;
}

.log {
  font-size: 14px;
  margin-bottom: 6px;
}

.time {
  display: block;
  font-size: 12px;
  color: #b9b2a3;
}

.muted {
  color: #b9b2a3;
  font-size: 14px;
}

.btn {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  background: #6b4f1d;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn.small {
  width: auto;
  padding: 6px 12px;
}

.btn:hover {
  background: #8a6a2f;
}
`;
