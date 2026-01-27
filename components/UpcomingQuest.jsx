export default function UpcomingQuest({ quest, availableText }) {
  return (
    <div className="card upcoming">
      <strong>{quest.name}</strong>
      <div className="quest-meta">
        <div>⏳ {availableText}</div>
        <div>⏱ {quest.time_minutes} min</div>
        <div>⭐ {quest.base_xp} XP</div>
      </div>
    </div>
  );
}
