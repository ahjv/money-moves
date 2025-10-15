import React, { useEffect, useMemo } from "react";
import { MAP, TILESET, TILE_SIZE, SCALE, tileAt } from "../data/worlds";
import "./TileMap.css";

const classes = {
  grass: "t-grass",
  path: "t-path",
  soil: "t-soil",
  house: "t-house",
  tree: "t-tree",
  well: "t-well",
};

export default function TileMap({ player, pois, onKeyMove }) {
  // handle WASD/Arrow movement
  useEffect(() => {
    const handle = (e) => {
      const k = e.key.toLowerCase();
      let dx = 0, dy = 0;
      if (k === "a" || k === "arrowleft") dx = -1;
      else if (k === "d" || k === "arrowright") dx = 1;
      else if (k === "w" || k === "arrowup") dy = -1;
      else if (k === "s" || k === "arrowdown") dy = 1;
      else return;
      e.preventDefault();
      onKeyMove?.(dx, dy);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onKeyMove]);

  const width = MAP[0].length;
  const height = MAP.length;
  const px = TILE_SIZE * SCALE;

  const poiMap = useMemo(() => {
    const m = new Map();
    pois.forEach((p) => m.set(`${p.x},${p.y}`, p));
    return m;
  }, [pois]);

  return (
    <div
      className="tm-wrap"
      style={{ width: width * px + 16, height: height * px + 16 }}
    >
      <div
        className="tm-grid"
        style={{
          gridTemplateColumns: `repeat(${width}, ${px}px)`,
          gridTemplateRows: `repeat(${height}, ${px}px)`,
        }}
      >
        {MAP.map((row, y) =>
          row.split("").map((ch, x) => {
            const t = TILESET[ch];
            const poi = poiMap.get(`${x},${y}`);
            return (
              <div key={`${x}-${y}`} className={`tm-cell ${classes[t.name]}`}>
                {poi && (
                  <div
                    className={`poi ${poi.done ? "poi-done" : ""}`}
                    title={poi.label}
                  >
                    ★
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Player */}
      <div
        className="tm-player"
        style={{
          width: px,
          height: px,
          left: player.x * px + 8,
          top: player.y * px + 8,
        }}
      >
        {/* little pixel dude */}
        <div className="p-body" />
        <div className="p-hat" />
      </div>
    </div>
  );
}
