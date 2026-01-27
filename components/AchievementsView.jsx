import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AchievementsView({ playerId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) return;

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("player_achievements")
        .select("id, unlocked_at, achievements ( title )")
        .eq("player_id", playerId)
        .order("unlocked_at", { ascending: false });

      if (!error) setItems(data ?? []);
      setLoading(false);
    };

    load();
  }, [playerId]);

  if (loading) return <p>⏳ Ładowanie osiągnięć…</p>;
  if (!items.length) return <p>Brak osiągnięć jeszcze ✨</p>;

  return (
    <>
      {items.map(it => (
        <div key={it.id} className="card">
          <strong>{it.achievements?.title}</strong>
          <div>
            <small>
              Zdobyte: {new Date(it.unlocked_at).toLocaleDateString()}
            </small>
          </div>
        </div>
      ))}
    </>
  );
}
