export default function RankingBar({ ranking, lastWinner }) {

  const rewards = {
    Reu: "🎬 Wyjście do kina",
    Melothy: "🎲 Wieczór planszówkowy",
    Pshemcky: "🏃 Wspólna aktywność sportowa",
    Benditt: "🍜 Wyjście na ramen",
  };
  
  return (
    <div className="ranking-bar">
      <div className="ranking-row">
        {ranking.map((r, i) => (
          <span key={i} className="ranking-item">
            {i === 0 && "🥇 "}
            {i === 1 && "🥈 "}
            {i === 2 && "🥉 "}
            {r.nick}
          </span>
        ))}
      </div>

      <div className="ranking-winner">
        Gracz miesiąca (poprzedni): <strong>{lastWinner}</strong>
      </div>
    </div>
  );
}
