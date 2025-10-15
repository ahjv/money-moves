import React from 'react';
import './StatsPanel.css';

const toMoney = (n) => `$${Number(n || 0).toLocaleString()}`;

const StatsPanel = ({ stats = {} }) => {
  // Accept either display-ready keys OR raw game-state keys
  const netWorth =
    stats.netWorth ??
    ((stats.money ?? 0) + (stats.savings ?? 0) - (stats.debt ?? 0));

  const creditScore = stats.creditScore ?? stats.credit ?? 0;
  const happiness = stats.happiness ?? Math.max(0, 100 - (stats.stress ?? 0));
  const debt = stats.debt ?? 0;

  return (
    <div className="stats-panel">
      <div className="stat">💰 <strong>Net Worth:</strong> {toMoney(netWorth)}</div>
      <div className="stat">📊 <strong>Credit Score:</strong> {creditScore}</div>
      <div className="stat">😊 <strong>Happiness:</strong> {happiness}%</div>
      <div className="stat">💳 <strong>Debt:</strong> {toMoney(debt)}</div>
    </div>
  );
};

export default StatsPanel;
