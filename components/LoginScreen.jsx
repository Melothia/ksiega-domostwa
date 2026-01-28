export default function LoginScreen({ players, onSelect }) {
  return (
    <div className="login-wrapper">
      <img src="/logo/Logo.png" alt="Logo" className="login-logo" />
      <p className="login-subtitle">
        Kto gra?
      </p>

      <div className="login-grid">
        {players.map(p => (
          <button
            key={p.id}
            className="login-avatar"
            onClick={() => onSelect(p)}
          >
            <img
              src={`/avatars/${p.avatar}`}
              alt={p.nick}
            />
            <span>{p.nick}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
