// components/AchievementsView.jsx
// Lista osiągnięć gracza – zdobyte na górze, niezdobyte wyszarzone na dole
// Możliwość ustawienia tytułu przy zdobytych osiągnięciach

import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export default function AchievementsView({ playerId, onTitleChange }) {
  const [allAchievements, setAllAchievements] = useState([]);
  const [unlockedIds, setUnlockedIds] = useState(new Set());
  const [activeTitle, setActiveTitle] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);

    // Pobierz wszystkie osiągnięcia z nagrodami XP
    const { data: allAch, error: achError } = await supabase
      .from("achievements")
      .select("*")
      .order("title", { ascending: true });

    if (achError) {
      console.error("Error loading achievements:", achError);
      setLoading(false);
      return;
    }

    // Pobierz zdobyte osiągnięcia gracza
    const { data: playerAch, error: playerError } = await supabase
      .from("player_achievements")
      .select("achievement_id")
      .eq("player_id", playerId);

    if (playerError) {
      console.error("Error loading player achievements:", playerError);
    }

    // Pobierz aktywny tytuł gracza
    const { data: playerData, error: playerDataError } = await supabase
      .from("players")
      .select("active_title")
      .eq("id", playerId)
      .single();

    if (!playerDataError && playerData) {
      setActiveTitle(playerData.active_title);
    }

    setAllAchievements(allAch ?? []);
    setUnlockedIds(new Set((playerAch ?? []).map(pa => pa.achievement_id)));
    setLoading(false);
  }, [playerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const setTitle = async (title) => {
    const { error } = await supabase
      .from("players")
      .update({ active_title: title })
      .eq("id", playerId);

    if (error) {
      console.error("Error setting title:", error);
      alert("❌ Błąd ustawiania tytułu");
    } else {
      setActiveTitle(title);
      // Powiadom komponent główny o zmianie tytułu
      if (onTitleChange) {
        onTitleChange(title);
      }
    }
  };

  if (loading) return <p>⏳ Ładowanie osiągnięć…</p>;

  // Podziel na zdobyte i niezdobyte
  const unlocked = allAchievements.filter(a => unlockedIds.has(a.id));
  const locked = allAchievements.filter(a => !unlockedIds.has(a.id));

  return (
    <div>
      {/* ZDOBYTE OSIĄGNIĘCIA */}
      {unlocked.length > 0 && (
        <>
          <h3 style={{ color: '#fbbf24', marginTop: 0 }}>🏆 Zdobyte ({unlocked.length})</h3>
          {unlocked.map(ach => (
            <div key={ach.id} className="achievement-card achievement-unlocked">
              <div className="achievement-icon">🏆</div>
              <div className="achievement-info">
                <h4 className="achievement-title">
                  {ach.title}
                  {ach.xp_reward > 0 && (
                    <span style={{ marginLeft: '8px', color: '#a78bfa', fontSize: '0.9rem' }}>
                      +{ach.xp_reward} XP
                    </span>
                  )}
                </h4>
                <p className="achievement-condition">{ach.condition}</p>
                <button 
                  className="achievement-set-title"
                  onClick={() => setTitle(ach.title)}
                  disabled={activeTitle === ach.title}
                >
                  {activeTitle === ach.title ? '✔️ Aktywny tytuł' : 'Ustaw tytuł'}
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* NIEZDOBYTE OSIĄGNIĘCIA */}
      {locked.length > 0 && (
        <>
          <h3 style={{ marginTop: unlocked.length > 0 ? '32px' : '0' }}>🔒 Do zdobycia ({locked.length})</h3>
          {locked.map(ach => (
            <div key={ach.id} className="achievement-card achievement-locked">
              <div className="achievement-icon">🔒</div>
              <div className="achievement-info">
                <h4 className="achievement-title">
                  {ach.title}
                  {ach.xp_reward > 0 && (
                    <span style={{ marginLeft: '8px', color: '#6b7280', fontSize: '0.9rem' }}>
                      +{ach.xp_reward} XP
                    </span>
                  )}
                </h4>
                <p className="achievement-condition">{ach.condition}</p>
              </div>
            </div>
          ))}
        </>
      )}

      {allAchievements.length === 0 && (
        <p style={{ opacity: 0.7 }}>Brak osiągnięć w systemie.</p>
      )}
    </div>
  );
}
