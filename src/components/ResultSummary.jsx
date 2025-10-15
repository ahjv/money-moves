import React from "react";
import "./ResultSummary.css"; // new stylesheet below

export default function ResultSummary({ stats, history = [], onRestart }) {
  const { netWorth = 0, credit = 0, happiness = 0, debt = 0 } = stats || {};

  return (
    <div className="rs-wrap">
      {/* Header */}
      <header className="rs-hero">
        <div className="rs-emoji">🎉</div>
        <div>
          <h1>Game Over — Reflection Summary</h1>
          <p className="rs-sub">Your money moves, at a glance.</p>
        </div>
      </header>

      {/* Stats row */}
      <section className="rs-stats">
        <div className="rs-stat">
          <span className="rs-stat-icon">💰</span>
          <div>
            <div className="rs-stat-label">Net Worth</div>
            <div className="rs-stat-value">${Number(netWorth).toLocaleString()}</div>
          </div>
        </div>
        <div className="rs-stat">
          <span className="rs-stat-icon">📈</span>
          <div>
            <div className="rs-stat-label">Credit Score</div>
            <div className="rs-stat-value">{credit}</div>
          </div>
        </div>
        <div className="rs-stat">
          <span className="rs-stat-icon">😊</span>
          <div>
            <div className="rs-stat-label">Happiness</div>
            <div className="rs-stat-value">{happiness}%</div>
          </div>
        </div>
        <div className="rs-stat">
          <span className="rs-stat-icon">💳</span>
          <div>
            <div className="rs-stat-label">Debt</div>
            <div className="rs-stat-value">${Number(debt).toLocaleString()}</div>
          </div>
        </div>
      </section>

      {/* Timeline of choices */}
      <section className="rs-timeline">
        <h2>Choices Timeline</h2>
        <ol className="rs-steps">
          {history.map((h, i) => {
            const eff = h.effects || {};
            const effList = Object.keys(eff)
              .map((k) => `${k}: ${eff[k] >= 0 ? "+" : ""}${eff[k]}`)
              .join(" · ");

            return (
              <li key={i} className={`rs-step ${h.correct ? "ok" : "bad"}`}>
                <div className="rs-step-bullet">{h.correct ? "✓" : "!"}</div>
                <div className="rs-step-body">
                  <div className="rs-step-title">
                    {i + 1}. {h.scenario?.title || h.scenarioTitle || "Scenario"}
                  </div>
                  <div className="rs-you-chose">You chose: <strong>{h.choiceText}</strong></div>
                  {h.result && <div className="rs-feedback">{h.result}</div>}
                  {effList && <div className="rs-effects">Effects: {effList}</div>}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Lessons + CTA */}
      <section className="rs-lessons">
        <div className="rs-lessons-card">
          <div className="rs-lessons-title">What to take with you</div>
          <div className="rs-lessons-body">
            {history.some((h) => !h.correct) ? (
              <>
                <ul className="rs-lessons-list">
                  {history
                    .filter((h) => !h.correct)
                    .map((h, i) => (
                      <li key={i}>
                        <strong>{h.scenario?.title || h.scenarioTitle}:</strong>{" "}
                        {lessonLine(h)}
                      </li>
                    ))}
                </ul>
                <p className="rs-rule">
                  Rule of thumb: <b>earn → save/invest automatically → cover needs → spend on wants</b>.
                  Use credit responsibly (on-time, in-full, low utilization) to raise your score and
                  slash borrowing costs.
                </p>
              </>
            ) : (
              <p className="rs-rule">
                Clean round. Keep paying yourself first, avoiding interest-bearing balances, and
                letting compounding do the heavy lifting.
              </p>
            )}
          </div>

          <div className="rs-actions">
            <button type="button" className="rs-btn" onClick={onRestart}>
              🔁 Review and try again
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* Small helper to generate a clean lesson line from a history row */
function lessonLine(h) {
  const txt = (h.choiceText || "").toLowerCase();
  if (txt.includes("payday") || txt.includes("high-interest") || txt.includes("premium")) {
    return "High-interest debt and fees compound fast. Compare APRs, avoid fees, and plan a quick payoff.";
  }
  if (txt.includes("in full") || txt.includes("utilization") || txt.includes("card")) {
    return "Use credit on-time and in-full with low utilization (<30%) to build score without interest.";
  }
  if (txt.includes("save") || txt.includes("budget") || txt.includes("auto-save")) {
    return "Automate saving and budget first; it turns intentions into progress.";
  }
  if (txt.includes("emergency") || txt.includes("repair") || txt.includes("fund")) {
    return "Emergency funds turn crises into inconveniences. Start with $500–$1,000 and grow from there.";
  }
  return "Make a plan, avoid high-interest traps, and let small consistent moves compound.";
}
