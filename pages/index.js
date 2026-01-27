import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/* =========================
   BEZPIECZNY SUPABASE CLIENT
========================= */

function getSupabase() {
  if (typeof window === "undefined") return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createClient(url, key);
}

/* =========================
   KONFIG
========================= */

const EMERGENCY_BONUS = 0.3;

function xpToNext(level) {
  return level * 100;
}

function safe(v, fallback = "") {
  return v === null || v === undefined ? fallback : v;
}

/* =========================
   STRONA
========================= */

export default function Home() {
console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("SUPABASE KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const [supabase, setSupabase] = useState(null);

  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [progress, setProgress] = useState(null);

  const [quests, setQuests] = useState([]);
  const [chronicle, setChronicle] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [receipts, setReceipts] = useState([]);

  const [tab, setTab] = useState("main");
  const [loading, setLoading] = useState(false);

  /* =========================
     INIT (CLIENT ONLY)
  ========================= */

  useEffect(() => {
    const client = getSupabase();
    setSupabase(client);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    loadPlayers();
  }, [supabase]);

  /* =========================
     DATA LOAD
  ========================= */

  async function loadPlayers() {
    const { data } = await supabase
      .from("players")
      .select("*")
      .order("nick");
    setPlayers(data || []);
  }

  async function selectPlayer(player) {
    setCurrentPlayer(player);
    setLoading(true);

    await Promise.all([
      loadProgress(player.id),
      loadQuests(),
      loadChronicle(),
      loadAchievements(player.id),
      loadReceipts()
    ]);

    setLoading(false);
  }

  async function loadProgress(playerId) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const { data } = await supabase
      .from("monthly_progress")
      .select("*")
      .eq("player_id", playerId)
      .eq("year", year)
      .eq("month", month)
      .single();

    setProgress(data || { level: 1, xp: 0 });
  }

  async function loadQuests() {
    const { data } = await supabase.from("quests").select("*");
    setQuests(data || []);
  }

  async function loadChronicle() {
    const { data } = await supabase
      .from("chronicle")
      .select("*, players(nick, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(20);
    setChronicle(data || []);
  }

  async function loadAchievements(playerId) {
    const { data } = await supabase
      .from("player_achievements")
      .select("*, achievements(title)")
      .eq("player_id", playerId);
    setAchievements(data || []);
  }

  async function loadReceipts() {
    const { data } = await supabase
      .from("receipts")
      .select("*, players(nick)")
      .order("added_at", { ascending: false });
    setReceipts(data || []);
  }

  async function completeQuest(questId) {
    if (!currentPlayer) return;
    setLoading(true);

    await supabase.rpc("complete_quest", {
      p_player_id: currentPlayer.id,
      p_quest_id: questId
    });

    await Promise.all([
      loadProgress(currentPlayer.id),
      loadQuests(),
      loadChronicle()
    ]);

    setLoading(false);
  }

  /* =========================
     LOADING GUARD
  ========================= */

  if (!supabase || players.length === 0) {
  return (
    <div style={{ color: "#fff", padding: 20 }}>
      ⏳ Ładowanie danych...
    </div>
  );
}

if (!currentPlayer) {
  return (
    <div style={{ color: "#fff", padding: 20 }}>
      <h1>📖 Księga Domostwa</h1>

      {players.map(p => (
        <div
          key={p.id}
          style={{
            margin: "12px 0",
            padding: "12px",
            background: "#2a1f3d",
            borderRadius: 12,
            cursor: "pointer"
          }}
          onClick={() => selectPlayer(p)}
        >
          {p.nick}
        </div>
      ))}
    </div>
  );
}


  /* =========================
     LOGIN
  ========================= */

  if (!currentPlayer) {
    return (
      <div style={{ color: "#fff", padding: 20 }}>
        <h1>📖 Księga Domostwa</h1>
        {players.map(p => (
          <div key={p.id} onClick={() => selectPlayer(p)}>
            {p.nick}
          </div>
        ))}
      </div>
    );
  }

  /* =========================
     DERIVED
  ========================= */

  const level = safe(progress?.level, 1);
  const xp = safe(progress?.xp, 0);
  const xpNext = xpToNext(level);

  const now = new Date();
  const activeQuests = quests.filter(
    q => !q.next_available_at || new Date(q.next_available_at) <= now
  );
  const upcomingQuests = quests.filter(
    q => q.next_available_at && new Date(q.next_available_at) > now
  );

  /* =========================
     UI
  ========================= */

  return (
    <div style={{ color: "#eee", padding: 12 }}>
      <div>
        <strong>{currentPlayer.nick}</strong> • Poziom {level} • XP {xp}/{xpNext}
      </div>

      <div>
        {["main", "achievements", "chronicle", "receipts"].map(t => (
          <button key={t} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "main" && (
        <>
          <h3>Questy do wykonania</h3>
          {activeQuests.map(q => {
            const emergency = q.type === "emergency";
            const bonus = emergency ? Math.round(q.base_xp * EMERGENCY_BONUS) : 0;

            return (
              <div key={q.id}>
                <strong>{q.name}</strong>
                <div>⏱ {q.time_minutes} min • ⭐ {q.base_xp} XP</div>
                {emergency && <div>⚠️ Emergency +{bonus} XP</div>}
                <button onClick={() => completeQuest(q.id)}>Wykonaj</button>
              </div>
            );
          })}

          <h4>Nadchodzące</h4>
          {upcomingQuests.map(q => (
            <div key={q.id} style={{ opacity: 0.4 }}>
              {q.name}
            </div>
          ))}
        </>
      )}

      {tab === "chronicle" &&
        chronicle.map(c => (
          <div key={c.id}>
            {c.players?.nick}: {c.message}
          </div>
        ))}
    </div>
  );
}
