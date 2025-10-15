import React, { useEffect, useMemo, useState } from "react";
import scenariosBase from "../data/scenarios";        // your 3 base scenarios (Ava / John / Banker)
import { WORLDS as RAW_WORLDS } from "../data/worlds";
import WorldPhaser from "./WorldPhaser";
import DialogBox from "./DialogBox";
import ResultSummary from "./ResultSummary";
import "./FullscreenGame.css";

/* =========================================================
   SAFETY: normalize worlds so Phaser never sees undefined.
   This prevents the NaN crash you saw.
========================================================= */
function makeGrid(w, h, fill = "g") {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => fill));
}
const SAFE_TOWN = {
  id: "town",
  width: 18,
  height: 12,
  tiles: (() => {
    const t = makeGrid(18, 12, "g");
    // a little house and garden
    for (let y = 3; y <= 8; y++) for (let x = 5; x <= 10; x++) t[y][x] = (x === 7 || x === 8) && (y === 5 || y === 6) ? "d" : "s";
    for (let y = 4; y <= 8; y++) for (let x = 12; x <= 15; x++) t[y][x] = "s";
    // bank door
    t[2][16] = "D";
    return t;
  })(),
  labels: [
    { x: 6, y: 10, text: "Home" },
    { x: 11, y: 7, text: "Garden" },
    { x: 16, y: 1, text: "Bank" },
  ],
  portals: [{ from: { x: 16, y: 2 }, to: { world: "bank", spawn: "lobby" } }],
  spawns: [{ name: "start", x: 2, y: 2 }],
};
const SAFE_BANK = {
  id: "bank",
  width: 10,
  height: 7,
  tiles: (() => {
    const t = makeGrid(10, 7, "s");
    t[6][5] = "D"; // door back out
    return t;
  })(),
  labels: [{ x: 1, y: 1, text: "RBCU" }],
  portals: [{ from: { x: 5, y: 6 }, to: { world: "town", spawn: "start" } }],
  spawns: [{ name: "lobby", x: 2, y: 3 }],
};
// Merge user worlds with fallbacks
const WORLDS = {
  town: normalizeWorld(RAW_WORLDS?.town) || SAFE_TOWN,
  bank: normalizeWorld(RAW_WORLDS?.bank) || SAFE_BANK,
};
function normalizeWorld(w) {
  if (!w) return null;
  const tiles = Array.isArray(w.tiles) && Array.isArray(w.tiles[0]) ? w.tiles : null;
  const width = Number.isFinite(w.width) ? w.width : tiles ? tiles[0].length : null;
  const height = Number.isFinite(w.height) ? w.height : tiles ? tiles.length : null;
  if (!width || !height || !tiles) return null;
  return {
    id: w.id || "world",
    width,
    height,
    tiles,
    labels: Array.isArray(w.labels) ? w.labels : [],
    portals: Array.isArray(w.portals) ? w.portals : [],
    spawns: Array.isArray(w.spawns) ? w.spawns : [],
  };
}

/* =========================================================
   Game config
========================================================= */
const STORAGE_KEY = "mm-levels-v6";
const initialStats = { money: 1100, credit: 650, stress: 30, debt: 0 };

const NPCS = [
  { id: "ava",    world: "town", x: 7,  y: 9,  displayName: "Ava",    style: { skin: 0xffe0bd, hat: 0xff7f50 } },
  { id: "john",   world: "town", x: 13, y: 9,  displayName: "John",   style: { skin: 0xffd1a4, emoji: "🧢" } },
  { id: "banker", world: "bank", x: 4,  y: 2,  displayName: "Banker", style: { skin: 0xf7d7c6, outline: 0x123a8c } },
];

const LEVELS = [
  { id: 0, name: "Level 1 — Foundations",         needCorrect: 3 },
  { id: 1, name: "Level 2 — Credit & Tradeoffs",  needCorrect: 3 },
  { id: 2, name: "Level 3 — Emergencies & Debt",  needCorrect: 3 },
];

const baseIdx = (id) => (id === "ava" ? 0 : id === "john" ? 1 : 2);

