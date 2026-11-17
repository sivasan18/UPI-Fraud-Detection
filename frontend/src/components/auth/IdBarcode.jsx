// ==============================================================================
// ID Card Barcode & Status Strip
// ==============================================================================
import React from 'react';

export default function IdBarcode({ regNumber = '0920', handle = '@MeghaMittal0920' }) {
  // Generate deterministic barcode bar widths based on regNumber string
  const bars = [
    3, 1, 1, 2, 4, 1, 2, 1, 3, 1, 4, 2, 1, 3, 1, 2, 4, 1, 1, 3, 2, 1, 4, 1,
    2, 1, 3, 2, 1, 4, 1, 1, 2, 3, 1, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 3, 1, 2
  ];

  return (
    <div className="id-barcode-container">
      {/* High-tech SVG Barcode */}
      <svg
        className="id-barcode-svg"
        viewBox="0 0 280 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {bars.map((w, i) => {
          let x = 0;
          for (let j = 0; j < i; j++) {
            x += bars[j] + 2.4;
          }
          return (
            <rect
              key={i}
              x={x}
              y="2"
              width={w}
              height="20"
              fill="rgba(255, 255, 255, 0.75)"
              rx="0.5"
            />
          );
        })}
      </svg>

      {/* Status Line */}
      <div className="id-barcode-status-row">
        <div className="id-active-duty">
          <span className="duty-pulse-dot" />
          <span className="duty-text">ACTIVE DUTY</span>
        </div>
        <span className="id-handle-text">{handle}</span>
      </div>
    </div>
  );
}
