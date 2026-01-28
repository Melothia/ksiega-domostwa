// contexts/QuestContext.jsx
// Quest state - emergency, active, upcoming quests + actions

import { createContext, useContext, useState, useCallback } from "react";
import * as api from "../lib/api";

const QuestContext = createContext(null);

export function QuestProvider({ children }) {
  const [questsEmergency, setQuestsEmergency] = useState([]);
  const [questsActive, setQuestsActive] = useState([]);
  const [questsUpcoming, setQuestsUpcoming] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadQuests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { emergency, active, upcoming } = await api.fetchQuests();
      setQuestsEmergency(emergency);
      setQuestsActive(active);
      setQuestsUpcoming(upcoming);
    } catch (err) {
      console.error("Error loading quests:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const completeSolo = useCallback(async (playerId, questId) => {
    setLoading(true);
    setError(null);

    try {
      await api.completeQuest(playerId, questId);
      await loadQuests(); // Refresh after completion
    } catch (err) {
      console.error("Error completing quest:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadQuests]);

  const completeGroup = useCallback(async (player1Id, player2Id, questId) => {
    setLoading(true);
    setError(null);

    try {
      await api.completeGroupQuest(player1Id, player2Id, questId);
      await loadQuests(); // Refresh after completion
    } catch (err) {
      console.error("Error completing group quest:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadQuests]);

  const value = {
    questsEmergency,
    questsActive,
    questsUpcoming,
    loading,
    error,
    loadQuests,
    completeSolo,
    completeGroup,
  };

  return (
    <QuestContext.Provider value={value}>
      {children}
    </QuestContext.Provider>
  );
}

export function useQuests() {
  const context = useContext(QuestContext);
  if (!context) {
    throw new Error("useQuests must be used within QuestProvider");
  }
  return context;
}
