import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://zhywdorfllurbkwzesii.supabase.co",
  "sb_publishable_dm5fyZedKgGD3OccGT2yDg_38bv-Efd"
);

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
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  useEffect(() => {
    supabase.from("players").select("*").then(({ data }) => {
      setPlayers(data || []);
    });

    const saved = localStorage.getItem("player_id");
    if (saved) {
      supabase
        .from("players")
        .select("*")
        .eq("id", saved)
        .single()
        .then(({ data }) => data && loadPlayer(data));
    }
  }, []);

  async function loadPlayer(p) {
    setLoading(true);
    setPlayer(p);
    localStorage.setItem("player_id", p.id);

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
      .maybeSingle();

    setProgress(mp || { level: 1, xp: 0 });

    const { data: rank } = await supabase
      .from("monthly_progress")
      .select("xp, players(nick, avatar_url)")
      .eq("year", year)
      .eq("month", month)
      .order("xp", { ascending: false });

    setRanking(rank || []);

    const { data: q } = await supabase
      .from("quests_with_state")
      .select("*")
      .neq("state", "hidden")
      .order("state", { ascending: false });

    setQuests(q || []);
    setLoading(false);
  }

  async function completeQuest(id) {
    await supabase.rpc("complete_quest", {
      p_player_id: player.id,
      p_quest_id: id,
    });
    loadPlayer(player);
  }

  // ===== LOGIN =====
  if (!player) {
    return (
      <main style={styles.login}>
        <h1>Księga Domostwa</h1>
        <div style={styles.loginGrid}>
          {players.map((p) => (
            <button
              key={p.id}
              style={styles.loginCard}
              onClick={() => loadPlayer(p)}
            >
              <img src={p.avatar_url} style={styles.loginAvatar} />
              <span>{p.nick}</span>
            </button>
          ))}
        </div>
      </main>
    );
  }

  // ===== LOADING =====
  if (loading || !progress) {
    return (
      <main style={styles.app}>
        <div style={{ textAlign: "center", marginTop: 40 }}>
          ⏳ Ładowanie świata…
        </div>
      </main>
    );
  }

  // ===== APP =====
  return (
    <main style={styles.app}>
      {/* PANEL GRACZA */}
      <section style={styles.card}>
        <img src={player.avatar_url} style={styles.avatar} />
        <div>
          <strong>{player.nick}</strong>
          <div>{player.active_title || ""}</div>
          <div>
            Poziom {progress.level} · XP {progress.xp}/{progress.level * 100}
          </div>
        </div>
      </section>

      {/* RANKING */}
      <section style={styles.monthBar}>
        {ranking.map((r, i) => (
          <div key={i}>
            {medals[i]} {r.players?.nick}
            {i === 0 && rewards[r.players?.nick] && (
              <> — NAGRODA: {rewards[r.players.nick]}</>
            )}
          </div>
        ))}
      </section>

      {/* QUESTY */}
      <section style={styles.card}>
        <h3>Questy</h3>
        {quests.map((q) => (
          <div key={q.id} style={{ opacity: q.state === "upcoming" ? 0.5 : 1 }}>
            <strong>
              {q.state === "emergency" && "⚠ "}
              {q.state === "upcoming" && "⏳ "}
              {q.name}
            </strong>
            {q.state === "active" || q.state === "emergency" ? (
              <button
                style={styles.smallBtn}
                onClick={() => completeQuest(q.id)}
              >
                Wykonane
              </button>
            ) : (
              <span> Dostępne za {q.days_until_active} dni</span>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "#181421",
    color: "#f1edf9",
    padding: 16,
    fontFamily: "serif",
  },
  login: {
    minHeight: "100vh",
    background: "#181421",
    color: "#f1edf9",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 40,
  },
  loginGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 20,
    marginTop: 40,
  },
  loginCard: {
    background: "none",
    border: "none",
    color: "#fff",
    textAlign: "center",
  },
  loginAvatar: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    border: "3px solid #c9a86a",
  },
  card: {
    background: "#241c33",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    border: "3px solid #c9a86a",
  },
  monthBar: {
    fontSize: 13,
    marginBottom: 12,
  },
  smallBtn: {
    marginLeft: 8,
    background: "#4b3a73",
    border: "none",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: 6,
  },
};
