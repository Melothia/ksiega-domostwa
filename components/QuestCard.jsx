import { useState } from "react";
import {
  isEmergency,
  isGroupQuest,
  xpLabel,
  timeLabel,
  slotsLabel,
  canDoGroup,
} from "../lib/questLogic";

export default function QuestCard({
  quest,
  slots,
  players,
  currentPlayer,
  onCompleteSolo,
  onCompleteGroup,
}) {
  const [showGroup, setShowGroup] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  return (
    <div className="card">
      {isEmergency(quest) && (
        <div className="badge-emergency">🚨 Emergency · +30% XP</div>
      )}

      <strong>{quest.name}</strong>

      <div className="quest-meta">
        <div>⏱ {timeLabel(quest)}</div>
        <div>⭐ {xpLabel(quest)}</div>
        <div>👥 {slotsLabel(quest, slots)}</div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={() => onCompleteSolo(quest)}>
          Wykonaj
        </button>

        {isGroupQuest(quest) && (
          <button
            className="secondary"
            disabled={!canDoGroup(quest, slots)}
            onClick={() => setShowGroup(!showGroup)}
          >
            Wykonaj razem
          </button>
        )}
      </div>

      {showGroup && (
        <div style={{ marginTop: 8 }}>
          <small>Wybierz drugiego gracza:</small>

          <select
            style={{ width: "100%", marginTop: 6 }}
            value={selectedPlayer ?? ""}
            onChange={e => setSelectedPlayer(e.target.value)}
          >
            <option value="">— wybierz —</option>
            {players
              .filter(p => p.id !== currentPlayer.id)
              .map(p => (
                <option key={p.id} value={p.id}>
                  {p.nick}
                </option>
              ))}
          </select>

          <button
            style={{ marginTop: 6 }}
            disabled={!selectedPlayer}
            onClick={() => {
              onCompleteGroup(quest, selectedPlayer);
              setShowGroup(false);
              setSelectedPlayer(null);
            }}
          >
            Potwierdź wykonanie razem
          </button>
        </div>
      )}
    </div>
  );
}
