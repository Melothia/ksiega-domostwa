export function isEmergency(quest) {
  return quest.quest_type === "emergency";
}

export function isGroupQuest(quest) {
  return quest.max_slots > 1;
}

export function emergencyXp(baseXp) {
  return Math.floor(baseXp * 1.5);
}

export function xpLabel(quest) {
  if (isEmergency(quest)) {
    return `${emergencyXp(quest.base_xp)} XP (+30%)`;
  }
  return `${quest.base_xp} XP`;
}

export function timeLabel(quest) {
  return `${quest.time_minutes} min`;
}

export function slotsLabel(quest, slots) {
  if (!slots || slots.length === 0) return "wolne";
  return slots.join(", ");
}

export function canDoGroup(quest, slots) {
  if (!isGroupQuest(quest)) return false;
  return (slots?.length ?? 0) < quest.max_slots;
}
