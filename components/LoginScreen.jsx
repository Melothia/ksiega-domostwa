export default function LoginScreen({ players, onSelect }) {
  return (
    <div className="container">
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>
        📘 Księga Domostwa
      </h1>

      <div className="login-grid">
        {players.map(p => (
          <div
            key={p.id}
            className="login-card"
            onClick={() => onSelect(p)}
          >
            <img
              src={p.avatar_url}
              alt={p.nick}
            />
            <h3>{p.nick}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}
