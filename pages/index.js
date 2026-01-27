import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/* =====================
   SUPABASE
===================== */

const supabase = createClient(
  "https://zhywdorfllurbkwzesii.supabase.co",
  "sb_publishable_dm5fyZedKgGD3OccGT2yDg_38bv-Efd"
);

/* =====================
   KONFIG
===================== */

const PLAYERS = [
  { id: "melothy", nick: "Melothy", avatar: "🏹" },
  { id: "pshemcky", nick: "Pshemcky", avatar: "🌿" },
  { id: "reu", nick: "Reu", avatar: "🗡️" },
  { id: "benditt", nick: "Benditt", avatar: "✨" }
];

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function daysBetween(a, b) {
  return Math.floor((a - b) / (1000 * 60 * 60 * 24));
}

function xpForNextLevel(level) {
  return 100 + (level - 1) * 50;
}

/* =====================
   APP
===================== */

export default function Home() {
  const [player, setPlayer] = useState(null);
  const [progress, setProgress] = useState(null);
  const [quests, setQuests] = useState([]);
  const [slots, setSlots] = useState([]);

  const month = currentMonth();

  useEffect(() => {
    const saved = localStorage.getItem("ksiega_player_id");
    if (saved) loadPlayer(saved);
  }, []);

  async function loadPlayer(playerId) {
    localStorage.setItem("ksiega_player_id", playerId);
    setPlayer(PLAYERS.find(p => p.id === playerId));
    await loadProgress(playerId);
    await loadWorld();
  }

  async function loadProgress(playerId) {
    const { data } = await supabase
      .from("monthly_progress")
      .select("*")
      .eq("player_id", playerId)
      .eq("month", month)
      .single();
    setProgress(data);
  }

  async function loadWorld() {
    const { data: questList } = await supabase.from("quests").select("*");
    const { data: completions } = await supabase
      .from("quest_completions")
      .select("*");
    const { data: slotList } = await supabase.from("quest_slots").select("*");

    setSlots(slotList || []);

    const now = new Date();

    const computed = questList.map(q => {
      const last = completions
        ?.filter(c => c.quest_id === q.id)
        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0];

      let status = "Spokojny";
      if (!last) status = "Emergency";
      else {
        const diff = daysBetween(now, new Date(last.completed_at));
        if (diff > q.frequency_days) status = "Emergency";
        else if (diff === q.frequency_days) status = "Do wykonania";
      }

      const taken = slotList?.filter(s => s.quest_id === q.id) || [];

      return { ...q, status, taken };
    });

    setQuests(computed);
  }

  async function takeSlot(questId) {
    await supabase.from("quest_slots").insert({
      quest_id: questId,
      player_id: player.id
    });
    loadWorld();
  }

  async function completeQuest(q) {
    await supabase.from("quest_completions").insert({
      quest_id: q.id,
      player_id: player.id,
      completed_at: new Date().toISOString()
    });

    await supabase
      .from("monthly_progress")
      .update({ xp: progress.xp + q.base_xp })
      .eq("player_id", player.id)
      .eq("month", month);

    await supabase.from("quest_slots").delete().eq("quest_id", q.id);

    loadProgress(player.id);
    loadWorld();
  }

  function logout() {
    localStorage.removeItem("ksiega_player_id");
    setPlayer(null);
    setProgress(null);
  }

  if (!player || !progress) {
    return (
      <main style={styles.main}>
        <h1 style={styles.title}>📜 Księga Domostwa</h1>
        <p>Wybierz bohatera</p>
        <div style={styles.grid}>
          {PLAYERS.map(p => (
            <button key={p.id} style={styles.card} onClick={() => loadPlayer(p.id)}>
              <div style={{ fontSize: "2.5rem" }}>{p.avatar}</div>
              <div>{p.nick}</div>
            </button>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <h1 style={styles.title}>📜 Księga Domostwa</h1>

      <div style={styles.panel}>
        <div style={styles.avatar}>{player.avatar}</div>
        <h2>{player.nick}</h2>
        <p>
          Poziom: {progress.level} • XP: {progress.xp}/{xpForNextLevel(progress.level)}
        </p>
      </div>

      <h3 style={{ marginTop: "2rem" }}>📋 Quest Log Gildii</h3>

      <div style={styles.questList}>
        {quests.map(q => {
          const mySlot = q.taken.find(s => s.player_id === player.id);
          const slotsFull = q.taken.length >= q.max_slots;

          return (
            <div key={q.id} style={styles.quest}>
              <strong>{q.name}</strong>
              <div>{q.status}</div>

              {!mySlot && !slotsFull && (
                <button onClick={() => takeSlot(q.id)}>Zajmij slot</button>
              )}

              {mySlot && (
                <button onClick={() => completeQuest(q)}>Wykonane</button>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={logout} style={styles.logout}>
        Zmień bohatera
      </button>
    </main>
  );
}

/* =====================
   STYLE
===================== */

const styles = {
  main: {
    minHeight: "100vh",
    background: "#0f0f0f",
    color: "#eee",
    padding: "2rem",
    textAlign: "center"
  },
  title: { fontSize: "2.2rem" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1.5rem"
  },
  card: {
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "12px",
    padding: "1.5rem",
    cursor: "pointer"
  },
  panel: {
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "16px",
    padding: "1.5rem",
    marginTop: "1rem"
  },
  avatar: { fontSize: "3rem" },
  questList: {
    maxWidth: "420px",
    margin: "1rem auto"
  },
  quest: {
    background: "#161616",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "0.5rem"
  },
  logout: {
    marginTop: "2rem",
    background: "transparent",
    border: "1px solid #444",
    color: "#aaa",
    padding: "0.6rem 1.2rem",
    borderRadius: "8px"
  }
};
