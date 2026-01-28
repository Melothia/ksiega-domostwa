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
          className={active === t.id ? "tab active" : "tab"}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
