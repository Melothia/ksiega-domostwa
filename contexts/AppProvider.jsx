// contexts/AppProvider.jsx
// Combined provider - wraps all contexts

import { PlayerProvider } from "./PlayerContext";
import { GameProvider } from "./GameContext";
import { QuestProvider } from "./QuestContext";

export function AppProvider({ children }) {
  return (
    <PlayerProvider>
      <GameProvider>
        <QuestProvider>
          {children}
        </QuestProvider>
      </GameProvider>
    </PlayerProvider>
  );
}
