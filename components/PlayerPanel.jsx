export default function PlayerPanel({ player, progress }) {
  if (!player || !progress) {
    return <div className="panel">Ładowanie profilu…</div>;
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
          {player.title || "Nowicjusz Gildii"}
        </p>
        <p className="player-xp">
          Poziom {progress.level} • XP {progress.xp}/{progress.xp_required}
        </p>
      </div>
    </div>
  );
}
