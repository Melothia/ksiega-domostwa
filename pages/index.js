import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/* =========================
   KONFIG
========================= */

const EMERGENCY_BONUS = 0.3; // +30%

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
     INIT
  ========================= */

  useEffect(() => {
    loadPlayers();
  }, []);

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

  /* =========================
     DATA LOAD
  ========================= */

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

  /* =========================
     QUESTY
  ========================= */

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
     LOGIN
  ========================= */

  if (!currentPlayer) {
    return (
      <div style={styles.login}>
        <h1>📖 Księga Domostwa</h1>
        <div style={styles.netflix}>
          {players.map(p => (
            <div key={p.id} style={styles.avatarCard} onClick={() => selectPlayer(p)}>
              <img src={p.avatar_url} style={styles.avatarBig} />
              <div>{p.nick}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* =========================
     DERIVED
  ========================= */

  const level = safe(progress?.level, 1);
  const xp = safe(progress?.xp, 0);
  const xpNext = xpToNext(level);

  const activeQuests = quests.filter(q => !q.next_available_at || new Date(q.next_available_at) <= new Date());
  const upcomingQuests = quests.filter(q => q.next_available_at && new Date(q.next_available_at) > new Date());

  /* =========================
     UI
  ========================= */

  return (
    <div style={styles.page}>
      {/* PANEL GRACZA */}
      <div style={styles.playerPanel}>
        <img src={currentPlayer.avatar_url} style={styles.avatar} />
        <div>
          <strong>{currentPlayer.nick}</strong>
          <div>{safe(currentPlayer.title)}</div>
          <div>Poziom {level} • XP {xp}/{xpNext}</div>
        </div>
      </div>

      {/* TABS */}
      <div style={styles.tabs}>
        {[
          ["main", "Główna"],
          ["achievements", "Osiągnięcia"],
          ["chronicle", "Kronika"],
          ["receipts", "Skrzynia"]
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={tab === key ? styles.tabActive : styles.tab}
          >
            {label}
          </button>
        ))}
      </div>

      {/* GŁÓWNA */}
      {tab === "main" && (
        <>
          <h3>🔥 Questy do wykonania</h3>

          {activeQuests.map(q => {
            const isEmergency = q.type === "emergency";
            const bonusXP = isEmergency ? Math.round(q.base_xp * EMERGENCY_BONUS) : 0;
            const totalXP = q.base_xp + bonusXP;

            return (
              <div key={q.id} style={isEmergency ? styles.questEmergency : styles.quest}>
                <strong>{q.name}</strong>
                <div>⏱ {q.time_minutes} min • ⭐ {q.base_xp} XP</div>
                {isEmergency && (
                  <div style={{ color: "#ff9b9b" }}>
                    ⚠️ Emergency: +{bonusXP} XP
                  </div>
                )}
                <div>➡️ Razem: {totalXP} XP</div>
                <button onClick={() => completeQuest(q.id)}>Wykonaj</button>
              </div>
            );
          })}

          <h3 style={{ opacity: 0.6 }}>⏳ Questy nadchodzące</h3>
          {upcomingQuests.map(q => (
            <div key={q.id} style={styles.upcoming}>
              <strong>{q.name}</strong>
              <div>⏱ {q.time_minutes} min • ⭐ {q.base_xp} XP</div>
            </div>
          ))}
        </>
      )}

      {/* OSIĄGNIĘCIA */}
      {tab === "achievements" && (
        <>
          <h3>🏆 Osiągnięcia</h3>
          {achievements.map(a => (
            <div key={a.id}>• {a.achievements?.title}</div>
          ))}
        </>
      )}

      {/* KRONIKA */}
      {tab === "chronicle" && (
        <>
          <h3>📜 Kronika</h3>
          {chronicle.length === 0 && <i>Brak wpisów</i>}
          {chronicle.map(c => (
            <div key={c.id} style={styles.chronicle}>
              <strong>{c.players?.nick}</strong>: {c.message}
            </div>
          ))}
        </>
      )}

      {/* SKRZYNIA */}
      {tab === "receipts" && (
        <>
          <h3>🧾 Skrzynia Paragonów</h3>
          {receipts.map(r => (
            <div key={r.id}>
              {r.players?.nick} • {r.amount} zł
            </div>
          ))}
        </>
      )}

      {loading && <div style={styles.loading}>⏳</div>}
    </div>
  );
}

/* =========================
   STYLE
========================= */

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(#1b102a,#0f081a)",
    color: "#eee",
    padding: 12
  },
  login: {
    minHeight: "100vh",
    background: "#0f081a",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },
  netflix: {
    display: "flex",
    gap: 24,
    flexWrap: "wrap",
    justifyContent: "center"
  },
  avatarCard: { cursor: "pointer", textAlign: "center" },
  avatarBig: { width: 120, borderRadius: "50%" },
  playerPanel: {
    display: "flex",
    gap: 12,
    background: "#2a1d44",
    padding: 12,
    borderRadius: 12
  },
  avatar: { width: 64, borderRadius: "50%" },
  tabs: { display: "flex", gap: 8, marginTop: 12 },
  tab: { flex: 1, padding: 8 },
  tabActive: { flex: 1, padding: 8, background: "#5c4b8a" },
  quest: {
    background: "#241a38",
    padding: 8,
    borderRadius: 8,
    marginTop: 8
  },
  questEmergency: {
    background: "#3a1c2b",
    padding: 8,
    borderRadius: 8,
    marginTop: 8
  },
  upcoming: {
    opacity: 0.4,
    padding: 8,
    borderRadius: 8
  },
  chronicle: {
    fontSize: 14,
    opacity: 0.85,
    marginBottom: 4
  },
  loading: {
    position: "fixed",
    bottom: 10,
    right: 10
  }
};
