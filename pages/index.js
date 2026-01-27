import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://zhywdorfllurbkwzesii.supabase.co",
  "sb_publishable_dm5fyZedKgGD3OccGT2yDg_38bv-Efd"
);

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [quests, setQuests] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);

  // === INIT ===
  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    const { data } = await supabase.from("players").select("*");
    setPlayers(data || []);
  }

  async function loadData(player) {
    setLoading(true);
    setCurrentPlayer(player);

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const { data: progressData } = await supabase
      .from("monthly_progress")
      .select("*")
      .eq("player_id", player.id)
      .eq("year", year)
      .eq("month", month)
      .single();

    setProgress(progressData);

    const { data: questsData } = await supabase
      .from("quests")
      .select("*")
      .order("base_xp", { ascending: false });

    setQuests(questsData || []);
    setLoading(false);
  }

  async function completeQuest(questId, playerIds) {
    for (const pid of playerIds) {
      const { error } = await supabase.rpc("complete_quest", {
        p_player_id: pid,
        p_quest_id: questId,
      });
      if (error) {
        alert(error.message);
        return;
      }
    }
    await loadData(currentPlayer);
  }

  // === UI ===
  return (
    <div style={styles.app}>
      <h1 style={styles.title}>📜 Księga Domostwa</h1>

      {!currentPlayer && (
        <div style={styles.playerList}>
          {players.map((p) => (
            <button
              key={p.id}
              style={styles.playerButton}
              onClick={() => loadData(p)}
            >
              {p.nick}
            </button>
          ))}
        </div>
      )}

      {currentPlayer && (
        <>
          <div style={styles.card}>
            <h2>{currentPlayer.nick}</h2>
            {progress && (
              <p>
                Poziom {progress.level} · XP {progress.xp}/{progress.level * 100}
              </p>
            )}
          </div>

          {loading && <p>Ładowanie…</p>}

          <div>
            {quests.map((q) => (
              <div key={q.id} style={styles.quest}>
                <strong>{q.name}</strong>
                <div>
                  ⏱ {q.time_minutes} min · ⭐ {q.base_xp} XP
                </div>

                {q.max_slots === 1 && (
                  <button
                    style={styles.action}
                    onClick={() => completeQuest(q.id, [currentPlayer.id])}
                  >
                    Wykonaj
                  </button>
                )}

                {q.max_slots > 1 && (
                  <>
                    <button
                      style={styles.action}
                      onClick={() => completeQuest(q.id, [currentPlayer.id])}
                    >
                      Wykonaj samodzielnie
                    </button>

                    <select
                      onChange={(e) =>
                        completeQuest(q.id, [
                          currentPlayer.id,
                          e.target.value,
                        ])
                      }
                    >
                      <option>Wykonaj z graczem…</option>
                      {players
                        .filter((p) => p.id !== currentPlayer.id)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nick}
                          </option>
                        ))}
                    </select>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "#1c1a17",
    color: "#f5f5f5",
    padding: 24,
    fontFamily: "serif",
  },
  title: { textAlign: "center" },
  playerList: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    marginTop: 40,
  },
  playerButton: {
    padding: "12px 20px",
    background: "#6b4f1d",
    border: "none",
    color: "white",
    cursor: "pointer",
  },
  card: {
    background: "#2a241b",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  quest: {
    background: "#2f2a20",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  action: {
    marginTop: 8,
    padding: "6px 12px",
    background: "#8a6a2f",
    border: "none",
    cursor: "pointer",
    color: "white",
  },
};
