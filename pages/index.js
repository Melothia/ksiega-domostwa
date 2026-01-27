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

function xpForNextLevel(level) {
  return 100 + (level - 1) * 50;
}

/* =====================
   APP
===================== */

export default function Home() {
  const [player, setPlayer] = useState(null);
  const [progress, setProgress] = useState(null);
  const month = currentMonth();

  useEffect(() => {
    const saved = localStorage.getItem("ksiega_player_id");
    if (saved) {
      loadPlayer(saved);
    }
  }, []);

  async function loadPlayer(playerId) {
    localStorage.setItem("ksiega_player_id", playerId);

    const basePlayer = PLAYERS.find(p => p.id === playerId);
    setPlayer(basePlayer);

    let { data, error } = await supabase
      .from("monthly_progress")
      .select("*")
      .eq("player_id", playerId)
      .eq("month", month)
      .single();

    if (!data) {
      const { data: created, error: insertError } = await supabase
        .from("monthly_progress")
        .insert({
          player_id: playerId,
          month: month,
          level: 1,
          xp: 0
        })
        .select()
        .single();

      if (!insertError) {
        setProgress(created);
      }
    } else {
      setProgress(data);
    }
  }

  function logout() {
    localStorage.removeItem("ksiega_player_id");
    setPlayer(null);
    setProgress(null);
  }

  /* =====================
     PANEL GRACZA
  ===================== */

  if (player && progress) {
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

        <button onClick={logout} style={styles.logout}>
          Zmień bohatera
        </button>
      </main>
    );
  }

  /* =====================
     WYBÓR GRACZA
  ===================== */

  return (
    <main style={styles.main}>
      <h1 style={styles.title}>📜 Księga Domostwa</h1>
      <p>Wybierz bohatera</p>

      <div style={styles.grid}>
        {PLAYERS.map(p => (
          <button
            key={p.id}
            style={styles.card}
            onClick={() => loadPlayer(p.id)}
          >
            <div style={{ fontSize: "2.5rem" }}>{p.avatar}</div>
            <div>{p.nick}</div>
          </button>
        ))}
      </div>
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
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "system-ui",
    padding: "2rem",
    textAlign: "center"
  },
  title: {
    fontSize: "2.4rem",
    marginBottom: "1rem"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1.5rem",
    maxWidth: "320px"
  },
  card: {
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "12px",
    padding: "1.5rem",
    cursor: "pointer",
    color: "#eee"
  },
  panel: {
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "16px",
    padding: "2rem",
    minWidth: "260px"
  },
  avatar: {
    fontSize: "3rem"
  },
  logout: {
    marginTop: "2rem",
    background: "transparent",
    border: "1px solid #444",
    color: "#aaa",
    padding: "0.75rem 1.25rem",
    borderRadius: "8px",
    cursor: "pointer"
  }
};
