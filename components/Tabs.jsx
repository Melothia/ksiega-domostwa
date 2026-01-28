// components/Tabs.jsx
// Mobilne zakładki: Główna / Osiągnięcia / Kronika / Skrzynia Paragonów

export default function Tabs({ active, onChange }) {
  const tabs = [
    { id: "main", label: "Główna" },
    { id: "achievements", label: "Osiągnięcia" },
    { id: "chronicle", label: "Kronika" },
    { id: "receipts", label: "Skrzynia" },
  ];

  return (
    <div className="tabs">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`tab ${active === t.id ? "active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
