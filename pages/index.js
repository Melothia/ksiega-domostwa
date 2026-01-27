import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://zhywdorfllurbkwzesii.supabase.co",
  "sb_publishable_dm5fyZedKgGD3OccGT2yDg_38bv-Efd"
);

const avatar = (seed) =>
  `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;

const rewards = {
  Reu: "🎬 Wyjście do Kina",
  Melothy: "🎲 Wieczór Planszówkowy",
  Pshemcky: "🏃 Wspólna Aktywność Sportowa",
  Benditt: "🍜 Wyjście na Ramen",
};

const medals = ["🥇", "🥈", "🥉", "🎖️"];

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [player, setPlayer] = useState(null);
  const [progress, setProgress] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [activeQuests, setActiveQuests] = useState([]);
  const [upcomingQuests, setUpcomingQuests] = useState([]);
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

    const { data: rank } = await supabase
      .from("monthly_progress")
      .select("xp, players(nick)")
      .eq("year", year)
      .eq("month", month)
      .order("xp", { ascending: false });

    setRanking(rank || []);

    const { data: quests } = await supabase
      .from("quests")
      .select("*");

    const nowTs = new Date();

    const active = [];
    const upcoming = [];

    (quests || []).forEach((q) => {
      if (q.next_available_at && new Date(q.next_available_at) > nowTs) {
        upcoming.push(q);
      } else {
        active.push(q);
      }
    });

    setActiveQuests(active);
    setUpcomingQuests(upcoming);

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

      {/* RANKING */}
      <section style={styles.rankBar}>
        {ranking.map((r, i) => (
          <div key={i} style={styles.rankItem}>
            <span>{medals[i]}</span>
            <strong>{r.players.nick}</strong>
            {i === 0 && rewards[r.players.nick] && (
              <span style={styles.reward}>
                {rewards[r.players.nick]}
              </span>
            )}
          </div>
        ))}
      </section>

      {/* QUESTY AKTYWNE */}
      <section style={styles.card}>
        <h3>📜 Questy Do Wykonania</h3>
        {activeQuests.map((q) => (
          <div key={q.id} style={styles.questLine}>
            <strong>{q.name}</strong>
            <span style={{ fontSize: 13, opacity: 0.8 }}>
              ⏱ {q.time_minutes} min · ⭐ {q.base_xp} XP
            </span>
          </div>
        ))}
      </section>

      {/* QUESTY NADCHODZĄCE */}
      {upcomingQuests.length > 0 && (
        <section style={styles.cardUpcoming}>
          <h3>⏳ Questy Nadchodzące</h3>
          {upcomingQuests.map((q) => {
            const days =
              Math.ceil(
                (new Date(q.next_available_at) - now) /
                  (1000 * 60 * 60 * 24)
              ) || 1;

            return (
              <div key={q.id} style={styles.upcomingLine}>
                <strong>{q.name}</strong>
                <span style={styles.upcomingText}>
                  Dostępne za {days} {days === 1 ? "dzień" : "dni"}
                </span>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "#181421",
    color: "#f1edf9",
    padding: 20,
    fontFamily: "serif",
  },
  card: {
    background: "#241c33",
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  cardUpcoming: {
    background: "#1f192d",
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    opacity: 0.6,
  },
  questLine: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  upcomingLine: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 6,
    fontStyle: "italic",
  },
  upcomingText: {
    fontSize: 13,
    opacity: 0.8,
  },
  rankBar: {
    display: "flex",
    gap: 12,
    background: "#201a2e",
    padding: "10px 12px",
    borderRadius: 12,
    marginBottom: 16,
    overflowX: "auto",
  },
  rankItem: {
    display: "flex",
    gap: 6,
    alignItems: "center",
    whiteSpace: "nowrap",
    fontSize: 14,
  },
  reward: {
    marginLeft: 6,
    color: "#c9a86a",
    fontSize: 13,
  },
  playerBtn: {
    display: "flex",
    gap: 10,
    padding: 12,
    background: "#31284a",
    border: "none",
    color: "#fff",
    marginBottom: 8,
    borderRadius: 10,
  },
  avatar: { width: 36, height: 36, borderRadius: "50%" },
  avatarLarge: { width: 64, height: 64, borderRadius: "50%" },
  gold: { color: "#c9a86a" },
};
