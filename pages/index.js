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
  const [chronicle, setChronicle] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [owned, setOwned] = useState([]);
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

    const { data: ch } = await supabase
      .from("chronicle_entries")
      .select("id, message, created_at, players(nick, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(8);

    setChronicle(ch || []);

    const { data: ach } = await supabase
      .from("achievements")
      .select("*")
      .order("title");

    setAchievements(ach || []);

    const { data: pa } = await supabase
      .from("player_achievements")
      .select("achievement_id")
      .eq("player_id", p.id);

    setOwned((pa || []).map((x) => x.achievement_id));

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

  async function setTitle(title) {
    await supabase
      .from("players")
      .update({ active_title: title })
      .eq("id", player.id);

    setPlayer({ ...player, active_title: title });
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
    return <main style={styles.app}>⏳ Ładowanie profilu…</main>;
  }

  return (
    <main style={styles.app}>
      {/* PROFIL */}
      <section style={styles.card}>
        <img src={player.avatar_url || avatar(player.nick)} style={styles.avatarLarge} />
        <div>
          <strong>
            {player.nick}
            {player.active_title && <span style={{ color: "#c9a86a" }}> · {player.active_title}</span>}
          </strong>
          <div>Poziom {progress.level} · XP {progress.xp}/{progress.level * 100}</div>
        </div>
      </section>

      {/* TABS */}
      <div style={styles.tabs}>
        <button style={styles.tabBtn} onClick={() => setTab("main")}>🏠 Główna</button>
        <button style={styles.tabBtn} onClick={() => setTab("achievements")}>🏆 Osiągnięcia</button>
      </div>

      {/* MAIN */}
      {tab === "main" && (
        <>
          {quests.map((q) => (
            <section key={q.id} style={{
              ...styles.card,
              background: q.is_emergency ? "#3a1f1f" : "#2a251d",
              border: q.is_emergency ? "2px solid #b63c2d" : "none"
            }}>
              <strong>{q.is_emergency && "⚠ "} {q.name}</strong>
              <div style={{ fontSize: 14, marginTop: 4 }}>
                ⏱ {q.time_minutes} min · ⭐ {q.base_xp}
              </div>
              <button style={styles.btn} onClick={() => completeQuest(q)}>Wykonaj</button>
            </section>
          ))}

          <section style={{ ...styles.card, background: "#17140f" }}>
            <h3>📜 Kronika Gildii</h3>
            {chronicle.map((e, i) => (
              <div key={e.id} style={{ opacity: 1 - i * 0.12, marginTop: 8 }}>
                <strong>{e.players?.nick}</strong> – {e.message}
                <div style={{ fontSize: 11, color: "#aaa" }}>
                  {new Date(e.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </section>
        </>
      )}

      {/* ACHIEVEMENTS */}
      {tab === "achievements" && (
        <section style={styles.card}>
          <h3>🏆 Osiągnięcia</h3>
          {achievements.map((a) => {
            const unlocked = owned.includes(a.id);
            return (
              <div key={a.id}
                style={{ opacity: unlocked ? 1 : 0.3, cursor: unlocked ? "pointer" : "default" }}
                onClick={() => unlocked && setTitle(a.title)}>
                <strong>{a.title}</strong>
                <div style={{ fontSize: 13 }}>{a.condition}</div>
              </div>
            );
          })}
        </section>
      )}

      {popup && <div style={styles.popup}>{popup}</div>}
    </main>
  );
}

const styles = {
  app: { minHeight: "100vh", background: "#1e1b16", color: "#f4f1ea", padding: 20, fontFamily: "serif" },
  card: { padding: 14, borderRadius: 10, marginBottom: 16 },
  tabs: { display: "flex", gap: 8, marginBottom: 12 },
  tabBtn: { flex: 1, padding: 10, background: "#6b4f1d", border: "none", color: "#fff" },
  playerBtn: { display: "flex", gap: 10, padding: 10, background: "#6b4f1d", border: "none", color: "#fff", marginBottom: 8 },
  avatar: { width: 36, height: 36, borderRadius: "50%" },
  avatarLarge: { width: 64, height: 64, borderRadius: "50%" },
  btn: { marginTop: 6, padding: "6px 12px", background: "#8a6a2f", border: "none", color: "white" },
  popup: { position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#3a2f1d", padding: "12px 20px", borderRadius: 12 }
};
