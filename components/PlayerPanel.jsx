export default function PlayerPanel({ player, progress }) {
  const level = progress?.level ?? 1;
  const xp = progress?.xp ?? 0;
  const nextXp = level * 100;
  const percent = Math.min(100, Math.floor((xp / nextXp) * 100));

  return (
    <div className="card strong">
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <img
          src={player.avatar}
          alt={player.nick}
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: "2px solid var(--gold)",
          }}
        />

        <div style={{ flex: 1 }}>
          <strong>{player.nick}</strong>
          <div>
            Poziom {level} · XP {xp}/{nextXp}
          </div>

          <div
            style={{
              height: 8,
              background: "rgba(255,255,255,0.15)",
              borderRadius: 6,
              overflow: "hidden",
              marginTop: 6,
            }}
          >
            <div
              style={{
                width: `${percent}%`,
                height: "100%",
                background: "var(--gold)",
              }}
            />
          </div>

          {player.title && (
            <small>Tytuł: {player.title}</small>
          )}
        </div>
      </div>
    </div>
  );
}
