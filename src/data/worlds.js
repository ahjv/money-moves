// src/data/worlds.js
// Legend: G=grass (walk), .=path (walk), X/W=blocked, D=door, B=floor (walk)
export const WORLDS = {
  town: {
    id: "town",
    tileSize: 24,
    scale: 2.5,
    map: [
      "GGGGGGGGGGGGGGGG",
      "GGGGXGGGGGGGGGGG",
      "GGGG..GGGGGGGGDG", // D at (14,2)
      "GG..XXXXGGGGGGGG",
      "GG..X..XGG....GG",
      "GG..X..XGG....GG",
      "GG..X..XGG....GG",
      "GG..XXXXGG....GG",
      "GGGG..GGGGGGXGGG",
      "GGGG..GGGGGGGGGG",
      "GGGGGGGGGGGGGGGG",
    ],
    start: { x: 2, y: 2 },
    portals: [
      { from: { x: 14, y: 2 }, to: { world: "bank", spawn: "doorOut" } },
    ],
    // subtle labels drawn on map
    labels: [
      { x: 3,  y: 7,  text: "Home" },
      { x: 10, y: 6,  text: "Community Garden" },
      { x: 13, y: 1,  text: "Bank →" },
    ],
    npcs: [], // (NPCs come from Game.jsx so we can tie them to scenarios)
  },

  bank: {
    id: "bank",
    tileSize: 24,
    scale: 2.5,
    map: [
      "WWWWWWWW",
      "WBBBBBBW",
      "WBBBBBBW",
      "WBBBBBBW",
      "WBBDBBBW", // door out at (3,4)
      "WBBBBBBW",
      "WWWWWWWW",
    ],
    start: { x: 4, y: 4 },
    spawnPoints: { doorOut: { x: 4, y: 4 } },
    portals: [
      { from: { x: 3, y: 4 }, to: { world: "town", x: 14, y: 2 } },
    ],
    labels: [{ x: 2, y: 1, text: "RBCU" }],
    npcs: [],
  }
};

const BLOCKED = new Set(["X", "W"]);
export const isWalkable = (world, x, y) => {
  const m = world.map;
  if (y < 0 || y >= m.length || x < 0 || x >= m[0].length) return false;
  return !BLOCKED.has(m[y][x]);
};
export const isDoor = (world, x, y) => {
  const m = world.map;
  if (y < 0 || y >= m.length || x < 0 || x >= m[0].length) return false;
  return m[y][x] === "D";
};
