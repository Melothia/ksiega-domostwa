export default function Tabs({ active, onChange }) {
  const tabs = [
    { id: "main", label: "Główna" },
    { id: "achievements", label: "Osiągnięcia" },
    { id: "chronicle", label: "Kronika" },
    { id: "receipts", label: "Skrzynia" },
  ];

  return (
    <div className="tabs">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`tab ${active === tab.id ? "active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </div>
      ))}
    </div>
  );
}

