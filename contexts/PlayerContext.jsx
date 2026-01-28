// contexts/PlayerContext.jsx
// Player state management - current player, players list, title updates

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as api from "../lib/api";

const PlayerContext = createContext(null);

// Statyczna lista graczy (można później przenieść do bazy)
const STATIC_PLAYERS = [
  {
    id: "b45ef046-f815-4eda-8015-d9212d9ac2ee",
    nick: "Melothy",
    avatar: "melothy.png",
    title: "Zaklinaczka Mopa",
  },
  {
    id: "28258779-8e73-40bd-a6a2-cf59fda23642",
    nick: "Reu",
    avatar: "reu.png",
    title: "Cień Domostwa",
  },
  {
    id: "57e30c17-c29b-4755-872b-9edcd5c143a7",
    nick: "Pshemcky",
    avatar: "pshemcky.png",
    title: "Strażnik Natury",
  },
  {
    id: "922a75ba-ce4e-4796-b05e-afad4bfaacb1",
    nick: "Benditt",
    avatar: "benditt.png",
    title: "Koci Kleryk",
  },
];

export function PlayerProvider({ children }) {
  const [player, setPlayer] = useState(null);
  const [players] = useState(STATIC_PLAYERS);

  // Pobierz active_title z bazy po wybraniu gracza
  useEffect(() => {
    if (!player || player.active_title !== undefined) return;

    const loadTitle = async () => {
      try {
        const title = await api.fetchPlayerTitle(player.id);
        if (title) {
          setPlayer((prev) => ({ ...prev, active_title: title }));
        }
      } catch (err) {
        console.error("Error loading player title:", err);
      }
    };

    loadTitle();
  }, [player?.id]);

  const selectPlayer = useCallback((selectedPlayer) => {
    setPlayer({
      ...selectedPlayer,
      avatar_url: `/avatars/${selectedPlayer.avatar}`,
    });
  }, []);

  const updateTitle = useCallback(async (newTitle) => {
    if (!player) return;

    try {
      await api.updatePlayerTitle(player.id, newTitle);
      setPlayer((prev) => ({ ...prev, active_title: newTitle }));
    } catch (err) {
      console.error("Error updating title:", err);
      throw err;
    }
  }, [player?.id]);

  const logout = useCallback(() => {
    setPlayer(null);
  }, []);

  const value = {
    player,
    players,
    selectPlayer,
    updateTitle,
    logout,
    isLoggedIn: !!player,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }
  return context;
}
