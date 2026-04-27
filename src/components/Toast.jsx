import { useEffect } from "react";

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`toast ${type === "error" ? "error" : ""}`}>
      <div className="toast-title">{type === "error" ? "⚠ Fout" : "✓ Melding"}</div>
      <div className="toast-msg">{message}</div>
    </div>
  );
}