/* Difficulty layering on top of your base scenarios */
function buildScenarioForLevel(npcId, levelIdx) {
  const base = scenariosBase?.[baseIdx(npcId)] || {};
  const sc = JSON.parse(JSON.stringify(base || {}));
  sc.title ||= "Scenario";
  sc.description ||= "";
  sc.choices ||= [];

  if (levelIdx === 1) {
    sc.title += " — Tradeoffs";
    sc.description += " Consider fees, timing, utilization, and opportunity cost.";
    sc.choices.push({
      text:
        npcId === "ava"
          ? "Auto-save 15%, cover needs, rest on wants — review monthly."
          : npcId === "john"
          ? "Use card, keep utilization <30%, pay in full monthly."
          : "Use savings for the repair; rebuild the fund next.",
      effects:
        npcId === "john"
          ? { knowledge: 6, savings: -1, happiness: 2 }
          : npcId === "ava"
          ? { knowledge: 5, savings: 5, happiness: 2 }
          : { knowledge: 4, savings: -5, stress: -3 },
      correct: true,
      result:
        npcId === "john"
          ? "Low utilization + paying in full grows score without interest."
          : npcId === "ava"
          ? "Automating a balanced plan beats improvising."
          : "That’s what an emergency fund is for.",
    });
  }

  if (levelIdx === 2) {
    sc.title += " — Hard Mode";
    sc.description +=
      " Income dipped. Fancy card has a $75 fee. Carrying a balance costs 24% APR.";
    sc.choices = sc.choices.map((c) => {
      const eff = { ...(c.effects || c.impact || {}) };
      if (/spend|payday|high-interest|all/i.test(c.text)) {
        eff.debt = (eff.debt || 0) + 200;
        eff.knowledge = (eff.knowledge || 0) - 2;
        eff.happiness = (eff.happiness || 0) - 2;
        c.result = (c.result || "") + " (Hard-mode costs made this worse.)";
      }
      if (/save|budget|secured|research|emergency|in full/i.test(c.text)) {
        eff.knowledge = (eff.knowledge || 0) + 2;
        eff.savings = (eff.savings || 0) + 2;
      }
      c.effects = eff;
      return c;
    });
    sc.choices.push({
      text:
        npcId === "john"
          ? "Premium rewards card ($75 fee); carry a balance to afford it."
          : npcId === "ava"
          ? "Lifestyle upgrade now; ‘save more later’ when income recovers."
          : "Short-term high-interest loan to keep savings untouched.",
      effects:
        npcId === "john"
          ? { debt: 800, knowledge: -3, happiness: 1 }
          : npcId === "ava"
          ? { savings: -10, knowledge: -2, happiness: 3 }
          : { debt: 600, stress: 6, knowledge: -3 },
      correct: false,
      result: "Looks attractive today, but fees/interest snowball under income stress.",
    });
  }

  return sc;
}

/* correctness + lessons */
function isChoiceCorrect(choice) {
  if (typeof choice?.correct === "boolean") return choice.correct;
  const eff = choice?.effects || choice?.impact || {};
  const score =
    (eff.savings ?? 0) * 1 +
    (eff.knowledge ?? 0) * 1 +
    (eff.happiness ?? 0) * 0.25 -
    (eff.debt ?? 0) * 0.001;
  return score >= 0.5;
}
function lessonFor(npcId, choice) {
  const generic = {
    budget:
      "Plan cash flow: income → bills → goals → fun. Automate saving so progress happens even on busy weeks.",
    credit:
      "Use credit on-time, in-full, with low utilization (<30%). Carrying balances adds interest and can lower your score.",
    emergency:
      "Emergency funds turn crises into inconveniences. Start with $500–$1,000, then build toward 3–6 months of expenses.",
    loans:
      "High-interest loans and fees compound pain. If you must borrow, compare APRs, avoid fees, and plan a quick payoff.",
  };
  if (npcId === "ava") return generic.budget;
  if (npcId === "john") return generic.credit;
  const txt = (choice?.text || "").toLowerCase();
  return txt.includes("loan") ? generic.loans : generic.emergency;
}

/* single-speaker conversations (only the NPC you talk to) */
function conversationFor(npcId) {
  if (npcId === "ava") {
    return [
      "Ava: Congrats on the paycheck!",
      "Ava: First move is paying yourself first — even 10–20%.",
      "Ava: Then plan bills, goals, and fun so nothing sneaks up on you.",
    ];
  }
  if (npcId === "john") {
    return [
      "John: Points look nice, but interest is not.",
      "John: Keep utilization under 30% and pay in full every month.",
      "John: That’s how your score climbs without costing you money.",
    ];
  }
  return [
    "Banker: Car trouble happens. Let’s avoid high-interest traps.",
    "Banker: Emergency funds save you from debt spirals.",
    "Banker: If you must borrow, compare APRs and plan a fast payoff.",
  ];
}

