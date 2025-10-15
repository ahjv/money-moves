import React from "react";
import "./DialogBox.css";

export default function DialogBox({ lines = [], index = 0, onNext, onClose }) {
  if (!lines.length) return null;
  return (
    <div className="dialog-backdrop" onClick={onNext}>
      <div className="dialog-card" onClick={(e)=>e.stopPropagation()}>
        <p>{lines[index]}</p>
        <div className="dialog-actions">
          {index < lines.length - 1 ? (
            <button onClick={onNext}>Next ▶</button>
          ) : (
            <button onClick={onClose}>Close ✕</button>
          )}
        </div>
      </div>
    </div>
  );
}
