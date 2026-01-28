import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ReceiptsView({ playerId, onDataChange }) {
  const [store, setStore] = useState("");
  const [amount, setAmount] = useState("");
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);

    // Pobierz wszystkie paragony z bieżącego miesiąca
    const { data: receipts } = await supabase
      .from("receipts")
      .select("id, amount, store, added_at, players ( nick )")
      .gte("added_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .order("added_at", { ascending: false });

    setItems(receipts ?? []);

    // Podsumowanie bieżącego miesiąca
    const { data: sum } = await supabase.rpc("current_month_receipts_summary");
    setSummary(sum ?? []);

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addReceipt = async () => {
    if (!store || !amount) {
      alert("⚠️ Uzupełnij miejsce zakupu i kwotę");
      return;
    }
    
    await supabase.rpc("add_receipt", {
      p_player_id: playerId,
      p_store: store,
      p_amount: Number(amount),
    });
    
    setStore("");
    setAmount("");
    load();
    
    // Odśwież dane gracza (XP, level) w komponencie głównym
    if (onDataChange) {
      onDataChange();
    }
  };

  // Oblicz totały z podsumowania
  const monthTotal = summary.length > 0 ? summary[0].month_total : 0;
  const perPerson = summary.length > 0 ? summary[0].per_person : 0;

  return (
    <>
      <h3>📦 Skrzynia Paragonów</h3>
      
      {/* FORMULARZ DODAWANIA */}
      <div className="card">
        <input
          placeholder="Miejsce zakupu (np. Biedronka)"
          value={store}
          onChange={e => setStore(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />
        <input
          type="number"
          placeholder="Kwota (zł)"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />
        <button onClick={addReceipt}>
          ➕ Dodaj paragon (+50 XP)
        </button>
      </div>

      {/* PODSUMOWANIE MIESIĄCA */}
      {summary.length > 0 && (
        <div className="card" style={{ 
          background: "linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))",
          border: "1px solid rgba(251, 191, 36, 0.3)"
        }}>
          <strong style={{ color: "#fbbf24", fontSize: "1.1rem" }}>
            💰 Podsumowanie miesiąca
          </strong>
          
          <div style={{ marginTop: 12, marginBottom: 12 }}>
            {summary.map(s => (
              <div key={s.player_nick} style={{ 
                display: "flex", 
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
              }}>
                <span>{s.player_nick}</span>
                <span style={{ fontWeight: 600 }}>{Number(s.player_total).toFixed(2)} zł</span>
              </div>
            ))}
          </div>

          <div style={{ 
            marginTop: 12,
            paddingTop: 12,
            borderTop: "2px solid rgba(251, 191, 36, 0.4)",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "1.1rem"
          }}>
            <span><strong>Razem:</strong></span>
            <span style={{ fontWeight: 700, color: "#fbbf24" }}>
              {Number(monthTotal).toFixed(2)} zł
            </span>
          </div>

          <div style={{ 
            marginTop: 8,
            display: "flex",
            justifyContent: "space-between",
            color: "#d1d5db"
          }}>
            <span>Na osobę (1/4):</span>
            <span style={{ fontWeight: 600 }}>
              {Number(perPerson).toFixed(2)} zł
            </span>
          </div>
        </div>
      )}

      {/* LISTA PARAGONÓW */}
      {loading && <p>⏳ Ładowanie…</p>}

      {!loading && items.length === 0 && (
        <div className="card" style={{ opacity: 0.7, textAlign: "center" }}>
          Brak paragonów w tym miesiącu
        </div>
      )}

      {items.map(r => (
        <div key={r.id} className="card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <strong>{r.players?.nick}</strong>
            <span style={{ fontWeight: 700, color: "#fbbf24" }}>{Number(r.amount).toFixed(2)} zł</span>
          </div>
          <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
            🏪 {r.store}
          </div>
          <div style={{ fontSize: "0.85rem", opacity: 0.6, marginTop: 4 }}>
            {new Date(r.added_at).toLocaleDateString("pl-PL", { 
              day: "numeric", 
              month: "long", 
              hour: "2-digit", 
              minute: "2-digit" 
            })}
          </div>
        </div>
      ))}
    </>
  );
}

