export default function LoginScreen({ players, onSelect }) {
  return (
    <div className="login-wrapper">
      <h1 className="login-title">📘 Księga Domostwa</h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '40px', color: '#999' }}>
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
