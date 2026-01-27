export function getNextAvailableText(quest) {
  if (!quest.next_available_at) return "wkrótce";

  const now = new Date();
  const next = new Date(quest.next_available_at);
  const diffMs = next - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "dziś";
  if (diffDays === 1) return "jutro";
  return `za ${diffDays} dni`;
}

export function getPreviousMonthLabel() {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  return prev.toLocaleString("pl-PL", {
    month: "long",
    year: "numeric",
  });
}
