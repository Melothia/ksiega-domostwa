import { useEffect, useState } from "react";

const PLAYERS = [
  { id: "melothy", name: "Melothy", avatar: "🏹" },
  { id: "pshemcky", name: "Pshemcky", avatar: "🌿" },
  { id: "reu", name: "Reu", avatar: "🗡️" },
  { id: "benditt", name: "Benditt", avatar: "✨" }
];

export default function Home() {
  const [player, setPlayer] = useState(null);

  // ⬇️ wczytanie gracza po odświeżeniu
  useEffect(() => {
    const saved = localStorage.getItem("ksiega_player");
    if (saved) {
      setPlayer(JSON.parse(saved));
    }
  }, []);

  function selectPlayer(p) {
    localStorage.setItem("ksiega_player", JSON.stringify(p));
    setPlayer(p);
  }

  function logout() {
    localStorage.removeItem("ksiega_player");
    setPlayer(null);
  }

  // 🧙 PANEL GILDII
  if (player) {
    return (
      <main style={styles.main}>
        <h1 style={styles.title}>📜 Księga Domostwa</h1>

        <div style={styles.panel}>
          <div style={styles.avatarBig}>{player.avatar}</div>
          <h2>{player.name}</h2>
          <p style={{ opacity: 0.7 }}>
            Poziom: 1 • XP: 0
          </p>
        </div>

        <button onClick={logout} style={styles.logout}>
          Zmień bohatera
        </button>
      </main>
    );
  }

  // 🎭 WYBÓR PROFILU
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
    textAlign: "center",
    padding: "2rem"
  },
  title: {
    fontSize: "2.5rem",
    marginBottom: "0.5rem"
  },
  subtitle: {
    marginBottom: "2rem",
    opacity: 0.8
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1.5rem",
    width: "100%",
    maxWidth: "320px"
  },
  card: {
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "12px",
    padding: "1.5rem 1rem",
    cursor: "pointer",
    color: "#eaeaea",
    fontSize: "1rem"
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
    marginTop: "1rem",
    minWidth: "260px"
  },
  avatarBig: {
    fontSize: "3rem",
    marginBottom: "0.5rem"
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
