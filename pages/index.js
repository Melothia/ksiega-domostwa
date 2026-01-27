import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://zhywdorfllurbkwzesii.supabase.co",
  "sb_publishable_dm5fyZedKgGD3OccGT2yDg_38bv-Efd"
);

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

  /* =======================
     LOAD PLAYERS
  ======================= */
  useEffect(() => {
    supabase
      .from("players")
      .select("id, nick")
      .then(({ data }) => setPlayers(data || []));
  }, []);

  /* =======================
     LOAD PROGRESS
  ======================= */
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

  /* =======================
     LOAD QUESTS (GLOBAL)
  ======================= */
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

  /* =======================
     LOAD RECENT ACTIVITY
  ======================= */
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

  /* =======================
     COMPLETE QUEST
  ======================= */
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

    // refresh everything
    setPlayerId((prev) => prev);
    setLoading(false);
  };

  /* =======================
     UI
  ======================= */

  if (!playerId) {
    return (
      <main style={{ padding: 20 }}>
        <h1>Księga Domostwa</h1>
        <p>Wybierz gracza:</p>

        {players.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setPlayerId(p.id);
              setPlayerNick(p.nick);
            }}
            style={{ display: "block", marginBottom: 10, padding: 10 }}
          >
            {p.nick}
          </button>
        ))}
      </main>
    );
  }

  if (loading || !progress) {
    return <p style={{ padding: 20 }}>Ładowanie…</p>;
  }

  const xpNeeded = progress.level * 100;

  return (
    <main style={{ padding: 20 }}>
      <h1>Księga Domostwa</h1>

      <h2>{playerNick}</h2>
      <p>
        Poziom: {progress.level} <br />
        XP: {progress.xp}/{xpNeeded}
      </p>

      <h3>📜 Ostatnie dokonania Gildii</h3>
      {recent.length === 0 && <p>Jeszcze cisza w kronikach…</p>}

      {recent.map((r, i) => (
        <div key={i} style={{ fontSize: 14, marginBottom: 4 }}>
          <strong>{r.players?.nick}</strong> wykonał(a){" "}
          <em>{r.quests?.name}</em>
        </div>
      ))}

      <h3>🗺️ Questy do wykonania</h3>

      {quests.length === 0 && <p>Brak questów 🎉</p>}

      {quests.map((q) => (
        <div
          key={q.id}
          style={{ border: "1px solid #555", padding: 10, marginBottom: 10 }}
        >
          <strong>{q.name}</strong>
          <div>
            {q.time_minutes} min • {q.base_xp} XP
          </div>

          <button onClick={() => completeQuest(q.id)}>Wykonane</button>
        </div>
      ))}
    </main>
  );
}
