import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function renderEntry(entry) {
  const nick = entry.players?.nick ?? "Ktoś";
  const payload = entry.payload || {};

  switch (entry.type) {
    case "quest_solo":
      return {
        icon: payload.emergency ? "🚨" : "🧹",
        text: `${nick} wykonał(a) zadanie: ${payload.quest}`,
        detail: `+${payload.xp} XP${payload.emergency ? " (Emergency!)" : ""}`,
      };
    case "quest_group":
      return {
        icon: "🤝",
        text: `${payload.players?.join(" i ") || "Gracze"} wykonali razem: ${payload.quest || "zadanie"}`,
        detail: `+${payload.xp || "?"} XP każdy`,
      };
    case "level_up":
      return {
        icon: "⬆️",
        text: `${nick} awansował(a) na poziom ${payload.level}`,
        detail: "🎉",
      };
    case "achievement":
      return {
        icon: "🏆",
        text: `${nick} zdobył(a) osiągnięcie: ${payload.title}`,
        detail: "Nowy tytuł odblokowany!",
      };
    case "receipt":
      return {
        icon: "🧾",
        text: `${nick} dodał(a) paragon z ${payload.store}`,
        detail: `${payload.amount} zł (+50 XP)`,
      };
    case "monthly_winner":
      return {
        icon: "🏅",
        text: `${payload.nick} został(a) graczem miesiąca!`,
        detail: `🎁 Nagroda: ${payload.reward}`,
      };
    default:
      return {
        icon: "📜",
        text: entry.message ?? "Nieznane zdarzenie",
        detail: "",
      };
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "przed chwilą";
  if (diffMins < 60) return `${diffMins} min temu`;
  if (diffHours < 24) return `${diffHours}h temu`;
  if (diffDays < 7) return `${diffDays} dni temu`;

  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChronicleView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("chronicle")
      .select("*, players!chronicle_player_id_fkey ( nick )")
      .order("created_at", { ascending: false })
      .limit(100);

    console.log("Chronicle data:", data);
    console.log("Chronicle error:", error);

    if (!error) setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <p>⏳ Ładowanie kroniki…</p>;
  if (!items.length) {
    return (
      <div className="card" style={{ textAlign: "center", opacity: 0.7 }}>
        📜 Kronika jest pusta. Wykonaj zadania, aby zacząć pisać historię!
      </div>
    );
  }

  return (
    <>
      <h3>📜 Kronika Domostwa</h3>
      <div className="chronicle-fade">
        {items.map(it => {
          const rendered = renderEntry(it);
          return (
            <div key={it.id} className="chronicle-item">
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ fontSize: "1.5rem", flexShrink: 0 }}>
                  {rendered.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ marginBottom: "4px" }}>
                    {rendered.text}
                  </div>
                  {rendered.detail && (
                    <div style={{ 
                      fontSize: "0.85rem", 
                      opacity: 0.7,
                      color: "#fbbf24"
                    }}>
                      {rendered.detail}
                    </div>
                  )}
                  <div style={{ 
                    fontSize: "0.75rem", 
                    opacity: 0.5,
                    marginTop: "4px"
                  }}>
                    {formatDate(it.created_at)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
