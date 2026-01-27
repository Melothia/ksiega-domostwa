import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const PLAYERS = [
  {
    id: "b45ef046-f815-4eda-8015-d9212d9ac2ee",
    nick: "Melothy",
    avatar: "/Melothy.png",
    reward: "Wieczór Planszówkowy"
  },
  {
    id: "reu-id",
    nick: "Reu",
    avatar: "/Reu.png",
    reward: "Wyjście na Ramen"
  },
  {
    id: "pshemcky-id",
    nick: "Pshemcky",
    avatar: "/Pshemcky.png",
    reward: "Aktywność Sportowa"
  },
  {
    id: "benditt-id",
    nick: "Benditt",
    avatar: "/Benditt.png",
    reward: "Grupowy Wypad do Kina"
  }
];

export default function Home() {
  const [player, setPlayer] = useState(null);
  const [tab, setTab] = useState("main");
  const [loading, setLoading] = useState(false);

  const [progress, setProgress] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [chronicle, setChronicle] = useState([]);
  const [receipts, setReceipts] = useState([]);

  useEffect(() => {
    if (!player) return;

    const load = async () => {
      setLoading(true);

      const { data: mp } = await supabase
        .from("monthly_progress")
        .select("*")
        .eq("player_id", player.id)
        .single();

      const { data: ach } = await supabase
        .from("player_achievements")
        .select("id, unlocked_at, achievements(title)")
        .eq("player_id", player.id);

      const { data: chr } = await supabase
        .from("chronicle")
        .select("message, created_at, players(nick)")
        .order("created_at", { ascending: false })
        .limit(20);

      const { data: rec } = await supabase
        .from("receipts")
        .select("store, amount, added_at, players(nick)")
        .order("added_at", { ascending: false });

      setProgress(mp);
      setAchievements(ach || []);
      setChronicle(chr || []);
      setReceipts(rec || []);

      setLoading(false);
    };

    load();
  }, [player]);

  if (!player) {
    return (
      <div style={{ padding: 20 }}>
        <h1>📘 Księga Domostwa</h1>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {PLAYERS.map(p => (
            <div key={p.nick} onClick={() => setPlayer(p)} className="card">
              <img src={p.avatar} style={{ width: "100%", borderRadius: "50%" }} />
              <h3 style={{ textAlign: "center" }}>{p.nick}</h3>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div className="card">
        <strong>{player.nick}</strong><br />
        Poziom {progress?.level ?? 1} · XP {progress?.xp ?? 0}/{(progress?.level ?? 1) * 100}
      </div>

      <div className="tabs">
        {["main","achievements","chronicle","receipts"].map(t => (
          <div
            key={t}
            className={`tab ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </div>
        ))}
      </div>

      {loading && <p>⏳ Ładowanie danych…</p>}

      {tab === "achievements" && (
        <div>
          {achievements.map(a => (
            <div key={a.id} className="card">🏆 {a.achievements?.title}</div>
          ))}
        </div>
      )}

      {tab === "chronicle" && (
        <div>
          {chronicle.length === 0 && <p>Brak wpisów.</p>}
          {chronicle.map((c,i) => (
            <div key={i} className="card">
              <small>{c.players?.nick}</small><br />
              {c.message}
            </div>
          ))}
        </div>
      )}

      {tab === "receipts" && (
        <div>
          {receipts.map((r,i) => (
            <div key={i} className="card">
              🧾 {r.store} – {r.amount} zł ({r.players?.nick})
            </div>
          ))}
        </div>
      )}

      {tab === "main" && (
        <div className="card">
          <p>Questy, emergency i upcoming będą dokładane w ETAPIE 2.</p>
        </div>
      )}
    </div>
  );
}
