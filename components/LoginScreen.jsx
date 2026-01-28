export default function LoginScreen({ players, onSelect }) {
  return (
    <div className="login-container">
      <h1 className="login-title">📘 Księga Domostwa</h1>

      <div className="login-grid">
        {players.map(p => (
          <button
            key={p.id}
            className="login-card"
            onClick={() => onSelect(p)}
          >
            <img
              src={p.avatar_url}
              alt={p.nick}
              className="login-avatar"
              onError={e => {
                e.currentTarget.src = "/avatars/default.png";
              }}
            />
            <span className="login-nick">{p.nick}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
