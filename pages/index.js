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
  const [tab, setTab] = useState("main");
  const [ranking, setRanking] = useState([]);
  const [quests, setQuests] = useState([]);
  const [chronicle, setChronicle] = useState([]);
  const [receipts, setReceipts] = useState([]);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const prevMonthDate = new Date(year, month - 2, 1);
  const prevMonthLabel = prevMonthDate.toLocaleString("pl-PL", {
    month: "long",
    year: "numeric",
  });

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
      .single();

    setProgress(mp);

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

    const { data: c } = await supabase
      .from("chronicle")
      .select("*, players(nick, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(20);

    setChronicle(c || []);

    const { data: r } = await supabase
      .from("receipts")
      .select("*, players(nick)")
      .order("created_at", { ascending: false });

    setReceipts(r || []);
  }

  async function completeQuest(id) {
    await supabase.rpc("complete_quest", {
      p_player_id: player.id,
      p_quest_id: id,
    });
    loadPlayer(player);
  }

  if (!player) {
    return (
      <main style={styles.login}>
        <h1>Księga Domostwa</h1>
        <div style={styles.loginGrid}>
          {players.map((p) => (
            <button key={p.id} style={styles.loginCard} onClick={() => loadPlayer(p)}>
              <img src={p.avatar_url} style={styles.loginAvatar} />
              <span>{p.nick}</span>
            </button>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main style={styles.app}>
      {/* PANEL GRACZA */}
      <section style={styles.card}>
        <img src={player.avatar_url} style={styles.avatar} />
        <div>
          <strong>{player.nick}</strong>
          <div>{player.active_title}</div>
          <div>
            Poziom {progress.level} · XP {progress.xp}/{progress.level * 100}
          </div>
        </div>
      </section>

      {/* PASEK MIESIĘCZNY */}
      <section style={styles.monthBar}>
        {ranking.map((r, i) => (
          <span key={i}>
            {medals[i]} {r.players.nick}
            {i === 0 && ` — NAGRODA: ${rewards[r.players.nick]}`}
          </span>
        ))}
        <span style={{ opacity: 0.7 }}>
          Gracz miesiąca ({prevMonthLabel}):{" "}
          {ranking[0]?.players.nick || "—"}
        </span>
      </section>

      {/* ZAKŁADKI */}
      <nav style={styles.tabs}>
        {["main", "achievements", "chronicle", "receipts"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              ...styles.tabBtn,
              background: tab === t ? "#4b3a73" : "#2c2440",
            }}
          >
            {t === "main" && "Główna"}
            {t === "achievements" && "Osiągnięcia"}
            {t === "chronicle" && "Kronika"}
            {t === "receipts" && "Skrzynia"}
          </button>
        ))}
      </nav>

      {/* GŁÓWNA */}
      {tab === "main" && (
        <>
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
                  <button style={styles.smallBtn} onClick={() => completeQuest(q.id)}>
                    Wykonane
                  </button>
                ) : (
                  <span>Dostępne za {q.days_until_active} dni</span>
                )}
              </div>
            ))}
          </section>
        </>
      )}

      {/* KRONIKA */}
      {tab === "chronicle" && (
        <section style={styles.cardDark}>
          {chronicle.map((c) => (
            <div key={c.id} style={styles.chronoLine}>
              <img src={c.players.avatar_url} style={styles.chronoAvatar} />
              <span>
                <strong>{c.players.nick}</strong> {c.message}
              </span>
            </div>
          ))}
        </section>
      )}

      {/* SKRZYNIA */}
      {tab === "receipts" && (
        <section style={styles.card}>
          <strong>{prevMonthLabel}</strong>
          {receipts.map((r) => (
            <div key={r.id}>
              {r.players.nick}: {r.amount} zł
            </div>
          ))}
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
  cardDark: {
    background: "#1f192d",
    borderRadius: 14,
    padding: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    border: "3px solid #c9a86a",
  },
  monthBar: {
    fontSize: 13,
    opacity: 0.9,
    marginBottom: 12,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  tabs: {
    display: "flex",
    gap: 6,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    border: "none",
    color: "#fff",
    padding: 8,
    borderRadius: 8,
  },
  smallBtn: {
    marginLeft: 8,
    background: "#4b3a73",
    border: "none",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: 6,
  },
  chronoLine: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    marginBottom: 6,
  },
  chronoAvatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
  },
};
