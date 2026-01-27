import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://zhywdorfllurbkwzesii.supabase.co",
  "sb_publishable_dm5fyZedKgGD3OccGT2yDg_38bv-Efd"
);

const avatar = (seed) =>
  `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [player, setPlayer] = useState(null);
  const [progress, setProgress] = useState(null);
  const [quests, setQuests] = useState([]);
  const [tab, setTab] = useState("main");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(null);

  const shownRef = useRef(new Set());

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  useEffect(() => {
    supabase.from("players").select("*").then(({ data }) => {
      setPlayers(data || []);
    });
  }, []);

  async function loadPlayer(p) {
    setLoading(true);
    setPlayer(p);

    await supabase.rpc("ensure_monthly_progress", {
      p_player_id: p.id,
      p_year: year,
      p_month: month,
    });

    const { data: mp } = await supabase
      .from("monthly_progress")
      .select("*")
      .eq("player_id", p.id)
      .eq("year", year)
      .eq("month", month)
      .single();

    setProgress(mp);

    const { data: qs } = await supabase
      .from("quests_with_status")
      .select("*")
      .order("is_emergency", { ascending: false });

    setQuests(qs || []);
    setLoading(false);
  }

  async function completeQuest(q) {
    const { error } = await supabase.rpc("complete_quest", {
      p_player_id: player.id,
      p_quest_id: q.id,
    });

    if (error) {
      alert(error.message);
      return;
    }

    if (q.is_emergency && !shownRef.current.has(q.id)) {
      shownRef.current.add(q.id);
      setPopup("⚠ Emergency opanowane! +30% XP");
      setTimeout(() => setPopup(null), 4000);
    }

    loadPlayer(player);
  }

  if (!player) {
    return (
      <main style={styles.app}>
        <h1>📖 Księga Domostwa</h1>
        {players.map((p) => (
          <button
            key={p.id}
            style={styles.playerBtn}
            onClick={() => loadPlayer(p)}
          >
            <img src={p.avatar_url || avatar(p.nick)} style={styles.avatar} />
            {p.nick}
          </button>
        ))}
      </main>
    );
  }

  if (loading || !progress) {
    return <main style={styles.app}>⏳ Ładowanie profilu…</main>;
  }

  return (
    <main style={styles.app}>
      {/* PROFIL */}
      <section style={styles.card}>
        <img
          src={player.avatar_url || avatar(player.nick)}
          style={styles.avatarLarge}
        />
        <div>
          <strong>
            {player.nick}
            {player.active_title && (
              <span style={{ color: "#c9a86a" }}>
                {" "}
                · {player.active_title}
              </span>
            )}
          </strong>
          <div>
            Poziom {progress.level} · XP {progress.xp}/{progress.level * 100}
          </div>
        </div>
      </section>

      {/* TABS */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tabBtn,
            background: tab === "main" ? "#6b4f1d" : "#3a342a",
          }}
          onClick={() => setTab("main")}
        >
          🏠 Główna
        </button>
        <button
          style={{
            ...styles.tabBtn,
            background: tab === "achievements" ? "#6b4f1d" : "#3a342a",
          }}
          onClick={() => setTab("achievements")}
        >
          🏆 Osiągnięcia
        </button>
      </div>

      {/* QUESTY */}
      {tab === "main" &&
        quests.map((q) => {
          const bonusXp = q.is_emergency
            ? Math.ceil(q.base_xp * 1.3)
            : q.base_xp;

          return (
            <section
              key={q.id}
              style={{
                ...styles.card,
                background: q.is_emergency ? "#3a1f1f" : "#2a251d",
                border:
                  q.is_emergency && "2px solid rgba(255,90,90,0.8)",
                animation: q.is_emergency
                  ? "pulse 1.5s infinite"
                  : "none",
              }}
            >
              <strong>
                {q.is_emergency && "⚠ "} {q.name}
              </strong>

              {q.is_emergency && (
                <div style={styles.emergencyText}>
                  Alarm! Zadanie wymaga natychmiastowego działania.
                </div>
              )}

              <div style={{ fontSize: 14, marginTop: 6 }}>
                ⏱ {q.time_minutes} min ·{" "}
                {q.is_emergency ? (
                  <>
                    <span style={{ textDecoration: "line-through" }}>
                      ⭐ {q.base_xp}
                    </span>
                    <span style={{ color: "#ff6b5c", marginLeft: 6 }}>
                      ⚡ {bonusXp} XP (+30%)
                    </span>
                  </>
                ) : (
                  <>⭐ {q.base_xp} XP</>
                )}
              </div>

              <button
                style={{
                  ...styles.btn,
                  background: q.is_emergency ? "#b63c2d" : "#8a6a2f",
                }}
                onClick={() => completeQuest(q)}
              >
                Wykonaj
              </button>
            </section>
          );
        })}

      {/* POPUP */}
      {popup && <div style={styles.popup}>{popup}</div>}

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255,90,90,0.6); }
          70% { box-shadow: 0 0 0 10px rgba(255,90,90,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,90,90,0); }
        }
      `}</style>
    </main>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "#1e1b16",
    color: "#f4f1ea",
    padding: 20,
    fontFamily: "serif",
  },
  card: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  emergencyText: {
    fontSize: 13,
    color: "#ffb3b3",
    marginTop: 4,
    fontStyle: "italic",
  },
  tabs: { display: "flex", gap: 8, marginBottom: 12 },
  tabBtn: { flex: 1, padding: 10, border: "none", color: "#fff" },
  playerBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 10,
    marginBottom: 8,
    background: "#6b4f1d",
    border: "none",
    color: "#fff",
  },
  avatar: { width: 36, height: 36, borderRadius: "50%" },
  avatarLarge: { width: 64, height: 64, borderRadius: "50%" },
  btn: {
    marginTop: 8,
    padding: "6px 12px",
    border: "none",
    color: "white",
  },
  popup: {
    position: "fixed",
    bottom: 20,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#3a2f1d",
    padding: "12px 20px",
    borderRadius: 12,
    boxShadow: "0 0 12px rgba(0,0,0,0.6)",
    zIndex: 999,
  },
};