/* =========================================================
   Component
========================================================= */
export default function Game() {
  const [stats, setStats] = useState(initialStats);
  const [history, setHistory] = useState([]);

  const [worldId, setWorldId] = useState("town");
  const [spawnName, setSpawnName] = useState(null);

  const [levelIdx, setLevelIdx] = useState(0);
  const [completedThisLevel, setCompletedThisLevel] = useState({}); // {npcId:true}
  const [correctThisLevel, setCorrectThisLevel] = useState(0);

  const [dialog, setDialog] = useState({ lines: [], idx: 0, pendingNpc: null, pendingScenario: null });
  const [activeScenario, setActiveScenario] = useState(null);

  const [showFeedback, setShowFeedback] = useState(false);
  const [lastResult, setLastResult] = useState("");

  const [lessons, setLessons] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [passedAll, setPassedAll] = useState(false);

  // Force a fresh Phaser instance on restart
  const [phaserKey, setPhaserKey] = useState(0);

  // pick/normalize world (prevents NaN)
  const world = useMemo(() => {
    const raw = worldId === "bank" ? RAW_WORLDS?.bank : RAW_WORLDS?.town;
    return normalizeWorld(raw) || (worldId === "bank" ? SAFE_BANK : SAFE_TOWN);
  }, [worldId]);

  const visibleNpcsForWorld = useMemo(
    () => NPCS.filter((n) => n.world === worldId).map((n) => ({ ...n, name: "" })),
    [worldId]
  );

  const progressText = `Talk to all 3 • Correct: ${correctThisLevel}/${LEVELS[levelIdx].needCorrect}`;

  // load
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      if (d?.version === 6) {
        setStats(d.stats ?? initialStats);
        setHistory(d.history ?? []);
        setWorldId(d.worldId ?? "town");
        setSpawnName(d.spawnName ?? null);
        setLevelIdx(d.levelIdx ?? 0);
        setCompletedThisLevel(d.completedThisLevel ?? {});
        setCorrectThisLevel(d.correctThisLevel ?? 0);
        setLessons(d.lessons ?? []);
        setGameOver(d.gameOver ?? false);
        setPassedAll(d.passedAll ?? false);
      }
    } catch {}
  }, []);
  // save
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 6,
        stats,
        history,
        worldId,
        spawnName,
        levelIdx,
        completedThisLevel,
        correctThisLevel,
        lessons,
        gameOver,
        passedAll,
      })
    );
  }, [
    stats,
    history,
    worldId,
    spawnName,
    levelIdx,
    completedThisLevel,
    correctThisLevel,
    lessons,
    gameOver,
    passedAll,
  ]);

  const applyEffects = (prev, effects = {}) => {
    const next = { ...prev };
    for (const k of Object.keys(effects)) {
      const d = Number(effects[k] || 0);
      if (k === "stress") next[k] = Math.max(0, Math.min(100, (next[k] ?? 0) + d));
      else next[k] = Math.max(0, (next[k] ?? 0) + d);
    }
    return next;
  };

  /* TALK → show dialog; scenario opens AFTER dialog closes */
  const handleTalk = (npc) => {
    if (completedThisLevel[npc.id]) return;
    const sc = buildScenarioForLevel(npc.id, levelIdx);
    setDialog({
      lines: conversationFor(npc.id),
      idx: 0,
      pendingNpc: npc.id,
      pendingScenario: sc,
    });
  };

  const openPendingScenario = () => {
    if (!dialog.pendingScenario || !dialog.pendingNpc) {
      setDialog({ lines: [], idx: 0, pendingNpc: null, pendingScenario: null });
      return;
    }
    setActiveScenario({ npcId: dialog.pendingNpc, scenario: dialog.pendingScenario });
    setDialog({ lines: [], idx: 0, pendingNpc: null, pendingScenario: null });
  };

  const handleChoice = (choice) => {
    if (!activeScenario) return;
    const { npcId, scenario } = activeScenario;
    const eff = choice?.effects || choice?.impact || {};
    const correct = isChoiceCorrect(choice);

    setStats((s) => applyEffects(s, eff));
    setHistory((h) => [
      ...h,
      {
        level: levelIdx,
        npcId,
        scenarioTitle: scenario.title,
        choiceText: choice?.text,
        correct,
        result: choice?.result || null,
        effects: eff,
      },
    ]);

    if (!correct) setLessons((ls) => [...ls, { scenario: scenario.title, text: lessonFor(npcId, choice) }]);

    setCompletedThisLevel((m) => ({ ...m, [npcId]: true }));
    if (correct) setCorrectThisLevel((c) => c + 1);

    setLastResult(
      choice?.result ||
        (correct ? "Nice — that strengthens your position." : "Tough choice. Here's the smart take:")
    );
    setShowFeedback(true);

    setTimeout(() => {
      setShowFeedback(false);
      setActiveScenario(null);

      const doneCount = Object.keys({ ...completedThisLevel, [npcId]: true }).length;
      if (doneCount >= 3) {
        const need = LEVELS[levelIdx].needCorrect;
        const got = correct ? correctThisLevel + 1 : correctThisLevel;
        const pass = got >= need;

        if (levelIdx < LEVELS.length - 1) {
          if (pass) {
            setLevelIdx(levelIdx + 1);
            setCompletedThisLevel({});
            setCorrectThisLevel(0);
            setWorldId("town");
            setSpawnName(null);
          } else {
            setPassedAll(false);
            setGameOver(true);
          }
        } else {
          setPassedAll(pass);
          setGameOver(true);
        }
      }
    }, 900);
  };

  const restartGame = () => {
    setStats(initialStats);
    setHistory([]);
    setWorldId("town");
    setSpawnName(null);
    setLevelIdx(0);
    setCompletedThisLevel({});
    setCorrectThisLevel(0);
    setLessons([]);
    setGameOver(false);
    setPassedAll(false);
    setPhaserKey((k) => k + 1);                 // force fresh Phaser instance
    localStorage.removeItem(STORAGE_KEY);
  };

  /* --------- END SCREEN --------- */
  if (gameOver) {
    const happiness = Math.max(0, 100 - stats.stress);
    return (
      <div className="game-shell rs-page">
        <ResultSummary
          stats={{ netWorth: stats.money, credit: stats.credit, happiness, debt: stats.debt }}
          history={history}
          onRestart={restartGame}
        />
      </div>
    );
  }

  /* --------- IN-GAME --------- */
  const happiness = Math.max(0, 100 - stats.stress);

  return (
    <div className="game-shell">
      {/* HUD */}
      <div className="hud-overlay">
        <div className="hud-card">
          <div className="hud-row">
            <div>🏷 <b>{LEVELS[levelIdx].name}</b> — {progressText}</div>
          </div>
        </div>
        <div className="hud-card">
          <div className="hud-row">
            <div>💰 <b>Net Worth:</b> ${stats.money.toLocaleString()}</div>
            <div>📊 <b>Credit:</b> {stats.credit}</div>
            <div>😊 <b>Happiness:</b> {happiness}%</div>
            <div>💳 <b>Debt:</b> ${stats.debt}</div>
          </div>
        </div>
      </div>

      {/* Phaser canvas */}
      <div className="canvas-wrap">
        <WorldPhaser
          key={phaserKey}               // ensures clean remounts
          world={world}
          spawnName={spawnName}
          npcs={visibleNpcsForWorld}
          onTalkNPC={handleTalk}
          onPortal={({ x, y }) => {
            const p = world.portals?.find((pp) => pp.from.x === x && pp.from.y === y);
            if (!p) return;
            setWorldId(p.to.world);
            setSpawnName(p.to.spawn || null);
          }}
        />
      </div>

      {/* Dialog FIRST. When it closes, we open the pending scenario. */}
      {dialog.lines.length > 0 && (
        <DialogBox
          lines={dialog.lines}
          index={dialog.idx}
          onNext={() =>
            setDialog((d) => ({ ...d, idx: Math.min(d.idx + 1, d.lines.length - 1) }))
          }
          onClose={openPendingScenario}
        />
      )}

      {/* Scenario AFTER dialog */}
      {activeScenario && (
        <div className="scenario-card">
          <div className="scenario-top">
            <span className="scenario-pill">{LEVELS[levelIdx].name}</span>
            <h3>{activeScenario.scenario.title}</h3>
          </div>
          <p>{activeScenario.scenario.description}</p>

          {showFeedback && lastResult && (
            <div className="result-feedback"><p>{lastResult}</p></div>
          )}

          {!showFeedback && (
            <div className="choices">
              {(activeScenario.scenario.choices || []).map((c, i) => (
                <button key={i} onClick={() => handleChoice(c)}>{c.text}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
