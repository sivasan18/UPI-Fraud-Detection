// ==============================================================================
// Fraud Detection and Risk Assessment System
// Risk Gauge Radial SVG Component
// ==============================================================================
import React from 'react';

export default function RiskGauge({ score = 15, size = 180 }) {
  const s = Math.max(0, Math.min(100, score));
  const radius = 70;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  // Arc of 240 degrees (from 150 deg to 390 deg)
  const arcLength = circumference * (240 / 360);
  const strokeDashoffset = arcLength - (s / 100) * arcLength;

  let color = '#10b981';
  let level = 'LOW';
  if (s >= 80) {
    color = '#e11d48';
    level = 'CRITICAL';
  } else if (s >= 60) {
    color = '#f43f5e';
    level = 'HIGH';
  } else if (s >= 30) {
    color = '#f59e0b';
    level = 'MEDIUM';
  }

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox="0 0 200 200" style={{ transform: 'rotate(150deg)' }}>
        {/* Background Track */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Active Value Arc */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s' }}
        />
      </svg>

      <div style={{ position: 'absolute', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', lineHeight: 1, fontFamily: 'monospace' }}>
          {s}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
          / 100 Risk
        </div>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color, marginTop: 4, textTransform: 'uppercase' }}>
          {level} RISK
        </div>
      </div>
    </div>
  );
}
