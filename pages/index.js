// ❗ UWAGA: to jest PEŁNY plik – podmień CAŁOŚĆ
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
  const [playerId, setPlayerId] = useState(null);
  const [playerNick, setPlayerNick] = useState(null);
  const [progress, setProgress] = useState(null);
  const [quests, setQuests] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);

  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  useEffect(() => {
    supabase.from("players").select("id, nick")
      .then(({ data }) => setPlayers(data || []));
  }, []);

  useEffect(() => {
    if (!playerId) return;
    setLoading(true);

    supabase.from("monthly_progress")
      .select("*")
      .eq("player_id", playerId)
      .eq("year", year)
      .eq("month", month)
      .single()
      .then(({ data }) => {
        setProgress(data);
        setLoading(false);
      });
  }, [playerId]);

  /* ===== QUESTS WITH EMERGENCY ===== */
  useEffect(() => {
    if (!playerId) return;

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

      const available = (all || [])
        .filter(q => !completedIds.includes(q.id))
        .sort((a, b) => b.is_emergency - a.is_emergency);

      setQuests(available);
    };

    loadQuests();
  }, [playerId]);

  /* ===== RECENT ===== */
  useEffect(() => {
    supabase.from("quest_completions")
      .select(`completed_at, quests(name), players(nick)`)
      .order("completed_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setRecent(data || []));
  }, []);

  const completeQuest = async (quest) => {
    setLoading(true);

    const { error } = await supabase.rpc("complete_quest", {
      p_player_id: playerId,
      p_quest_id: quest.id,
    });

    if (error) alert(error.message);
    setLoading(false);
  };

  if (!playerId) {
    return (
      <main className="container">
        <h1>📖 Księga Domostwa</h1>
        {players.map(p => (
          <button key={p.id} className="btn"
            onClick={() => {
              setPlayerId(p.id);
              setPlayerNick(p.nick);
            }}>
            {p.nick}
          </button>
        ))}
        <style jsx>{styles}</style>
      </main>
    );
  }

  if (loading || !progress) {
    return <p className="container">⏳ Kroniki się przewracają…</p>;
  }

  return (
    <main className="container">
      <h1>📖 Księga Domostwa</h1>

      <section className="card">
        <h2>{playerNick}</h2>
        <p>Poziom {progress.level} • XP {progress.xp}/{progress.level * 100}</p>
      </section>

      <section className="card">
        <h3>📜 Kroniki Gildii</h3>
        {recent.map((r, i) => (
          <div key={i} className="log">
            <strong>{r.players.nick}</strong> wykonał(a){" "}
            <em>{r.quests.name}</em>
            <span className="time">{timeAgo(r.completed_at)}</span>
          </div>
        ))}
      </section>

      <section className="card">
        <h3>🗺️ Questy</h3>

        {quests.map(q => (
          <div key={q.id} className={`quest ${q.is_emergency ? "emergency" : ""}`}>
            <strong>{q.name}</strong>
            {q.is_emergency && <span className="alert">⚠ EMERGENCY</span>}
            <div className="muted">
              {q.time_minutes} min • {q.base_xp}
              {q.is_emergency && " +30% XP"}
            </div>

            <button className="btn small" onClick={() => completeQuest(q)}>
              Wykonane
            </button>
          </div>
        ))}
      </section>

      <style jsx>{styles}</style>
    </main>
  );
}

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
.card {
  background: #2a251d;
  border: 1px solid #3b3428;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}
.quest.emergency {
  border-left: 4px solid #b63c2d;
  padding-left: 8px;
}
.alert {
  color: #ff6b5c;
  margin-left: 6px;
}
.log { font-size: 14px; }
.time { font-size: 12px; color: #b9b2a3; display: block; }
.muted { color: #b9b2a3; font-size: 14px; }
.btn {
  width: 100%;
  background: #6b4f1d;
  color: #fff;
  padding: 10px;
  border-radius: 6px;
  border: none;
}
.btn.small { padding: 6px; margin-top: 6px; }
`;
