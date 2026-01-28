export default function PlayerPanel({ player, progress, loading }) {
  if (!player) {
    return <div className="player-panel">Ładowanie profilu…</div>;
  }

  if (loading || !progress) {
    return (
      <div className="player-panel">
        <img
          src={`/avatars/${player.avatar}`}
          alt={player.nick}
          className="player-avatar"
        />
        <div className="player-info">
          <h2>{player.nick}</h2>
          <p className="player-title">
            {player.active_title || player.title || "Nowicjusz Gildii"}
          </p>
          <p className="player-xp" style={{ color: '#a78bfa', opacity: 0.7 }}>
            ⏳ Ładowanie postępu…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="player-panel">
      <img
        src={`/avatars/${player.avatar}`}
        alt={player.nick}
        className="player-avatar"
      />

      <div className="player-info">
        <h2>{player.nick}</h2>
        <p className="player-title">
          {player.active_title || player.title || "Nowicjusz Gildii"}
        </p>
        <p className="player-xp">
          Poziom {progress.level} • {progress.xp} XP
        </p>
        {progress.level < 10 && (
          <p className="player-xp" style={{ fontSize: '0.85rem', opacity: 0.75 }}>
            {progress.xp_required - (progress.xp % progress.xp_required)} XP do lvl {progress.level + 1}
          </p>
        )}
        {progress.monthly_xp !== undefined && (
          <p className="player-xp" style={{ fontSize: '0.85rem', opacity: 0.75 }}>
            📅 Miesiąc: {progress.monthly_xp} XP
          </p>
        )}
      </div>
    </div>
  );
}
