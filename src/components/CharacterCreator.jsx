import React, { useState } from "react";
import AvatarPreview from "./AvatarPreview";
import "./Retro.css";

const colors = {
  skin: ["#f7d7c6", "#e5b08f", "#c27e57", "#8d5a3b", "#5e3a22"],
  hair: ["#2b2b2b", "#5a3a1e", "#a55728", "#c0c0c0", "#1e3d8f"],
  shirt: ["#0ea5e9", "#22c55e", "#eab308", "#ef4444", "#8b5cf6"],
};

const hairStyles = [
  { id: "short", label: "Short" },
  { id: "bob", label: "Bob" },
  { id: "spiky", label: "Spiky" },
  { id: "afro", label: "Afro" },
];

export default function CharacterCreator({ onConfirm, onCancel }) {
  const [name, setName] = useState("");
  const [skin, setSkin] = useState(colors.skin[0]);
  const [hair, setHair] = useState(colors.hair[0]);
  const [shirt, setShirt] = useState(colors.shirt[0]);
  const [hairStyle, setHairStyle] = useState(hairStyles[0].id);

  const canConfirm = name.trim().length > 0;

  const submit = () =>
    onConfirm({ name: name.trim(), skin, hair, shirt, hairStyle });

  return (
    <div className="retro-wrap">
      <div className="crt-frame">
        <h2 className="retro-title sm">Character</h2>

        <div className="creator-grid">
          <div className="creator-left">
            <AvatarPreview skin={skin} hair={hair} shirt={shirt} hairStyle={hairStyle} />
            <div className="name-input">
              <label>Name</label>
              <input
                className="retro-input"
                placeholder="Type your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="creator-right">
            <section>
              <label>Hair Style</label>
              <div className="chip-row">
                {hairStyles.map((h) => (
                  <button
                    key={h.id}
                    className={`chip ${hairStyle === h.id ? "chip-active" : ""}`}
                    onClick={() => setHairStyle(h.id)}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <label>Skin</label>
              <div className="swatch-row">
                {colors.skin.map((c) => (
                  <button
                    key={c}
                    className={`swatch ${skin === c ? "swatch-active" : ""}`}
                    style={{ background: c }}
                    onClick={() => setSkin(c)}
                    title={c}
                  />
                ))}
              </div>
            </section>

            <section>
              <label>Hair</label>
              <div className="swatch-row">
                {colors.hair.map((c) => (
                  <button
                    key={c}
                    className={`swatch ${hair === c ? "swatch-active" : ""}`}
                    style={{ background: c }}
                    onClick={() => setHair(c)}
                    title={c}
                  />
                ))}
              </div>
            </section>

            <section>
              <label>Shirt</label>
              <div className="swatch-row">
                {colors.shirt.map((c) => (
                  <button
                    key={c}
                    className={`swatch ${shirt === c ? "swatch-active" : ""}`}
                    style={{ background: c }}
                    onClick={() => setShirt(c)}
                    title={c}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="creator-actions">
          <button className="retro-btn ghost" onClick={onCancel}>⟵ Back</button>
          <button className="retro-btn primary" disabled={!canConfirm} onClick={submit}>
            ✅ Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
