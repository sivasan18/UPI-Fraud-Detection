// ==============================================================================
// Smart UPI Fraud Detection System
// Reusable Pulse Ring Loading Component
// Theme: STRICT BLACK + YELLOW + WHITE
// ==============================================================================
import React from 'react';
import '../../styles/pulseRing.css';

/**
 * Modern, consistent Pulse Ring Loader.
 *
 * @param {Object} props
 * @param {'sm' | 'md' | 'lg' | number} [props.size='md'] - Diameter of the loader core & ring.
 * @param {'fullscreen' | 'section' | 'overlay' | 'inline'} [props.variant='section'] - Layout presentation.
 * @param {string} [props.message] - Main informative loading text.
 * @param {string} [props.subtitle] - Secondary descriptive subtext.
 * @param {string} [props.className] - Optional custom CSS class.
 * @param {React.CSSProperties} [props.style] - Optional inline style overrides.
 * @param {string} [props.ariaLabel='Loading'] - Accessibility label for screen readers.
 * @param {boolean} [props.showCoreDot=true] - Whether the glowing center yellow dot is visible.
 */
export default function PulseRingLoader({
  size = 'md',
  variant = 'section',
  message,
  subtitle,
  className = '',
  style = {},
  ariaLabel = 'Loading',
  showCoreDot = true,
}) {
  // Compute pixel dimensions
  let stageSize = 48;
  let coreSize = 14;
  let isMini = false;

  if (size === 'sm') {
    stageSize = 20;
    coreSize = 6;
    isMini = true;
  } else if (size === 'md') {
    stageSize = 48;
    coreSize = 14;
  } else if (size === 'lg') {
    stageSize = 80;
    coreSize = 22;
  } else if (typeof size === 'number') {
    stageSize = size;
    coreSize = Math.max(4, Math.round(size * 0.28));
    isMini = size <= 26;
  }

  // Wrapper class according to variant
  let variantClass = 'pulse-ring-section';
  if (variant === 'fullscreen') {
    variantClass = 'pulse-ring-fullscreen';
  } else if (variant === 'overlay') {
    variantClass = 'pulse-ring-overlay';
  } else if (variant === 'inline') {
    variantClass = 'pulse-ring-inline';
  }

  return (
    <div
      className={`pulse-ring-wrapper ${variantClass} ${isMini ? 'pulse-ring-mini' : ''} ${className}`.trim()}
      style={style}
      role="status"
      aria-live="polite"
      aria-label={message || ariaLabel}
    >
      <div
        className="pulse-ring-stage"
        style={{ width: stageSize, height: stageSize }}
        aria-hidden="true"
      >
        {/* Ring 3 (Outer Subtle Wave) */}
        <div className="pulse-ring-wave-3" />

        {/* Ring 2 (Secondary Subtle White/Yellow Wave) */}
        <div className="pulse-ring-wave-2" />

        {/* Ring 1 (Primary Yellow Expanding Ring) */}
        <div className="pulse-ring-wave-1" />

        {/* Central Core Glowing Yellow Dot */}
        {showCoreDot && (
          <div
            className="pulse-ring-core"
            style={{ width: coreSize, height: coreSize }}
          />
        )}
      </div>

      {/* Label and descriptive text if provided */}
      {(message || subtitle) && (
        <div className="pulse-ring-label-box">
          {message && <p className="pulse-ring-message">{message}</p>}
          {subtitle && <p className="pulse-ring-subtitle">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
