import React from 'react';
import './ScenarioCard.css';

const ScenarioCard = ({ scenario, onSelect }) => {
  if (!scenario) return null;

  return (
    <div className="scenario-card">
      <h2 className="scenario-title">💸 {scenario.title}</h2>
      <p className="scenario-description">{scenario.description}</p>

      <div className="options">
        <button className="option-button" onClick={() => onSelect(scenario.options[0])}>
          ✅ {scenario.options[0].text}
        </button>
        <button className="option-button" onClick={() => onSelect(scenario.options[1])}>
          ❌ {scenario.options[1].text}
        </button>
      </div>
    </div>
  );
};

export default ScenarioCard;
