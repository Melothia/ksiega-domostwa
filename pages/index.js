import { useEffect, useState } from "react";
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
  const [tab, setTab] = useState("main");
  const [loading, setLoading] = useState(false);

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
    setLoading(false);
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
    return <main style={styles.app}>⏳ Ładowanie…</main>;
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
          <strong style={{ fontSize: 18 }}>
            {player.nick}
            {player.active_title && (
              <span style={{ color: styles.gold.color }}>
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
            background: tab === "main" ? "#6f4bd8" : "#3a2c52",
          }}
          onClick={() => setTab("main")}
        >
          🏠 Główna
        </button>
        <button
          style={{
            ...styles.tabBtn,
            background: tab === "receipts" ? "#6f4bd8" : "#3a2c52",
          }}
          onClick={() => setTab("receipts")}
        >
          🧾 Paragony
        </button>
      </div>

      {tab === "main" && (
        <section style={styles.cardMuted}>
          <em>
            Tu wracają: questy, ranking miesiąca, questy nadchodzące.
          </em>
        </section>
      )}
    </main>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "#1b1625",
    color: "#f2eefc",
    padding: 20,
    fontFamily: "serif",
  },
  card: {
    background: "#2a2038",
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
  },
  cardMuted: {
    background: "#241c33",
    padding: 14,
    borderRadius: 14,
    opacity: 0.6,
  },
  tabs: {
    display: "flex",
    gap: 8,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    padding: 10,
    border: "none",
    color: "#fff",
    borderRadius: 10,
  },
  playerBtn: {
    display: "flex",
    gap: 10,
    padding: 12,
    background: "#3a2c52",
    border: "none",
    color: "#fff",
    marginBottom: 8,
    borderRadius: 10,
  },
  avatar: { width: 36, height: 36, borderRadius: "50%" },
  avatarLarge: { width: 64, height: 64, borderRadius: "50%" },
  gold: { color: "#c9a86a" },
};
