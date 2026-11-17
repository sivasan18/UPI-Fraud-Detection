// ==============================================================================
// Administrator Photo Frame & Circular Administrator Badge
// ==============================================================================
import React, { useState } from 'react';

export default function AdminAvatarFrame({ persona }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="ninja-avatar-section">
      {/* 1. Center Framed Photograph */}
      <div className="ninja-photo-frame">
        {!imageError ? (
          <img
            src={persona.avatar}
            alt={`${persona.fullName} portrait`}
            className="ninja-photo-img"
            onError={() => setImageError(true)}
            key={persona.avatar}
          />
        ) : (
          <div className="ninja-photo-fallback">
            {/* Fallback Female Administrator Vector Illustration */}
            <svg viewBox="0 0 100 100" fill="none" className="fallback-ninja-svg">
              <circle cx="50" cy="50" r="46" fill="#141414" stroke="#facc15" strokeWidth="2" />
              {/* Hair */}
              <path d="M28 50 C26 30 40 20 50 20 C60 20 74 30 72 50 C72 65 68 75 68 75 C68 75 60 62 50 62 C40 62 32 75 32 75 C32 75 28 65 28 50 Z" fill="#262626" />
              {/* Face */}
              <circle cx="50" cy="46" r="16" fill="#e5e5e5" />
              {/* Eyes */}
              <ellipse cx="44" cy="45" rx="2" ry="2.5" fill="#171717" />
              <ellipse cx="56" cy="45" rx="2" ry="2.5" fill="#171717" />
              <path d="M47 52 Q50 55 53 52" stroke="#171717" strokeWidth="1.2" strokeLinecap="round" />
              {/* Blazer / High-Collar Academic Coat */}
              <path d="M30 85 L42 66 L58 66 L70 85 Z" fill="#171717" stroke="#facc15" strokeWidth="1.5" />
            </svg>
          </div>
        )}

        {/* Ambient Corner Accents on Photo Frame */}
        <div className="frame-corner top-left" />
        <div className="frame-corner top-right" />
        <div className="frame-corner bottom-left" />
        <div className="frame-corner bottom-right" />
      </div>

      {/* 2. Circular Administrator Badge on the Right */}
      <div className="ninja-rank-badge" title={`Administrator: ${persona.userLabel}`}>
        <div className="rank-badge-outer">
          <div className="rank-badge-inner">
            <span className="rank-badge-label">ADMIN</span>
            <span className="rank-badge-letter">{persona.userNum || '01'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
