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
  const [achievements, setAchievements] = useState([]);
  const [owned, setOwned] = useState([]);
  const [ownedFull, setOwnedFull] = useState([]);
  const [tab, setTab] = useState("main");
  const [loading, setLoading] = useState(false);

  const [popup, setPopup] = useState(null);
  const shownRef = useRef(new Set());

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  /* LOAD PLAYERS */
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

    const { data: ach } = await supabase
      .from("achievements")
      .select("*")
      .order("title");

    setAchievements(ach || []);

    const { data: pa } = await supabase
      .from("player_achievements")
      .select("achievement_id, unlocked_at, achievements(title)")
      .eq("player_id", p.id);

    const ids = (pa || []).map((x) => x.achievement_id);
    setOwned(ids);
    setOwnedFull(pa || []);

    // 🎉 POPUP: nowy achievement
    (pa || []).forEach((a) => {
      if (!shownRef.current.has(a.achievement_id)) {
        shownRef.current.add(a.achievement_id);
        setPopup(a.achievements.title);
        setTimeout(() => setPopup(null), 4000);
      }
    });

    setLoading(false);
  }

  async function setTitle(title) {
    await supabase
      .from("players")
      .update({ active_title: title })
      .eq("id", player.id);

    setPlayer({ ...player, active_title: title });
  }

  /* PLAYER SELECT */
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

      {/* MAIN */}
      {tab === "main" && (
        <section style={styles.card}>
          <em>Tu wracają questy, kronika i gameplay.</em>
        </section>
      )}

      {/* ACHIEVEMENTS */}
      {tab === "achievements" && (
        <section style={styles.card}>
          <h3>🏆 Osiągnięcia</h3>
          {achievements.map((a) => {
            const unlocked = owned.includes(a.id);
            return (
              <div
                key={a.id}
                style={{
                  ...styles.line,
                  opacity: unlocked ? 1 : 0.35,
                  cursor: unlocked ? "pointer" : "default",
                }}
                onClick={() => unlocked && setTitle(a.title)}
              >
                <strong>{a.title}</strong>
                <div style={{ fontSize: 13, color: "#bbb" }}>
                  {a.condition}
                </div>
                {unlocked && (
                  <div style={{ fontSize: 12, color: "#c9a86a" }}>
                    Kliknij, aby ustawić tytuł
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* 🎉 POPUP */}
      {popup && (
        <div style={styles.popup}>
          🏆 Nowe osiągnięcie!
          <div style={{ fontWeight: "bold", marginTop: 4 }}>{popup}</div>
        </div>
      )}
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
    background: "#2a251d",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
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
  line: { padding: 10, borderBottom: "1px solid #3a342a" },
  popup: {
    position: "fixed",
    bottom: 20,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#3a2f1d",
    padding: "12px 20px",
    borderRadius: 12,
    boxShadow: "0 0 12px rgba(0,0,0,0.6)",
    color: "#f4f1ea",
    zIndex: 999,
    textAlign: "center",
  },
};
