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
  const [winners, setWinners] = useState([]);
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

    // 🔁 AUTO RESET JEŚLI TRZEBA
    await supabase.rpc("reset_month_if_needed");

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

    const { data: mw } = await supabase
      .from("monthly_winners")
      .select("year, month, xp, players(nick, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(4);

    setWinners(mw || []);
    setLoading(false);
  }

  if (!player) {
    return (
      <main style={styles.app}>
        <h1>📖 Księga Domostwa</h1>
        {players.map((p) => (
          <button key={p.id} style={styles.playerBtn} onClick={() => loadPlayer(p)}>
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
      <section style={styles.card}>
        <img src={player.avatar_url || avatar(player.nick)} style={styles.avatarLarge} />
        <div>
          <strong>{player.nick}</strong>
          <div>Poziom {progress.level} · XP {progress.xp}/{progress.level * 100}</div>
        </div>
      </section>

      <section style={{ ...styles.card, background: "#17140f" }}>
        <h3>🏆 Gracze Miesiąca</h3>
        {winners.map((w, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <img src={w.players?.avatar_url || avatar(w.players?.nick)} style={styles.avatar} />
            <strong>{w.players?.nick}</strong>
            <span style={{ color: "#c9a86a" }}>
              {w.month}/{w.year} · {w.xp} XP
            </span>
          </div>
        ))}
      </section>
    </main>
  );
}

const styles = {
  app: { minHeight: "100vh", background: "#1e1b16", color: "#f4f1ea", padding: 20, fontFamily: "serif" },
  card: { padding: 14, borderRadius: 10, marginBottom: 16 },
  playerBtn: { display: "flex", gap: 10, padding: 10, background: "#6b4f1d", border: "none", color: "#fff", marginBottom: 8 },
  avatar: { width: 36, height: 36, borderRadius: "50%" },
  avatarLarge: { width: 64, height: 64, borderRadius: "50%" }
};
