import React, { useEffect, useRef } from 'react';
import './WorldMap.css';
import AvatarPreview from './AvatarPreview';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/**
 * props:
 * - width, height (tiles)
 * - player: {x,y}
 * - setPlayer: fn
 * - pois: [{id,x,y,label,done}]
 * - onEnterPOI: (poi) => void
 * - avatar: {skin, hair, shirt, hairStyle}
 */
export default function WorldMap({ width=12, height=8, player, setPlayer, pois=[], onEnterPOI, avatar }) {
  const containerRef = useRef(null);

  // keyboard controls
  useEffect(() => {
    const handle = (e) => {
      const key = e.key.toLowerCase();
      let dx = 0, dy = 0;
      if (key === 'arrowleft' || key === 'a') dx = -1;
      else if (key === 'arrowright' || key === 'd') dx = 1;
      else if (key === 'arrowup' || key === 'w') dy = -1;
      else if (key === 'arrowdown' || key === 's') dy = 1;
      else return;

      e.preventDefault();
      setPlayer((p) => {
        const nx = clamp(p.x + dx, 0, width - 1);
        const ny = clamp(p.y + dy, 0, height - 1);
        const next = { x: nx, y: ny };
        const hit = pois.find(po => !po.done && po.x === nx && po.y === ny);
        if (hit) onEnterPOI?.(hit);
        return next;
      });
    };

    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [width, height, pois, onEnterPOI, setPlayer]);

  return (
    <div className="map-wrap" ref={containerRef}>
      <div
        className="map-grid"
        style={{ gridTemplateColumns: `repeat(${width}, 40px)`, gridTemplateRows: `repeat(${height}, 40px)` }}
      >
        {[...Array(width*height)].map((_, i) => {
          const x = i % width;
          const y = Math.floor(i / width);
          const isPlayer = player.x === x && player.y === y;
          const poi = pois.find(po => po.x === x && po.y === y);
          return (
            <div key={i} className="cell">
              {poi && (
                <div className={`poi ${poi.done ? 'poi-done' : ''}`} title={poi.label}>
                  ★
                </div>
              )}
              {isPlayer && (
                <div className="player">
                  <div className="avatar-mini">
                    <AvatarPreview
                      skin={avatar?.skin || '#f7d7c6'}
                      hair={avatar?.hair || '#2b2b2b'}
                      shirt={avatar?.shirt || '#0ea5e9'}
                      hairStyle={avatar?.hairStyle || 'short'}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="map-help">Use WASD or Arrow Keys to move. Step on ★ to start a scenario.</div>
    </div>
  );
}
