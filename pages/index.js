import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

/* ===== KOMPONENTY ===== */
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

import { getNextAvailableText } from "../lib/dateUtils";

export default function Home() {
  /* ===== SESJA ===== */
  const [player, setPlayer] = useState(null);
  const [tab, setTab] = useState("main");
  const [loading, setLoading] = useState(false);

  /* ===== DANE GLOBALNE ===== */
  const [players, setPlayers] = useState([]);
  const [progress, setProgress] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [lastWinner, setLastWinner] = useState("—");

  const [quests, setQuests] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [slots, setSlots] = useState({});

  /* ============================================================
     LOGIN – ekran Netflixowy
     ============================================================ */
  if (!player) {
    return (
      <LoginScreen
        players={players}
        onSelect={setPlayer}
      />
    );
  }

  /* ============================================================
     ŁADOWANIE WSZYSTKICH DANYCH
     ============================================================ */
  useEffect(() => {
    if (!player) return;

    const loadAll = async () => {
      setLoading(true);

      /* --- reset miesiąca --- */
      await supabase.rpc("reset_month_if_needed");

      /* --- gracze --- */
      const { data: pl } = await supabase
        .from("players")
        .select("id, nick, avatar_url, title");

      setPlayers(pl ?? []);

      /* --- progress gracza --- */
      const { data: mp } = await supabase
        .from("monthly_progress")
        .select("*")
        .eq("player_id", player.id)
        .single();

      setProgress(mp ?? null);

      /* --- ranking miesiąca --- */
      const { data: rank } = await supabase
        .from("monthly_progress")
        .select("level, xp, players(nick)")
        .order("level", { ascending: false })
        .order("xp", { ascending: false });

      setRanking(
        (rank ?? []).map(r => ({
          nick: r.players?.nick ?? "—",
          level: r.level,
        }))
      );

      /* --- zwycięzca poprzedniego miesiąca --- */
      const { data: winner } = await supabase.rpc("last_month_winner");
      setLastWinner(winner ?? "—");

      /* --- questy --- */
      const { data: q } = await supabase
        .from("quests")
        .select("*");

      /* --- sloty questów --- */
      const { data: s } = await supabase
        .from("quest_slots")
        .select("quest_id, players(nick)");

      const slotMap = {};
      (s ?? []).forEach(row => {
        if (!slotMap[row.quest_id]) slotMap[row.quest_id] = [];
        slotMap[row.quest_id].push(row.players.nick);
      });
      setSlots(slotMap);

      /* --- rozdzielenie questów --- */
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

  /* ============================================================
     AKCJE QUESTÓW
     ============================================================ */
  const completeSolo = async quest => {
    setLoading(true);
    await supabase.rpc("complete_quest", {
      p_player_id: player.id,
      p_quest_id: quest.id,
    });
    setPlayer({ ...player }); // trigger reload
    setLoading(false);
  };

  const completeGroup = async (quest, secondPlayerId) => {
    setLoading(true);
    await supabase.rpc("complete_group_quest", {
      p_player_1: player.id,
      p_player_2: secondPlayerId,
      p_quest_id: quest.id,
    });
    setPlayer({ ...player });
    setLoading(false);
  };

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <Layout>
      <PlayerPanel player={player} progress={progress} />

      <RankingBar ranking={ranking} lastWinner={lastWinner} />

      <Tabs active={tab} onChange={setTab} />

      {loading && <p>⏳ Ładowanie danych…</p>}

      {/* ===== GŁÓWNA ===== */}
      {tab === "main" && (
        <>
          <QuestList
            quests={quests}
            slots={slots}
            players={players}
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
