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
  const [receipts, setReceipts] = useState([]);
  const [shop, setShop] = useState("");
  const [amount, setAmount] = useState("");
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

    const { data: r } = await supabase
      .from("receipts")
      .select("id, shop, amount, created_at, players(nick)")
      .order("created_at", { ascending: false });

    setReceipts(r || []);
    setLoading(false);
  }

  async function addReceipt() {
    if (!shop || !amount) return;

    await supabase.rpc("add_receipt", {
      p_player_id: player.id,
      p_shop: shop,
      p_amount: amount,
    });

    setShop("");
    setAmount("");
    loadPlayer(player);
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

      <div style={styles.tabs}>
        <button style={styles.tabBtn} onClick={() => setTab("main")}>🏠 Główna</button>
        <button style={styles.tabBtn} onClick={() => setTab("receipts")}>🧾 Skrzynia Paragonów</button>
      </div>

      {tab === "receipts" && (
        <section style={styles.card}>
          <h3>🧾 Skrzynia Paragonów</h3>

          <input
            placeholder="Sklep"
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            style={styles.input}
          />
          <input
            placeholder="Kwota"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={styles.input}
          />
          <button style={styles.btn} onClick={addReceipt}>
            Dodaj Paragon (+50 XP)
          </button>

          <hr style={{ margin: "12px 0" }} />

          {receipts.map((r) => (
            <div key={r.id} style={{ marginBottom: 6 }}>
              <strong>{r.players?.nick}</strong> · {r.shop} · {r.amount} zł
              <div style={{ fontSize: 12, color: "#aaa" }}>
                Na osobę: {(r.amount / 4).toFixed(2)} zł
              </div>
            </div>
          ))}
        </section>
      )}
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
  input: { width: "100%", marginBottom: 6, padding: 6 },
  btn: { padding: "6px 12px", background: "#8a6a2f", border: "none", color: "white" }
};
