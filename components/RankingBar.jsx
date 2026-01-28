// components/RankingBar.jsx
// Poziomy ranking miesiąca + informacja o poprzednim graczu miesiąca i nagrodzie

const REWARDS = {
  Reu: "Wyjście do kina",
  Melothy: "Wieczór planszówkowy",
  Pshemcky: "Wspólna aktywność sportowa",
  Benditt: "Wspólny ramen",
};

export default function RankingBar({ ranking, lastWinner }) {
  if (!ranking || ranking.length === 0) return null;

  const rewardText =
    lastWinner && REWARDS[lastWinner]
      ? `NAGRODA: ${REWARDS[lastWinner]}`
      : "NAGRODA: —";

  return (
    <div className="ranking-bar">
      <div className="ranking-row">
        {ranking.map((r, i) => (
          <span key={i} className="ranking-item">
            {i === 0 && "🥇 "}
            {i === 1 && "🥈 "}
            {i === 2 && "🥉 "}
            {i + 1}. {r.nick}
          </span>
        ))}
      </div>

      <div className="ranking-winner">
        Gracz miesiąca (poprzedni):{" "}
        <strong>{lastWinner || "—"}</strong>{" "}
        <span style={{ opacity: 0.8, marginLeft: 6 }}>
          {rewardText}
        </span>
      </div>
    </div>
  );
}
