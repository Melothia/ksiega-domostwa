import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getPreviousMonthLabel } from "../lib/dateUtils";

export default function ReceiptsView({ playerId }) {
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);

    const { data: receipts } = await supabase
      .from("receipts")
      .select("id, amount, description, created_at, players ( nick )")
      .order("created_at", { ascending: false });

    setItems(receipts ?? []);

    // Podsumowanie poprzedniego miesiąca
    const { data: sum } = await supabase.rpc("receipts_previous_month_summary");
    setSummary(sum ?? null);

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addReceipt = async () => {
    if (!amount) return;
    await supabase.rpc("add_receipt", {
      p_player_id: playerId,
      p_amount: Number(amount),
      p_description: desc || null,
    });
    setAmount("");
    setDesc("");
    load();
  };

  return (
    <>
      <div className="card strong">
        <strong>Skrzynia Paragonów</strong>
        {summary && (
          <div style={{ marginTop: 6 }}>
            <small>
              {getPreviousMonthLabel()}: wydaliśmy {summary.total} zł ·
              {` `} {summary.per_person} zł / osobę
            </small>
          </div>
        )}
      </div>

      <div className="card">
        <input
          type="number"
          placeholder="Kwota"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          style={{ width: "100%", marginBottom: 6 }}
        />
        <input
          placeholder="Opis (sklep)"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          style={{ width: "100%", marginBottom: 6 }}
        />
        <button onClick={addReceipt}>Dodaj paragon</button>
      </div>

      {loading && <p>⏳ Ładowanie…</p>}

      {items.map(r => (
        <div key={r.id} className="card">
          <strong>{r.players?.nick}</strong> · {r.amount} zł
          <div>
            <small>{r.description}</small>
          </div>
        </div>
      ))}
    </>
  );
}
