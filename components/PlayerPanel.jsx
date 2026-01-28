export default function PlayerPanel({ player, progress }) {
  if (!player || !progress) {
    return <div className="player-panel">⏳ Ładowanie profilu…</div>;
  }

  return (
    <div className="player-panel">
      <img
        src={player.avatar}
        alt={player.nick}
        className="player-avatar"
        onError={e => {
          e.currentTarget.src = "/avatars/default.png";
        }}
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
