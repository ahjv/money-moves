import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

// ===== constants (kept local so you don't need a separate ./constants file) =====
const TILE = 32;
const SCALE = 1.8;
const PALETTE = {
  sky:      0xcfe8ff,
  grassA:   0xa9e39a,
  grassB:   0x9bd98d,
  path:     0xeed39c,
  wood:     0x6b3f1f,
  door:     0x4285f4,
  outline:  0x123a8c,
  labelBg:  0x0f1f3b,
  hintBg:   0x0f1f3b,
};

// --- rounded-rect helper for various UI chips ---
const rr = (scene, x, y, w, h, r, fill, stroke, sw = 1) => {
  const g = scene.add.graphics();
  if (stroke) g.lineStyle(sw, stroke, 1);
  g.fillStyle(fill, 1);
  g.fillRoundedRect(x, y, w, h, r);
  return g;
};

// --- simple auto-label manager (sticks to targets + avoids overlap) ---
function makeLabel(scene, text, depth = 60) {
  const padX = 8, padY = 5;
  const label = scene.add.text(0, 0, text, {
    fontSize: `${12 * SCALE}px`,
    color: "#ffffff",
    stroke: "#000000",
    strokeThickness: 3,
  }).setDepth(depth + 1);

  const bg = scene.add.graphics().setDepth(depth);
  label._bg = bg;

  label.updateBg = () => {
    const w = label.width + padX * 2;
    const h = label.height + padY * 2;
    const x = label.x - padX;
    const y = label.y - padY;

    bg.clear();
    bg.fillStyle(PALETTE.labelBg, 0.72);
    bg.lineStyle(1, 0x000000, 0.9);
    bg.fillRoundedRect(x, y, w, h, 8);
    bg.strokeRoundedRect(x, y, w, h, 8);

    label._bounds = { x, y, w, h };
  };

  return label;
}

// try spots around (cx, cy) and choose the first non-overlapping, on-screen spot
function placeAround(cx, cy, label, others, bounds) {
  const offsets = [
    { dx: 22,  dy:  0 },   // prefer right of the target
    { dx:  0,  dy: -18 },  // above
    { dx: -22, dy:  0 },   // left
    { dx:  0,  dy:  18 },  // below
    { dx:  22, dy: -18 }, { dx: -22, dy: -18 }, { dx: 22, dy: 18 }, { dx: -22, dy: 18 },
  ];

  const fits = (x, y) => {
    label.setPosition(x, y);
    label.updateBg();
    const a = label._bounds;
    if (a.x < 0 || a.y < 0 || a.x + a.w > bounds.w || a.y + a.h > bounds.h) return false;
    for (const o of others) {
      if (!o._bounds) continue;
      const b = o._bounds;
      const overlap = !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
      if (overlap) return false;
    }
    return true;
  };

  for (const off of offsets) {
    if (fits(cx + off.dx, cy + off.dy)) return;
  }
  // worst case: pin above
  fits(cx, cy - 18);
}

/**
 * Props:
 *  - world:  { width, height, tiles, portals?, labels?, spawns? }
 *  - npcs:   [{ id, x, y, displayName?, style? }]
 *  - spawnName: optional spawn id from world.spawns
 *  - onTalkNPC(npcMeta)
 *  - onPortal({x,y})
 */
