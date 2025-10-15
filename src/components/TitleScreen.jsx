import React from "react";
import "./Retro.css";

export default function TitleScreen({ onStart }) {
  return (
    <div className="retro-wrap">
      <div className="crt-frame">
        <h1 className="retro-title">💸 Money Moves</h1>
        <p className="retro-sub">A tiny life-sim about choices & cash</p>
        <button className="retro-btn primary" onClick={onStart}>
          ▶ Start
        </button>
      </div>
    </div>
  );
}
