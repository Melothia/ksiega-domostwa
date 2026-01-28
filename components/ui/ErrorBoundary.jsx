// components/ui/ErrorBoundary.jsx
// Catches React errors and displays fallback UI

import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "20px",
            background: "rgba(239, 68, 68, 0.1)",
            borderRadius: "12px",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            margin: "20px",
          }}
        >
          <h3 style={{ color: "#ef4444", marginTop: 0 }}>
            ⚠️ Coś poszło nie tak
          </h3>
          <p style={{ margin: "8px 0", opacity: 0.8 }}>
            {this.state.error?.message || "Nieznany błąd"}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "8px 16px",
              background: "rgba(239, 68, 68, 0.2)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              borderRadius: "6px",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            🔄 Odśwież stronę
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
