// lib/questLogic.js
// CAŁA logika rotacji questów – ZERO UI, ZERO Supabase
// Ten plik jest JEDYNYM źródłem prawdy dla statusu questów

const EMERGENCY_DELAY_HOURS = 48;

/**
 * Pomocnicze – różnica w godzinach
 */
function hoursBetween(a, b) {
  const diffMs = b.getTime() - a.getTime();
  return diffMs / 1000 / 60 / 60;
}

/**
 * Oblicza kolejną datę dostępności questa
 */
export function getNextAvailableAt(lastCompletedAt, frequencyDays) {
  if (!lastCompletedAt) return null;
  const date = new Date(lastCompletedAt);
  date.setDate(date.getDate() + frequencyDays);
  return date;
}

/**
 * GŁÓWNA FUNKCJA:
 * Na podstawie:
 * - questa
 * - daty ostatniego wykonania
 * Zwraca status:
 * "upcoming" | "active" | "emergency"
 */
export function getQuestStatus(quest, lastCompletedAt) {
  const now = new Date();

  // Nigdy nie wykonany → od razu aktywny
  if (!lastCompletedAt) {
    return "active";
  }

  const nextAvailable = getNextAvailableAt(
    lastCompletedAt,
    quest.frequency_days
  );

  // Jeszcze za wcześnie
  if (now < nextAvailable) {
    return "upcoming";
  }

  // Sprawdź emergency
  const hoursLate = hoursBetween(nextAvailable, now);

  if (hoursLate >= EMERGENCY_DELAY_HOURS) {
    return "emergency";
  }

  return "active";
}

/**
 * Liczy finalne XP (emergency +30%)
 */
export function calculateXp(quest, status) {
  if (status === "emergency") {
    return Math.floor(quest.base_xp * 1.3);
  }
  return quest.base_xp;
}

/**
 * Czy quest jest grupowy
 */
export function isGroupQuest(quest) {
  return quest.max_slots > 1;
}

/**
 * Teksty pomocnicze (UI)
 */
export function timeLabel(quest) {
  return `${quest.time_minutes} min`;
}

export function xpLabel(quest, status) {
  if (status === "emergency") {
    return `${quest.base_xp} XP + 30% = ${calculateXp(
      quest,
      status
    )} XP`;
  }
  return `${quest.base_xp} XP`;
}

export function upcomingLabel(quest, lastCompletedAt) {
  if (!lastCompletedAt) return "dostępne";
  const next = getNextAvailableAt(
    lastCompletedAt,
    quest.frequency_days
  );
  return `wkrótce`;
}

/**
 * Rozdziela questy na 3 listy:
 * emergency / active / upcoming
 *
 * expected input:
 * quests: [{ ...quest, last_completed_at }]
 */
export function splitQuestsByStatus(quests) {
  const emergency = [];
  const active = [];
  const upcoming = [];

  quests.forEach(q => {
    const status = getQuestStatus(q, q.last_completed_at);

    const enriched = {
      ...q,
      status,
      final_xp: calculateXp(q, status),
    };

    if (status === "emergency") emergency.push(enriched);
    else if (status === "active") active.push(enriched);
    else upcoming.push(enriched);
  });

  return {
    emergency,
    active,
    upcoming,
  };
}
