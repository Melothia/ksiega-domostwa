export default function RankingBar({ ranking, lastWinner }) {
  const rewards = {
    Reu: "🎬 Wyjście do kina",
    Melothy: "🎲 Wieczór planszówkowy",
    Pshemcky: "🏃 Wspólna aktywność sportowa",
    Benditt: "🍜 Wyjście na ramen",
  };

  return (
    <div className="card">
      <div style={{ marginBottom: 6 }}>
        <small>
          Gracz miesiąca (poprzedni):{" "}
          <strong>{lastWinner}</strong>
        </small>
      </div>

      <div className="ranking">
        {ranking.map((r, idx) => (
          <div key={r.nick} className="rank-item">
            <div>
              {idx === 0 && "🥇"}
              {idx === 1 && "🥈"}
              {idx === 2 && "🥉"} {r.nick}
            </div>
            <small>Lv {r.level}</small>
            {idx === 0 && (
              <div style={{ marginTop: 4 }}>
                <small>
                  NAGRODA:<br />
                  {rewards[r.nick]}
                </small>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
