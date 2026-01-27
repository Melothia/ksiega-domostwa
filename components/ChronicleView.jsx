import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function renderEntry(entry) {
  const nick = entry.players?.nick ?? "Ktoś";

  switch (entry.type) {
    case "quest_solo":
      return `🧹 ${nick} wykonał(a) zadanie: ${entry.payload?.quest}`;
    case "quest_group":
      return `🤝 ${entry.payload?.players?.join(" i ")} wykonali zadanie: ${entry.payload?.quest}`;
    case "level_up":
      return `⬆️ ${nick} awansował(a) na poziom ${entry.payload?.level}`;
    case "achievement":
      return `🏆 ${nick} zdobył(a) osiągnięcie: ${entry.payload?.title}`;
    case "receipt":
      return `🧾 ${nick} dodał(a) paragon (${entry.payload?.amount} zł)`;
    default:
      return `📜 ${nick}: ${entry.message ?? "zdarzenie"}`;
  }
}

export default function ChronicleView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("chronicle")
        .select("*, players ( nick )")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error) setItems(data ?? []);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) return <p>⏳ Ładowanie kroniki…</p>;
  if (!items.length) return <p>Brak wpisów w kronice.</p>;

  return (
    <div className="chronicle-fade">
      {items.map(it => (
        <div key={it.id} className="chronicle-item">
          {renderEntry(it)}
        </div>
      ))}
    </div>
  );
}
