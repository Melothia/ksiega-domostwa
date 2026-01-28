// components/AchievementsView.jsx
// Lista osiągnięć gracza – tylko odczyt, mobile-first

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AchievementsView({ playerId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("player_achievements")
        .select("id, achievements(title)")
        .eq("player_id", playerId)
        .order("created_at", { ascending: false });

      if (!error) {
        setItems(data ?? []);
      }

      setLoading(false);
    };

    load();
  }, [playerId]);

  if (loading) return <p>⏳ Ładowanie osiągnięć…</p>;
  if (!items.length)
    return <p style={{ opacity: 0.7 }}>Brak osiągnięć.</p>;

  return (
    <div>
      {items.map(a => (
        <div key={a.id} className="card">
          🏆 {a.achievements?.title}
        </div>
      ))}
    </div>
  );
}
