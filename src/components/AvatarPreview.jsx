import React from "react";

/**
 * Simple 16x16 pixel-style avatar drawn with SVG rectangles.
 * Colors + hairStyle come in via props.
 */
export default function AvatarPreview({ skin, hair, shirt, hairStyle }) {
  // helper to draw a pixel
  const P = ({ x, y, c }) => (
    <rect x={x} y={y} width="1" height="1" fill={c} />
  );

  // hair masks for a few styles
  const hairPixels = {
    short: [
      [5,2],[6,2],[9,2],[10,2],
      [4,3],[11,3],
      [4,4],[11,4],
      [4,5],[11,5],
    ],
    bob: [
      [4,2],[5,2],[6,2],[9,2],[10,2],[11,2],
      [3,3],[12,3],
      [3,4],[12,4],
      [3,5],[12,5],
      [4,6],[11,6],
    ],
    spiky: [
      [6,1],[9,1],
      [5,2],[6,2],[9,2],[10,2],
      [4,3],[11,3],
    ],
    afro: [
      [4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],
      [3,2],[12,2],
      [3,3],[12,3],
    ],
  }[hairStyle] || [];

  // build pixels
  const pixels = [];

  // Face (skin) 8x6 block
  for (let y = 3; y <= 8; y++) {
    for (let x = 5; x <= 10; x++) {
      pixels.push(<P key={`s${x}-${y}`} x={x} y={y} c={skin} />);
    }
  }

  // Eyes
  pixels.push(<P key="e1" x={7} y={6} c="#222" />);
  pixels.push(<P key="e2" x={9} y={6} c="#222" />);

  // Shirt block
  for (let y = 10; y <= 14; y++) {
    for (let x = 4; x <= 11; x++) {
      pixels.push(<P key={`t${x}-${y}`} x={x} y={y} c={shirt} />);
    }
  }

  // Hair overlay
  hairPixels.forEach(([x, y], i) => {
    pixels.push(<P key={`h${i}`} x={x} y={y} c={hair} />);
  });

  return (
    <div style={{ imageRendering: "pixelated" }}>
      <svg
        viewBox="0 0 16 16"
        width="160"
        height="160"
        style={{ background: "#cde3ff", border: "2px solid #1f3a93", borderRadius: 8 }}
      >
        {pixels}
      </svg>
    </div>
  );
}
