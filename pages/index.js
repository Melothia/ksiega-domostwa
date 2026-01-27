import { useState } from "react";

const PLAYERS = [
  { id: "melothy", name: "Melothy", avatar: "🏹" },
  { id: "pshemcky", name: "Pshemcky", avatar: "🌿" },
  { id: "reu", name: "Reu", avatar: "🗡️" },
  { id: "benditt", name: "Benditt", avatar: "✨" }
];

export default function Home() {
  const [player, setPlayer] = useState(null);

  if (player) {
    return (
      <main style={styles.main}>
        <h1 style={styles.title}>📜 Księga Domostwa</h1>
        <p style={styles.subtitle}>
          Witaj, <strong>{player.name}</strong>.
        </p>
        <p style={{ opacity: 0.7 }}>
          Gildia czeka na Twoje działania…
        </p>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <h1 style={styles.title}>📜 Księga Domostwa</h1>
      <p style={styles.subtitle}>
        Wybierz swojego bohatera
      </p>

      <div style={styles.grid}>
        {PLAYERS.map(p => (
          <button
            key={p.id}
            onClick={() => setPlayer(p)}
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
  }
};

