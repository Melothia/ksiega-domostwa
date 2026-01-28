// components/UpcomingQuest.jsx
// Quest „Nadchodzący” – tylko informacja, brak akcji

export default function UpcomingQuest({ quest }) {
  return (
    <div className="upcoming-quest">
      <strong>{quest.name}</strong>

      <div className="quest-meta">
        <div>⏳ wkrótce</div>
        <div>⏱ {quest.time_minutes} min</div>
        <div>⭐ {quest.base_xp} XP</div>
      </div>
    </div>
  );
}
