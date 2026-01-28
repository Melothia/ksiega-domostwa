// components/UpcomingQuest.jsx
// Quest „Nadchodzący” – tylko informacja, brak akcji

import { getNextAvailableText } from "../lib/dateUtils";

export default function UpcomingQuest({ quest }) {
  return (
    <div className="upcoming-quest">
      <strong>{quest.name}</strong>

      <div className="quest-meta">
        <div>⏳ {getNextAvailableText(quest)}</div>
        <div>⏱ {quest.time_minutes} min</div>
        <div>⭐ {quest.base_xp} XP</div>
      </div>
    </div>
  );
}
