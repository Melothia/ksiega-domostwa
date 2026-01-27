import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://zhywdorfllurbkwzesii.supabase.co",
  "sb_publishable_dm5fyZedKgGD3OccGT2yDg_38bv-Efd"
);

export default function Home() {
  const [player, setPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  const [quests, setQuests] = useState([]);
  const [progress, setProgress] = useState(null);

  const month = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    supabase.from("players").select("*").then(({ data }) => setPlayers(data));
  }, []);

  useEffect(() => {
    if (!player) return;

    supabase
      .from("monthly_progress")
      .select("*")
      .eq("player_id", player.nick)
      .eq("month", month)
      .single()
      .then(({ data }) => setProgress(data));

    supabase
      .from("quests")
      .select(`
        id, name, time_minutes, base_xp, quest_type,
        quest_slots ( player_id )
      `)
      .then(({ data }) => setQuests(data));
  }, [player]);

  async function completeQuest(questId) {
    const { error } = await supabase.rpc("complete_quest", {
      p_quest_id: questId,
      p_player_id: player.nick,
    });

    if (error) {
      alert("Zadanie zostało już wykonane lub zajęte");
      return;
    }

    // odśwież dane PO BACKENDZIE
    const { data: p } = await supabase
      .from("monthly_progress")
      .select("*")
      .eq("player_id", player.nick)
      .eq("month", month)
      .single();

    setProgress(p);

    const { data: q } = await supabase
      .from("quests")
      .select(`
        id, name, time_minutes, base_xp, quest_type,
        quest_slots ( player_id )
      `);

    setQuests(q);
  }

  if (!player) {
    return (
      <main style={{ padding: 32 }}>
        <h1>📜 Księga Domostwa</h1>
        {players.map((p) => (
          <button
            key={p.nick}
            onClick={() => setPlayer(p)}
            style={{ display: "block", margin: 12 }}
          >
            {p.nick}
          </button>
        ))}
      </main>
    );
  }

  return (
    <main style={{ padding: 32 }}>
      <h1>📜 Księga Domostwa</h1>
      <h2>{player.nick}</h2>

      <p>
        Poziom: {progress?.level ?? 1} • XP:{" "}
        {progress?.xp ?? 0}/{(progress?.level ?? 1) * 100}
      </p>

      <h3>🚨 Emergency</h3>
      {quests
        .filter((q) => q.quest_type === "emergency")
        .map((q) => (
          <QuestCard
            key={q.id}
            quest={q}
            onComplete={() => completeQuest(q.id)}
          />
        ))}

      <h3>📅 Do wykonania</h3>
      {quests
        .filter((q) => q.quest_type !== "emergency")
        .map((q) => (
          <QuestCard
            key={q.id}
            quest={q}
            onComplete={() => completeQuest(q.id)}
          />
        ))}
    </main>
  );
}

function QuestCard({ quest, onComplete }) {
  const taken = quest.quest_slots?.length > 0;

  return (
    <div
      style={{
        border: "1px solid #444",
        padding: 12,
        marginBottom: 12,
        opacity: taken ? 0.5 : 1,
      }}
    >
      <strong>{quest.name}</strong>
      <p>
        ⏱ {quest.time_minutes} min • ⭐ {quest.base_xp} XP
      </p>
      <button disabled={taken} onClick={onComplete}>
        {taken ? "Zajęte / Wykonane" : "Wykonane"}
      </button>
    </div>
  );
}
