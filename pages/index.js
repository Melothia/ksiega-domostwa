import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [player, setPlayer] = useState(null);
  const [tab, setTab] = useState("main");
  const [loading, setLoading] = useState(false);

  const [progress, setProgress] = useState(null);
  const [quests, setQuests] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [slots, setSlots] = useState({});

  // ==== LOGIN ====
  const PLAYERS = [
    { id: "b45ef046-f815-4eda-8015-d9212d9ac2ee", nick: "Melothy", avatar: "/Melothy.png" },
    { id: "reu-id", nick: "Reu", avatar: "/Reu.png" },
    { id: "pshemcky-id", nick: "Pshemcky", avatar: "/Pshemcky.png" },
    { id: "benditt-id", nick: "Benditt", avatar: "/Benditt.png" }
  ];

  // ==== LOAD DATA ====
  useEffect(() => {
    if (!player) return;

    const load = async () => {
      setLoading(true);

      await supabase.rpc("reset_month_if_needed");

      const { data: mp } = await supabase
        .from("monthly_progress")
        .select("*")
        .eq("player_id", player.id)
        .single();

      const { data: q } = await supabase
        .from("quests")
        .select("*")
        .order("quest_type", { ascending: false });

      const { data: s } = await supabase
        .from("quest_slots")
        .select("quest_id, player_id, players(nick)");

      setProgress(mp);

      const active = [];
      const upcomingList = [];
      const slotMap = {};

      s?.forEach(sl => {
        if (!slotMap[sl.quest_id]) slotMap[sl.quest_id] = [];
        slotMap[sl.quest_id].push(sl.players?.nick);
      });

      q?.forEach(quest => {
        const lastDone = quest.last_completed_at
          ? new Date(quest.last_completed_at)
          : null;

        const nextDue = lastDone
          ? new Date(lastDone.getTime() + quest.frequency_days * 86400000)
          : new Date(0);

        if (nextDue > new Date()) {
          upcomingList.push({ ...quest, nextDue });
        } else {
          active.push(quest);
        }
      });

      setQuests(active);
      setUpcoming(upcomingList);
      setSlots(slotMap);

      setLoading(false);
    };

    load();
  }, [player]);

  // ==== ACTIONS ====
  const doQuest = async quest => {
    setLoading(true);
    await supabase.rpc("complete_quest", {
      p_player_id: player.id,
      p_quest_id: quest.id
    });
    setLoading(false);
    setPlayer({ ...player }); // reload
  };

  // ==== RENDER ====
  if (!player) {
    return (
      <div style={{ padding: 20 }}>
        <h1>📘 Księga Domostwa</h1>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {PLAYERS.map(p => (
            <div key={p.id} className="card" onClick={() => setPlayer(p)}>
              <img src={p.avatar} style={{ width: "100%", borderRadius: "50%" }} />
              <h3 style={{ textAlign: "center" }}>{p.nick}</h3>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div className="card">
        <strong>{player.nick}</strong><br />
        Poziom {progress?.level ?? 1} · XP {progress?.xp ?? 0}/{(progress?.level ?? 1) * 100}
      </div>

      <div className="tabs">
        <div className={`tab ${tab === "main" ? "active" : ""}`} onClick={() => setTab("main")}>Główna</div>
        <div className={`tab ${tab === "chronicle" ? "active" : ""}`} onClick={() => setTab("chronicle")}>Kronika</div>
        <div className={`tab ${tab === "achievements" ? "active" : ""}`} onClick={() => setTab("achievements")}>Osiągnięcia</div>
        <div className={`tab ${tab === "receipts" ? "active" : ""}`} onClick={() => setTab("receipts")}>Skrzynia</div>
      </div>

      {loading && <p>⏳ Ładowanie…</p>}

      {tab === "main" && (
        <>
          <h3>🚨 Emergency</h3>
          {quests.filter(q => q.quest_type === "emergency").map(q => (
            <div key={q.id} className="card">
              <strong>{q.name}</strong><br />
              ⏱ {q.time_minutes} min · ⭐ {Math.floor(q.base_xp * 1.5)} XP (BONUS)<br />
              👥 Sloty: {slots[q.id]?.join(", ") || "wolne"}
              <button onClick={() => doQuest(q)}>Wykonaj</button>
            </div>
          ))}

          <h3>📋 Do wykonania</h3>
          {quests.filter(q => q.quest_type !== "emergency").map(q => (
            <div key={q.id} className="card">
              <strong>{q.name}</strong><br />
              ⏱ {q.time_minutes} min · ⭐ {q.base_xp} XP<br />
              👥 Sloty: {slots[q.id]?.join(", ") || "wolne"}
              <button onClick={() => doQuest(q)}>Wykonaj</button>
            </div>
          ))}

          <h3>⏳ Nadchodzące</h3>
          {upcoming.map(q => (
            <div key={q.id} className="card" style={{ opacity: 0.5 }}>
              <strong>{q.name}</strong><br />
              Dostępne: {q.nextDue.toLocaleDateString()}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
