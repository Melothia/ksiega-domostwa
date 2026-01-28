// components/QuestList.jsx
// Renderuje listę questów „Emergency” lub „Do wykonania”
// Obsługuje: solo, grupowe, XP (w tym emergency), czas, wybór gracza

import { useState } from "react";

export default function QuestList({
  quests,
  players,
  currentPlayer,
  onCompleteSolo,
  onCompleteGroup,
}) {
  const [groupTarget, setGroupTarget] = useState({});

  if (!quests || quests.length === 0) {
    return <p style={{ opacity: 0.6 }}>Brak questów.</p>;
  }

  return (
    <div>
      {quests.map(quest => {
        const selectedHelper = groupTarget[quest.id] ?? "";

        return (
          <div key={quest.id} className="card">
            <strong>{quest.name}</strong>

            <div className="quest-meta">
              <div>⏱ {quest.time_minutes} min</div>
              <div>
                ⭐{" "}
                {quest.status === "emergency"
                  ? `${quest.base_xp} XP + 30% = ${quest.final_xp} XP`
                  : `${quest.base_xp} XP`}
              </div>
            </div>

            {/* SOLO */}
            {quest.max_slots <= 1 && (
              <button
                style={{ marginTop: 8 }}
                onClick={() => onCompleteSolo(quest)}
              >
                Wykonaj
              </button>
            )}

            {/* GRUPOWY */}
            {quest.max_slots > 1 && (
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => onCompleteSolo(quest)}
                >
                  Wykonaj samodzielnie
                </button>

                <select
                  style={{ width: "100%", marginTop: 6 }}
                  value={selectedHelper}
                  onChange={e =>
                    setGroupTarget({
                      ...groupTarget,
                      [quest.id]: e.target.value,
                    })
                  }
                >
                  <option value="">
                    Wybierz gracza do pomocy…
                  </option>
                  {players
                    .filter(p => p.id !== currentPlayer.id)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nick}
                      </option>
                    ))}
                </select>

                {selectedHelper && (
                  <button
                    style={{ marginTop: 6 }}
                    onClick={() => {
                      onCompleteGroup(quest, selectedHelper);
                      setGroupTarget({
                        ...groupTarget,
                        [quest.id]: "",
                      });
                    }}
                  >
                    Wykonaj razem
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