export default function WorldPhaser({ world, npcs = [], spawnName, onTalkNPC, onPortal }) {
  const rootRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    if (!rootRef.current || !world) return;

    if (gameRef.current) {
      try { gameRef.current.destroy(true); } catch {}
      gameRef.current = null;
    }

    // ---- normalize world ----
    const W = Number.isFinite(world.width) ? world.width : (world.tiles?.[0]?.length || 16);
    const H = Number.isFinite(world.height) ? world.height : (world.tiles?.length || 10);
    const TILES = (Array.isArray(world.tiles) && Array.isArray(world.tiles[0]))
      ? world.tiles
      : Array.from({ length: H }, () => Array.from({ length: W }, () => "g"));

    // keep labels, but drop Home/Garden to keep the scene clean
    const LABELS = (Array.isArray(world.labels) ? world.labels : [])
      .filter(l => !/^(home|garden)$/i.test(l?.text || ""));

    const SPAWNS  = Array.isArray(world.spawns)  ? world.spawns  : [];

    // Person as a CONTAINER (so all parts move together)
    function makePerson(scene, cx, cy, theme) {
      const z = theme.depth ?? 3;
      const skin  = theme.skin ?? 0xffe7cc;
      const shirt = theme.shirt ?? 0x3b82f6;
      const pants = theme.pants ?? 0x243447;
      const hat   = theme.hat;
      const emoji = theme.emoji;
      const outline = theme.outline ?? PALETTE.outline;

      const c = scene.add.container(cx, cy).setDepth(z);

      const PX = TILE * SCALE;
      const shadow = scene.add.ellipse(0, PX*0.28, PX*0.6, PX*0.22, 0x000000, 0.16);
      const body  = scene.add.rectangle(0, PX*0.18, PX*0.55, PX*0.45, shirt).setStrokeStyle(2, outline);
      const legs  = scene.add.rectangle(0, PX*0.45, PX*0.55, PX*0.18, pants).setStrokeStyle(2, outline);
      const head  = scene.add.rectangle(0, -PX*0.05, PX*0.58, PX*0.58, skin).setStrokeStyle(3, outline);
      const eyeL  = scene.add.rectangle(-PX*0.13, -PX*0.12, PX*0.08, PX*0.08, 0x000000);
      const eyeR  = scene.add.rectangle( PX*0.13, -PX*0.12, PX*0.08, PX*0.08, 0x000000);
      const mouth = scene.add.rectangle(0, PX*0.02, PX*0.18, PX*0.05, 0x000000, 0.8);

      c.add([shadow, body, legs, head, eyeL, eyeR, mouth]);

      if (hat) {
        const brim = scene.add.rectangle(0, -PX*0.38, PX*0.66, PX*0.18, hat).setStrokeStyle(2, outline);
        const cap  = scene.add.rectangle(0, -PX*0.30, PX*0.40, PX*0.08, hat).setStrokeStyle(2, outline);
        c.add([brim, cap]);
      }
      if (emoji) {
        const em = scene.add.text(-PX*0.16, -PX*0.56, emoji, { fontSize: `${16*SCALE}px` });
        c.add(em);
      }

      c._baseY = cy;
      return c;
    }

    class Scene extends Phaser.Scene {
      constructor() {
        super("WorldScene");
        this.player = null;
        this.keys = null;
        this.hintBg = null;
        this.hint = null;
        this.interactTarget = null; // { type: "npc"|"door", data:{...} }
        this.npcSprites = [];
        this._labels = [];
        this.t = 0;

        // map refs for update()
        this.W = W;
        this.H = H;
        this.TILES = TILES;
      }

      create() {
        this.cameras.main.setBackgroundColor(PALETTE.sky);

        const PX = TILE * SCALE;

        // tiles
        for (let y = 0; y < this.H; y++) {
          for (let x = 0; x < this.W; x++) {
            const t = (this.TILES[y] && this.TILES[y][x]) || "g";
            const checker = ((x + y) % 2 === 0);
            const color =
              t === "g" ? (checker ? PALETTE.grassA : PALETTE.grassB)
              : t === "s" ? PALETTE.path
              : t === "d" ? PALETTE.wood
              : t === "D" ? PALETTE.door
              : PALETTE.grassA;

            const q = this.add.rectangle(x*PX, y*PX, PX-1, PX-1, color).setOrigin(0,0);
            q.setStrokeStyle(1, 0x000000, 0.08);

            if (t === "D") {
              this.add.rectangle(x*PX + PX/2, y*PX + PX/2, PX*0.92, PX*0.92, PALETTE.door, 0.28)
                .setStrokeStyle(3, PALETTE.outline, 0.65);
            }
          }
        }

        // NPCs
        this.npcSprites = (npcs || []).map(n => {
          const cx = n.x*PX + PX/2, cy = n.y*PX + PX/2;
          const style = {
            skin: 0xffe7cc,
            shirt: n.id === "ava" ? 0xf97316 : n.id === "john" ? 0x60a5fa : 0x334155,
            pants: n.id === "banker" ? 0x1f2937 : 0x374151,
            hat:   n.id === "ava" ? 0xff6243 : undefined,
            emoji: n.id === "john" ? "🧢" : undefined,
            outline: PALETTE.outline,
            depth: 20
          };
          const c = makePerson(this, cx, cy, style);
          return { id: n.id, x: n.x, y: n.y, meta: n, container: c };
        });

        // player
        let start = { x: 2, y: 2 };
        if (spawnName) {
          const sp = SPAWNS.find(s => s.name === spawnName);
          if (sp) start = { x: sp.x, y: sp.y };
        }
        this.player = makePerson(this, start.x*PX + PX/2, start.y*PX + PX/2, {
          skin: 0xffe0bd, shirt: 0x2563eb, pants: 0x1f2937, hat: 0x111827, outline: PALETTE.outline, depth: 30
        });

        // input
        this.keys = this.input.keyboard.addKeys({
          up: "W", down: "S", left: "A", right: "D",
          up2: "UP", down2: "DOWN", left2: "LEFT", right2: "RIGHT",
          interact: "E",
        });

        // hint bubble (high depth)
        this.hintBg = rr(this, 0,0,10,10,8, PALETTE.hintBg, PALETTE.outline, 1.2)
          .setDepth(1000).setVisible(false);
        this.hint   = this.add.text(0,0,"", { fontSize: `${12*SCALE}px`, color: "#ebf3ff" })
          .setDepth(1001).setVisible(false);

        this.input.keyboard.on("keydown-E", () => {
          if (!this.interactTarget) return;
          if (this.interactTarget.type === "npc" && typeof onTalkNPC === "function") {
            onTalkNPC(this.interactTarget.data.meta);
          } else if (this.interactTarget.type === "door" && typeof onPortal === "function") {
            onPortal({ x: this.interactTarget.data.x, y: this.interactTarget.data.y });
          }
        });

        // ----- LABELS that stick to objects and avoid overlaps -----
        this._labels = [];

        // 1) labels for NPCs (use displayName or id)
        (this.npcSprites || []).forEach(n => {
          const name = n.meta.displayName || n.id;
          const lab = makeLabel(this, name);
          lab._follow = () => ({ x: n.container.x, y: n.container.y - PX * 0.65 });
          this._labels.push(lab);
        });

        // 2) world.LABELS (we already filtered out Home/Garden)
        LABELS.forEach(lbl => {
          const lab = makeLabel(this, lbl.text);
          lab._follow = () => ({
            x: lbl.x * PX + PX / 2,
            y: lbl.y * PX - PX * 0.15,
          });
          this._labels.push(lab);
        });

        // NOTE: no auto "Door" label — per your request

        // camera
        this.cameras.main.setBounds(0,0,this.W*PX,this.H*PX);
        this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
      }

      update(_, delta = 16) {
        const PX = TILE * SCALE;

        // movement
        const speed = 2.45;
        let vx = 0, vy = 0;
        if (this.keys.left.isDown || this.keys.left2.isDown) vx = -speed;
        else if (this.keys.right.isDown || this.keys.right2.isDown) vx = speed;
        if (this.keys.up.isDown || this.keys.up2.isDown) vy = -speed;
        else if (this.keys.down.isDown || this.keys.down2.isDown) vy = speed;

        const mapW = this.W * PX, mapH = this.H * PX;
        const nx = Phaser.Math.Clamp(this.player.x + vx, PX/2, mapW - PX/2);
        const ny = Phaser.Math.Clamp(this.player.y + vy, PX/2, mapH - PX/2);
        this.player.setPosition(nx, ny);

        // idle bob for nearby NPCs
        this.t += delta;
        const bob = Math.sin(this.t / 500) * 2;

        const tx = Math.round((this.player.x - PX/2) / PX);
        const ty = Math.round((this.player.y - PX/2) / PX);
        const md = (x1,y1,x2,y2) => Math.abs(x1-x2) + Math.abs(y1-y2);
        const RANGE = 2;

        let nearestNpc = null, best = 1e9;
        for (const n of this.npcSprites) {
          const d = md(tx,ty,n.x,n.y);
          n.container.y = n.container._baseY + (d <= RANGE ? bob : 0);
          if (d <= RANGE && d < best) { nearestNpc = n; best = d; }
        }

        // door near the player (Manhattan distance <= 1)
        let door = null;
        const candidates = [{x:tx,y:ty},{x:tx+1,y:ty},{x:tx-1,y:ty},{x:tx,y:ty+1},{x:tx,y:ty-1}];
        for (const c of candidates) {
          const tt = (this.TILES[c.y] && this.TILES[c.y][c.x]) || "g";
          if (tt === "D") { door = c; break; }
        }

        // hint bubble (NPC takes priority; else door)
        const padX = 8, padY = 5;
        if (nearestNpc) {
          const msg = `${nearestNpc.meta.displayName || "Talk"} — press E`;
          this.hint.setText(msg);
          const w = this.hint.width + padX*2, h = this.hint.height + padY*2;
          const x = nearestNpc.container.x - w/2, y = nearestNpc.container.y - PX*0.95;

          this.hintBg.clear();
          this.hintBg.fillStyle(PALETTE.hintBg, 0.92);
          this.hintBg.lineStyle(1.2, PALETTE.outline, 0.9);
          this.hintBg.fillRoundedRect(x, y, w, h, 8);
          this.hintBg.strokeRoundedRect(x, y, w, h, 8);
          this.hintBg.setVisible(true);
          this.hint.setPosition(x + padX, y + padY).setVisible(true);

          this.interactTarget = { type: "npc", data: nearestNpc };
        } else if (door) {
          const msg = `Press E to enter`;
          this.hint.setText(msg);
          const w = this.hint.width + padX*2, h = this.hint.height + padY*2;
          const x = door.x*PX + PX/2 - w/2, y = door.y*PX - PX*0.75;

          this.hintBg.clear();
          this.hintBg.fillStyle(PALETTE.hintBg, 0.92);
          this.hintBg.lineStyle(1.2, PALETTE.outline, 0.9);
          this.hintBg.fillRoundedRect(x, y, w, h, 8);
          this.hintBg.strokeRoundedRect(x, y, w, h, 8);
          this.hintBg.setVisible(true);
          this.hint.setPosition(x + padX, y + padY).setVisible(true);

          this.interactTarget = { type: "door", data: door };
        } else {
          this.hintBg.setVisible(false);
          this.hint.setVisible(false);
          this.interactTarget = null;
        }

        // ----- update label positions + avoid overlaps -----
        if (this._labels?.length) {
          const bounds = { w: this.W * PX, h: this.H * PX };
          // position pass
          for (const lab of this._labels) {
            const p = lab._follow ? lab._follow() : null;
            if (p) lab.setPosition(p.x, p.y);
            lab.updateBg();
          }
          // simple overlap resolution pass (stable order)
          const placed = [];
          for (const lab of this._labels) {
            const p = lab._follow ? lab._follow() : { x: lab.x, y: lab.y };
            placeAround(p.x, p.y, lab, placed, bounds);
            placed.push(lab);
          }
        }
      }
    }

    const config = {
      type: Phaser.AUTO,
      width: W * TILE * SCALE,
      height: H * TILE * SCALE,
      parent: rootRef.current,
      backgroundColor: "#cfe8ff",
      scene: Scene,
      physics: { default: "arcade" },
      pixelArt: true,
      roundPixels: true,
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    return () => {
      try { game.destroy(true); } catch {}
      gameRef.current = null;
    };
  }, [world, npcs, spawnName, onTalkNPC, onPortal]);

  return <div ref={rootRef} style={{ width: "100%", height: "100%" }} />;
}
