// contexts/GameContext.jsx
// Game state - progress, ranking, monthly winner

import { createContext, useContext, useState, useCallback } from "react";
import * as api from "../lib/api";

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [progress, setProgress] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [lastWinner, setLastWinner] = useState("—");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadGameData = useCallback(async (playerId) => {
    if (!playerId) return;

    setLoading(true);
    setError(null);

    try {
      // Reset miesiąca jeśli trzeba
      await api.resetMonthIfNeeded();

      // Równoległe pobieranie danych
      const [progressData, rankingData, winnerData] = await Promise.all([
        api.fetchProgress(playerId),
        api.fetchRanking(),
        api.fetchLastWinner(),
      ]);

      setProgress(progressData);
      setRanking(rankingData);
      setLastWinner(winnerData);
    } catch (err) {
      console.error("Error loading game data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProgress = useCallback(async (playerId) => {
    if (!playerId) return;

    try {
      const [progressData, rankingData] = await Promise.all([
        api.fetchProgress(playerId),
        api.fetchRanking(),
      ]);

      setProgress(progressData);
      setRanking(rankingData);
    } catch (err) {
      console.error("Error refreshing progress:", err);
    }
  }, []);

  const value = {
    progress,
    ranking,
    lastWinner,
    loading,
    error,
    loadGameData,
    refreshProgress,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within GameProvider");
  }
  return context;
}
