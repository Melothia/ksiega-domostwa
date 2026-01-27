export default function Home() {
  return (
    <main style={{
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
    }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
        📜 Księga Domostwa
      </h1>

      <p style={{ maxWidth: 420, lineHeight: 1.6 }}>
        Przed wyruszeniem w drogę, zajrzyj do księgi.
      </p>

      <p style={{ marginTop: "2rem", opacity: 0.6 }}>
        Status: Gildia jeszcze śpi 💤
      </p>
    </main>
  );
}
