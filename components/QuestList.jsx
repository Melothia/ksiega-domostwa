import QuestCard from "./QuestCard";

export default function QuestList({
  quests,
  slots,
  players,
  currentPlayer,
  onCompleteSolo,
  onCompleteGroup,
}) {
  const emergency = quests.filter(q => q.quest_type === "emergency");
  const normal = quests.filter(q => q.quest_type !== "emergency");

  return (
    <>
      {emergency.length > 0 && (
        <>
          <h3>🚨 Emergency</h3>
          {emergency.map(q => (
            <QuestCard
              key={q.id}
              quest={q}
              slots={slots[q.id]}
              players={players}
              currentPlayer={currentPlayer}
              onCompleteSolo={onCompleteSolo}
              onCompleteGroup={onCompleteGroup}
            />
          ))}
        </>
      )}

      <h3>📋 Do wykonania</h3>
      {normal.map(q => (
        <QuestCard
          key={q.id}
          quest={q}
          slots={slots[q.id]}
          players={players}
          currentPlayer={currentPlayer}
          onCompleteSolo={onCompleteSolo}
          onCompleteGroup={onCompleteGroup}
        />
      ))}
    </>
  );
}
