// pages/index.js
// GŁÓWNA STRONA – wykorzystuje Context API do zarządzania stanem

import { useEffect, useState } from "react";

import { usePlayer } from "../contexts/PlayerContext";
import { useGame } from "../contexts/GameContext";
import { useQuests } from "../contexts/QuestContext";

import LoginScreen from "../components/LoginScreen";
import Layout from "../components/Layout";
import Tabs from "../components/Tabs";
import PlayerPanel from "../components/PlayerPanel";
import RankingBar from "../components/RankingBar";

import QuestList from "../components/QuestList";
import UpcomingQuest from "../components/UpcomingQuest";

import AchievementsView from "../components/AchievementsView";
import ChronicleView from "../components/ChronicleView";
import ReceiptsView from "../components/ReceiptsView";

import { Loading } from "../components/ui/Loading";

export default function Home() {
  const { player, players, selectPlayer, updateTitle } = usePlayer();
  const { progress, ranking, lastWinner, loading: gameLoading, loadGameData, refreshProgress } = useGame();
  const { 
    questsEmergency, 
    questsActive, 
    questsUpcoming, 
    loading: questLoading, 
    loadQuests, 
    completeSolo, 
    completeGroup 
  } = useQuests();

  const [tab, setTab] = useState("main");

  const loading = gameLoading || questLoading;

  /* ===== ŁADOWANIE DANYCH PO ZALOGOWANIU ===== */
  useEffect(() => {
    if (player) {
      loadGameData(player.id);
      loadQuests();
    }
  }, [player?.id]);

  /* ===== ODŚWIEŻANIE PRZY ZMIANIE ZAKŁADKI ===== */
  useEffect(() => {
    if (player && tab === "main") {
      loadQuests();
    }
  }, [tab, player?.id]);

  /* ===== AKCJE QUESTÓW ===== */
  const handleCompleteSolo = async (quest) => {
    await completeSolo(player.id, quest.id);
    await refreshProgress(player.id);
    await loadQuests();
  };

  const handleCompleteGroup = async (quest, secondPlayerId) => {
    await completeGroup(player.id, secondPlayerId, quest.id);
    await refreshProgress(player.id);
    await loadQuests();
  };

  /* ===== ODŚWIEŻENIE PO DODANIU PARAGONU ===== */
  const handleDataRefresh = async () => {
    await refreshProgress(player.id);
    await loadQuests();
  };

  /* ===== LOGIN ===== */
  if (!player) {
    return (
      <LoginScreen
        players={players.map(p => ({
          ...p,
          avatar_url: `/avatars/${p.avatar}`,
        }))}
        onSelect={selectPlayer}
      />
    );
  }

  /* ===== RENDER ===== */
  return (
    <Layout>
      <PlayerPanel
        player={{
          ...player,
          avatar_url: `/avatars/${player.avatar}`,
        }}
        progress={progress}
        loading={gameLoading}
      />

      <RankingBar ranking={ranking} lastWinner={lastWinner} />

      <Tabs active={tab} onChange={setTab} />

      {loading && <Loading />}

      {!loading && !progress && (
        <div style={{ 
          padding: '20px', 
          background: 'rgba(251, 191, 36, 0.1)', 
          borderRadius: '12px', 
          border: '1px solid rgba(251, 191, 36, 0.3)',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#fbbf24', marginTop: 0 }}>⚠️ Baza danych nie jest skonfigurowana</h3>
          <p style={{ margin: '8px 0' }}>Sprawdź konsolę przeglądarki (F12) aby zobaczyć szczegóły błędów.</p>
          <p style={{ margin: '8px 0', fontSize: '0.9rem', opacity: 0.8 }}>
            Upewnij się, że w Supabase istnieją:
          </p>
          <ul style={{ marginLeft: '20px', fontSize: '0.9rem' }}>
            <li>Tabela <code>monthly_progress</code></li>
            <li>Tabela <code>players</code></li>
            <li>Tabela <code>quests</code></li>
            <li>Funkcje RPC: <code>reset_month_if_needed</code>, <code>get_quests_for_today</code>, <code>last_month_winner</code></li>
          </ul>
        </div>
      )}

      {/* ===== GŁÓWNA ===== */}
      {tab === "main" && (
        <>
          {questsEmergency.length > 0 && (
            <>
              <h3>🚨 Emergency</h3>
              <QuestList
                quests={questsEmergency}
                players={players}
                currentPlayer={player}
                onCompleteSolo={handleCompleteSolo}
                onCompleteGroup={handleCompleteGroup}
              />
            </>
          )}

          <h3>📋 Do wykonania</h3>
          <QuestList
            quests={questsActive}
            players={players}
            currentPlayer={player}
            onCompleteSolo={handleCompleteSolo}
            onCompleteGroup={handleCompleteGroup}
          />

          {questsUpcoming.length > 0 && (
            <>
              <h3>⏳ Nadchodzące</h3>
              {questsUpcoming.map(q => (
                <UpcomingQuest key={q.id} quest={q} />
              ))}
            </>
          )}
        </>
      )}

      {/* ===== OSIĄGNIĘCIA ===== */}
      {tab === "achievements" && (
        <AchievementsView 
          key="achievements" 
          playerId={player.id} 
          onTitleChange={updateTitle} 
        />
      )}

      {/* ===== KRONIKA ===== */}
      {tab === "chronicle" && <ChronicleView key="chronicle" />}

      {/* ===== PARAGONY ===== */}
      {tab === "receipts" && (
        <ReceiptsView 
          key="receipts" 
          playerId={player.id} 
          onDataChange={handleDataRefresh} 
        />
      )}
    </Layout>
  );
}
