import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://zhywdorfllurbkwzesii.supabase.co",
  "sb_publishable_dm5fyZedKgGD3OccGT2yDg_38bv-Efd"
);

export default function Home() {
  const [player, setPlayer] = useState(null);
  const [quests, setQuests] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);

  const monthKey = new Date().toISOString().slice(0, 7); // YYYY-MM

  // ===== LOAD PLAYER =====
  useEffect(() => {
    const saved = localStorage.getItem("player");
    if (saved) setPlayer(saved);
  }, []);

  // ===== LOAD OR CREATE PROGRESS =====
  useEffect(() => {
    if (!player) return;

    const loadProgress = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("monthly_progress")
        .select("*")
        .eq("player_id", player)
        .eq("month", monthKey);

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      if (data.length === 0) {
        const { data: created, error: insertError } = await supabase
          .from("monthly_progress")
          .insert({
            player_id: player,
            month: monthKey,
            level: 1,
            xp: 0,
          })
          .select()
          .single();

        if (insertError) {
          console.error(insertError);
        } else {
          setProgress(created);
        }
      } else {
        setProgress(data[0]);
      }

      setLoading(false);
    };

    loadProgress();
  }, [player]);

  // ===== LOAD QUESTS =====
  useEffect(() => {
    const loadQuests = async () => {
      const { data } = await supabase
        .from("quests")
        .select("*")
        .order("frequency_days");

      setQuests(data || []);
    };

    loadQuests();
  }, []);

  // ===== COMPLETE QUEST =====
  const completeQuest = async (quest) => {
    if (!player || !progress) return;

    await supabase.rpc("complete_quest", {
      p_player_id: player,
      p_quest_id: quest.id,
    });

    // reload progress
    const { data } = await supabase
      .from("monthly_progress")
      .select("*")
      .eq("player_id", player)
      .eq("month", monthKey);

    if (data && data.length > 0) {
      setProgress(data[0]);
    }
  };

  // ===== UI =====
  if (!player) {
    return (
      <main style={{ padding: 20 }}>
        <h1>Księga Domostwa</h1>
        {["Melothy", "Pshemcky", "Reu", "Benditt"].map((p) => (
          <button
            key={p}
            onClick={() => {
              localStorage.setItem("player", p);
              setPlayer(p);
            }}
            style={{ display: "block", margin: 10 }}
          >
            {p}
          </button>
        ))}
      </main>
    );
  }

  if (loading || !progress) {
    return <p style={{ padding: 20 }}>Ładowanie…</p>;
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>Księga Domostwa</h1>
      <h2>{player}</h2>
      <p>
        Poziom: {progress.level} • XP: {progress.xp}/100
      </p>

      <h3>Questy</h3>

      {quests.length === 0 && <p>Brak questów w bazie.</p>}

      {quests.map((q) => (
        <div
          key={q.id}
          style={{ border: "1px solid #444", padding: 10, marginBottom: 10 }}
        >
          <strong>{q.name}</strong>
          <div>
            {q.time_minutes} min • {q.base_xp} XP
          </div>
          <button onClick={() => completeQuest(q)}>Wykonane</button>
        </div>
      ))}
    </main>
  );
}
