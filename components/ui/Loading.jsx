// components/ui/Loading.jsx
// Loading spinner/skeleton component

export function Loading({ text = "Ładowanie…" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        color: "#a78bfa",
      }}
    >
      <span style={{ fontSize: "1.5rem", marginRight: "12px" }}>⏳</span>
      <span>{text}</span>
    </div>
  );
}

export function LoadingOverlay({ text = "Ładowanie…" }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          padding: "24px 40px",
          borderRadius: "12px",
          border: "1px solid rgba(251, 191, 36, 0.2)",
          color: "#fbbf24",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <span style={{ fontSize: "1.5rem" }}>⏳</span>
        <span>{text}</span>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div
      className="card"
      style={{
        animation: "pulse 1.5s ease-in-out infinite",
        background: "rgba(255, 255, 255, 0.05)",
      }}
    >
      <div
        style={{
          height: "20px",
          width: "60%",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "4px",
          marginBottom: "12px",
        }}
      />
      <div
        style={{
          height: "16px",
          width: "80%",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "4px",
        }}
      />
    </div>
  );
}
