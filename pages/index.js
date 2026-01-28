import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import LoginScreen from "../components/LoginScreen";
import Layout from "../components/Layout"; // UWAGA: nazwa pliku = Layout.jsx
import Tabs from "../components/Tabs";
import PlayerPanel from "../components/PlayerPanel";
import RankingBar from "../components/RankingBar";

import QuestList from "../components/QuestList";
import UpcomingQuest from "../components/UpcomingQuest";

import AchievementsView from "../components/AchievementsView";
import ChronicleView from "../components/ChronicleView";
import ReceiptsView from "../components/ReceiptsView";

import { getNextAvailableText } from "../lib/dateUtils";

/* ===== STATYCZNA LISTA GRACZY ===== */
const PLAYERS = [
  {
    id: "b45ef046-f815-4eda-8015-d9212d9ac2ee",
    nick: "Melothy",
    avatar: "/Melothy.png",
    title: "Zaklinaczka Kurzu",
  },
  {
    id: "reu-id",
    nick: "Reu",
    avatar: "/Reu.png",
    title: "Cień Domostwa",
  },
  {
    id: "pshemcky-id",
    nick: "Pshemcky",
    avatar: "/Pshemcky.png",
    title: "Strażnik Natury",
  },
  {
    id: "benditt-id",
    nick: "Benditt",
    avatar: "/Benditt.png",
    title: "Koci Kleryk",
  },
];

export default function Home() {
  /* ===== STANY ===== */
  const [player, setPlayer] = useState(null);
  const [tab, setTab] = useState("main");
  const [loading, setLoading] = useState(false);

  const [progress, setProgress] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [lastWinner, setLastWinner] = useState("—");

  const [quests, setQuests] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [slots, setSlots] = useState({});

  /* ===== ŁADOWANIE DANYCH ===== */
  useEffect(() => {
    if (!player) return;

    const loadAll = async () => {
      setLoading(true);

      await supabase.rpc("reset_month_if_needed");

      const { data: mp } = await supabase
        .from("monthly_progress")
        .select("*")
        .eq("player_id", player.id)
        .single();

      setProgress(mp ?? null);

      const { data: rank } = await supabase
        .from("monthly_progress")
        .select("level, xp, players(nick)")
        .order("level", { ascending: false })
        .order("xp", { ascending: false });

      setRanking(
        (rank ?? []).map(r => ({
          nick: r.players?.nick,
          level: r.level,
        }))
      );

      const { data: winner } = await supabase.rpc("last_month_winner");
      setLastWinner(winner ?? "—");

      const { data: q } = await supabase.from("quests").select("*");

      const { data: s } = await supabase
        .from("quest_slots")
        .select("quest_id, players(nick)");

      const slotMap = {};
      (s ?? []).forEach(row => {
        if (!slotMap[row.quest_id]) slotMap[row.quest_id] = [];
        slotMap[row.quest_id].push(row.players.nick);
      });
      setSlots(slotMap);

      const active = [];
      const future = [];

      (q ?? []).forEach(quest => {
        if (quest.is_active) active.push(quest);
        else future.push(quest);
      });

      setQuests(active);
      setUpcoming(future);

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
    setPlayer({ ...player });
  };

  const completeGroup = async (quest, secondPlayerId) => {
    setLoading(true);
    await supabase.rpc("complete_group_quest", {
      p_player_1: player.id,
      p_player_2: secondPlayerId,
      p_quest_id: quest.id,
    });
    setLoading(false);
    setPlayer({ ...player });
  };

  /* ===== RENDER ===== */
  return (
    <Layout>
      {!player ? (
        <LoginScreen
          players={PLAYERS}
          onSelect={p => setPlayer(p)}
        />
      ) : (
        <>
          <PlayerPanel player={player} progress={progress} />

          <RankingBar ranking={ranking} lastWinner={lastWinner} />

          <Tabs active={tab} onChange={setTab} />

          {loading && <p>⏳ Ładowanie…</p>}

          {tab === "main" && (
            <>
              <QuestList
                quests={quests}
                slots={slots}
                players={PLAYERS}
                currentPlayer={player}
                onCompleteSolo={completeSolo}
                onCompleteGroup={completeGroup}
              />

              {upcoming.length > 0 && (
                <>
                  <h3>⏳ Nadchodzące</h3>
                  {upcoming.map(q => (
                    <UpcomingQuest
                      key={q.id}
                      quest={q}
                      availableText={getNextAvailableText(q)}
                    />
                  ))}
                </>
              )}
            </>
          )}

          {tab === "achievements" && (
            <AchievementsView playerId={player.id} />
          )}

          {tab === "chronicle" && <ChronicleView />}

          {tab === "receipts" && (
            <ReceiptsView playerId={player.id} />
          )}
        </>
      )}
    </Layout>
  );
}
