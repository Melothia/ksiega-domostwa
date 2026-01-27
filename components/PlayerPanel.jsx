export default function PlayerPanel({ player, progress }) {
  if (!player || !progress) {
    return <div className="panel">Ładowanie profilu…</div>;
  }

  return (
    <div className="player-panel">
      <img
        src={player.avatar_url}
        alt={player.nick}
        className="avatar"
      />

      <div className="player-info">
        <h2>{player.nick}</h2>
        <p>{player.title || "Nowicjusz Gildii"}</p>
        <p>
          Poziom {progress.level} • XP {progress.xp}/{progress.xp_required}
        </p>
      </div>
    </div>
  );
}
