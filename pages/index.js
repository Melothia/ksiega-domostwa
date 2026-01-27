import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://zhywdorfllurbkwzesii.supabase.co",
  "sb_publishable_dm5fyZedKgGD3OccGT2yDg_38bv-Efd"
);

const dicebear = (seed) =>
  `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;

function timeAgo(date) {
  const d = new Date(date);
  const diff = Math.floor((Date.now() - d) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "dzisiaj";
  if (diff === 1) return "wczoraj";
  return `${diff} dni temu`;
}

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [player, setPlayer] = useState(null);
  const [progress, setProgress] = useState(null);
  const [quests, setQuests] = useState([]);
  const [recent, setRecent] = useState([]);
  const [partner, setPartner] = useState(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  /* PLAYERS */
  useEffect(() => {
    supabase
      .from("players")
      .select("id, nick, avatar_url")
      .then(({ data }) => setPlayers(data || []));
  }, []);

  /* LOAD PLAYER DATA */
  async function loadPlayer(p) {
    setPlayer(p);
    setPartner(null);

    const { data: mp } = await supabase
      .from("monthly_progress")
      .select("*")
      .eq("player_id", p.id)
      .eq("year", year)
      .eq("month", month)
      .single();

    setProgress(mp);

    const { data: qs } = await supabase.from("quests").select("*");
    setQuests(qs || []);

    const { data: rc } = await supabase
      .from("quest_completions")
      .select("completed_at, quests(name), players(nick, avatar_url)")
      .order("completed_at", { ascending: false })
      .limit(5);

    setRecent(rc || []);
  }

  async function executeQuest(questId, ids) {
    for (const id of ids) {
      const { error } = await supabase.rpc("complete_quest", {
        p_player_id: id,
        p_quest_id: questId,
      });
      if (error) {
        alert(error.message);
        return;
      }
    }
    await loadPlayer(player);
  }

  /* UI */
  if (!player) {
    return (
      <main style={styles.app}>
        <h1>📖 Księga Domostwa</h1>
        {players.map((p) => (
          <button key={p.id} style={styles.playerBtn} onClick={() => loadPlayer(p)}>
            <img
              src={p.avatar_url || dicebear(p.nick)}
              style={styles.avatar}
            />
            {p.nick}
          </button>
        ))}
      </main>
    );
  }

  return (
    <main style={styles.app}>
      <section style={styles.card}>
        <img
          src={player.avatar_url || dicebear(player.nick)}
          style={styles.avatarLarge}
        />
        <div>
          <strong>{player.nick}</strong><br />
          Poziom {progress?.level} · XP {progress?.xp}/{progress?.level * 100}
        </div>
      </section>

      <section style={{ ...styles.card, background: "#1b1814" }}>
        <strong>📜 Kronika Gildii</strong>
        {recent.map((r, i) => (
          <div
            key={i}
            style={{ opacity: 1 - i * 0.15, marginTop: 6 }}
          >
            <img
              src={r.players.avatar_url || dicebear(r.players.nick)}
              style={styles.avatarSmall}
            />{" "}
            <strong>{r.players.nick}</strong> – {r.quests.name}
            <div style={{ fontSize: 12, color: "#aaa" }}>
              {timeAgo(r.completed_at)}
            </div>
          </div>
        ))}
      </section>

      {quests.map((q) => (
        <section key={q.id} style={styles.card}>
          <strong>{q.name}</strong>
          <div style={{ fontSize: 14, color: "#bbb" }}>
            ⏱ {q.time_minutes} min · ⭐ {q.base_xp} XP
          </div>

          {q.max_slots === 1 && (
            <button style={styles.btn} onClick={() => executeQuest(q.id, [player.id])}>
              Wykonaj
            </button>
          )}

          {q.max_slots > 1 && (
            <>
              <button style={styles.btn} onClick={() => executeQuest(q.id, [player.id])}>
                Wykonaj samodzielnie
              </button>

              <select
                value={partner || ""}
                onChange={(e) => setPartner(e.target.value)}
              >
                <option value="">Wybierz gracza…</option>
                {players
                  .filter((p) => p.id !== player.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nick}
                    </option>
                  ))}
              </select>

              {partner && (
                <button
                  style={styles.btn}
                  onClick={() => executeQuest(q.id, [player.id, partner])}
                >
                  Wykonaj razem
                </button>
              )}
            </>
          )}
        </section>
      ))}
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
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  playerBtn: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: 10,
    background: "#6b4f1d",
    color: "#fff",
    border: "none",
    marginBottom: 8,
  },
  avatar: { width: 36, height: 36, borderRadius: "50%" },
  avatarLarge: { width: 64, height: 64, borderRadius: "50%" },
  avatarSmall: { width: 20, height: 20, borderRadius: "50%" },
  btn: {
    marginTop: 8,
    padding: "6px 12px",
    background: "#8a6a2f",
    border: "none",
    color: "white",
  },
};
