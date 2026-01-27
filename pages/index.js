import { useEffect, useState } from "react";

/* =====================
   DANE STAŁE
===================== */

const PLAYERS = [
  { id: "melothy", name: "Melothy", avatar: "🏹" },
  { id: "pshemcky", name: "Pshemcky", avatar: "🌿" },
  { id: "reu", name: "Reu", avatar: "🗡️" },
  { id: "benditt", name: "Benditt", avatar: "✨" }
];

const QUESTS = [
  { id: "em1", name: "🚨 Zalane Królestwo (łazienka)", time: 45, xp: 130, slots: 1, emergency: true },
  { id: "em2", name: "🚨 Najazd Kurzu", time: 20, xp: 80, slots: 1, emergency: true },

  { id: "q1", name: "Odkurzanie", time: 30, xp: 100, slots: 1 },
  { id: "q2", name: "Wynoszenie śmieci", time: 10, xp: 60, slots: 1 },
  { id: "q3", name: "Szybkie ogólne ogarnięcie przestrzeni wspólnej", time: 10, xp: 60, slots: 1 },
  { id: "q4", name: "Czesanie kota", time: 10, xp: 60, slots: 1 }
];

/* =====================
   XP & LEVEL LOGIKA
===================== */

function xpForNextLevel(level) {
  const safeLevel = Number(level) || 1;
  return 100 + (safeLevel - 1) * 50;
}

/* =====================
   APLIKACJA
===================== */

export default function Home() {
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("ksiega_player");
    if (saved) {
      const parsed = JSON.parse(saved);

      // 🔒 ZABEZPIECZENIE DANYCH
      const safePlayer = {
        ...parsed,
        level: Number(parsed.level) || 1,
        xp: Number(parsed.xp) || 0
      };

      localStorage.setItem("ksiega_player", JSON.stringify(safePlayer));
      setPlayer(safePlayer);
    }
  }, []);

  function selectPlayer(p) {
    const playerData = {
      ...p,
      level: 1,
      xp: 0
    };
    localStorage.setItem("ksiega_player", JSON.stringify(playerData));
    setPlayer(playerData);
  }

  function logout() {
    localStorage.removeItem("ksiega_player");
    setPlayer(null);
  }

  /* =====================
     PANEL GILDII
  ===================== */

  if (player) {
    const xpNeeded = xpForNextLevel(player.level);

    return (
      <main style={styles.main}>
        <h1 style={styles.title}>📜 Księga Domostwa</h1>

        <div style={styles.panel}>
          <div style={styles.avatarBig}>{player.avatar}</div>
          <h2>{player.name}</h2>
          <p style={{ opacity: 0.8 }}>
            Poziom: {player.level} • XP: {player.xp}/{xpNeeded}
          </p>
        </div>

        <div style={styles.questWrapper}>
          <h3>🚨 Emergency</h3>
          {QUESTS.filter(q => q.emergency).map(q => (
            <QuestCard key={q.id} quest={q} />
          ))}

          <h3 style={{ marginTop: "1.5rem" }}>🗓️ Do wykonania</h3>
          {QUESTS.filter(q => !q.emergency).map(q => (
            <QuestCard key={q.id} quest={q} />
          ))}
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
      <p style={styles.subtitle}>Wybierz swojego bohatera</p>

      <div style={styles.grid}>
        {PLAYERS.map(p => (
          <button
            key={p.id}
            onClick={() => selectPlayer(p)}
            style={styles.card}
          >
            <div style={styles.avatar}>{p.avatar}</div>
            <div>{p.name}</div>
          </button>
        ))}
      </div>
    </main>
  );
}

/* =====================
   KARTA QUESTA
===================== */

function QuestCard({ quest }) {
  return (
    <div style={styles.questCard}>
      <strong>{quest.name}</strong>
      <div style={styles.questMeta}>
        ⏱ {quest.time} min • ⭐ {quest.xp} XP • 👥 {quest.slots}
      </div>
    </div>
  );
}

/* =====================
   STYLE
===================== */

const styles = {
  main: {
    minHeight: "100vh",
    backgroundColor: "#0f0f0f",
    color: "#eaeaea",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "system-ui, sans-serif",
    padding: "2rem",
    textAlign: "center"
  },
  title: {
    fontSize: "2.4rem",
    marginBottom: "0.5rem"
  },
  subtitle: {
    opacity: 0.8,
    marginBottom: "2rem"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1.5rem",
    maxWidth: "320px",
    width: "100%"
  },
  card: {
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "12px",
    padding: "1.5rem 1rem",
    cursor: "pointer",
    color: "#eaeaea"
  },
  avatar: {
    fontSize: "2.5rem",
    marginBottom: "0.5rem"
  },
  panel: {
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "16px",
    padding: "2rem",
    marginBottom: "2rem",
    minWidth: "260px"
  },
  avatarBig: {
    fontSize: "3rem"
  },
  questWrapper: {
    width: "100%",
    maxWidth: "420px",
    textAlign: "left"
  },
  questCard: {
    background: "#161616",
    border: "1px solid #333",
    borderRadius: "12px",
    padding: "1rem",
    marginTop: "0.5rem"
  },
  questMeta: {
    fontSize: "0.85rem",
    opacity: 0.75,
    marginTop: "0.25rem"
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
