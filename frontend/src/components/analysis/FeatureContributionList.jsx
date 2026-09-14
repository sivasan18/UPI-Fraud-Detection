// ==============================================================================
// Smart UPI Fraud Detection System
// XAI Feature Contribution Attribution List
// ==============================================================================
import React from 'react';

export default function FeatureContributionList({ factors = [] }) {
  if (!factors || factors.length === 0) {
    return (
      <div className="text-xs text-tertiary py-4 text-center">
        No specific risk factors elevated for this transaction.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {factors.map((factor, i) => {
        const contribution = factor.contribution || 0;
        let barColor = 'var(--risk-low)';
        if (contribution >= 20) barColor = 'var(--risk-critical)';
        else if (contribution >= 12) barColor = 'var(--risk-high)';
        else if (contribution >= 6) barColor = 'var(--risk-medium)';

        return (
          <div key={i} className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8, border: '1px solid var(--pink-border)' }}>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-secondary">{factor.name}</span>
              <span className="font-mono font-bold" style={{ color: barColor }}>
                +{contribution} pts
              </span>
            </div>
            <div className="progress-bar mb-2">
              <div
                className="progress-bar-fill"
                style={{ width: `${Math.min(100, (contribution / 35) * 100)}%`, background: barColor }}
              />
            </div>
            <div className="text-xs text-tertiary leading-relaxed">
              {factor.description}
            </div>
          </div>
        );
      })}
    </div>
  );
}
