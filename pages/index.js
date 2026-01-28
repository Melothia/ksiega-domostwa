// pages/index.js
// GŁÓWNA STRONA – pobiera questy z rotacją (RPC) i renderuje panel dzisiejszy
// NIE RUSZA innych zakładek, NIE usuwa istniejących komponentów

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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

/* ===== KONFIGURACJA GRACZY (STATYCZNA) ===== */
const PLAYERS = [
  {
    id: "b45ef046-f815-4eda-8015-d9212d9ac2ee",
    nick: "Melothy",
    avatar: "melothy.png",
    title: "Zaklinaczka Mopa",
  },
  {
    id: "reu-id",
    nick: "Reu",
    avatar: "reu.png",
    title: "Cień Domostwa",
  },
  {
    id: "pshemcky-id",
    nick: "Pshemcky",
    avatar: "pshemcky.png",
    title: "Strażnik Natury",
  },
  {
    id: "benditt-id",
    nick: "Benditt",
    avatar: "benditt.png",
    title: "Koci Kleryk",
  },
];

export default function Home() {
  /* ===== STANY GŁÓWNE ===== */
  const [player, setPlayer] = useState(null);
  const [tab, setTab] = useState("main");
  const [loading, setLoading] = useState(false);

  /* ===== DANE ===== */
  const [progress, setProgress] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [lastWinner, setLastWinner] = useState("—");

  const [questsEmergency, setQuestsEmergency] = useState([]);
  const [questsActive, setQuestsActive] = useState([]);
  const [questsUpcoming, setQuestsUpcoming] = useState([]);

  /* ===== LOGIN ===== */
  if (!player) {
    return (
      <LoginScreen
        players={PLAYERS.map(p => ({
          ...p,
          avatar_url: `/avatars/${p.avatar}`,
        }))}
        onSelect={setPlayer}
      />
    );
  }

  /* ===== ŁADOWANIE DANYCH ===== */
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);

      /* reset miesiąca jeśli trzeba */
      await supabase.rpc("reset_month_if_needed");

      /* progress gracza */
      const { data: mp } = await supabase
        .from("monthly_progress")
        .select("*")
        .eq("player_id", player.id)
        .single();

      setProgress(mp ?? null);

      /* ranking miesiąca */
      const { data: rank } = await supabase
        .from("monthly_progress")
        .select("players(nick), level, xp")
        .order("level", { ascending: false })
        .order("xp", { ascending: false });

      setRanking(
        (rank ?? []).map(r => ({
          nick: r.players?.nick,
          level: r.level,
        }))
      );

      /* gracz miesiąca poprzedniego */
      const { data: winner } = await supabase.rpc(
        "last_month_winner"
      );
      setLastWinner(winner ?? "—");

      /* QUESTY – ROTACJA */
      const { data: questData, error } = await supabase.rpc(
        "get_quests_for_today"
      );

      if (!error && questData) {
        setQuestsEmergency(questData.emergency ?? []);
        setQuestsActive(questData.active ?? []);
        setQuestsUpcoming(questData.upcoming ?? []);
      }

      setLoading(false);
    };

    loadAll();
  }, [player]);

  /* ===== AKCJE QUESTÓW ===== */
  const completeSolo = async quest => {
    setLoading(true);
    await supabase.rpc("complete_quest", {
      p_player_id: player.id,
      p_quest_id: quest.id,
    });
    setLoading(false);
  };

  const completeGroup = async (quest, secondPlayerId) => {
    setLoading(true);
    await supabase.rpc("complete_group_quest", {
      p_player_1: player.id,
      p_player_2: secondPlayerId,
      p_quest_id: quest.id,
    });
    setLoading(false);
  };

  /* ===== RENDER ===== */
  return (
    <Layout>
      <PlayerPanel
        player={{
          ...player,
          avatar_url: `/avatars/${player.avatar}`,
        }}
        progress={progress}
      />

      <RankingBar ranking={ranking} lastWinner={lastWinner} />

      <Tabs active={tab} onChange={setTab} />

      {loading && <p>⏳ Ładowanie…</p>}

      {/* ===== GŁÓWNA ===== */}
      {tab === "main" && (
        <>
          {questsEmergency.length > 0 && (
            <>
              <h3>🚨 Emergency</h3>
              <QuestList
                quests={questsEmergency}
                players={PLAYERS}
                currentPlayer={player}
                onCompleteSolo={completeSolo}
                onCompleteGroup={completeGroup}
              />
            </>
          )}

          <h3>📋 Do wykonania</h3>
          <QuestList
            quests={questsActive}
            players={PLAYERS}
            currentPlayer={player}
            onCompleteSolo={completeSolo}
            onCompleteGroup={completeGroup}
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
        <AchievementsView playerId={player.id} />
      )}

      {/* ===== KRONIKA ===== */}
      {tab === "chronicle" && <ChronicleView />}

      {/* ===== PARAGONY ===== */}
      {tab === "receipts" && (
        <ReceiptsView playerId={player.id} />
      )}
    </Layout>
  );
}
