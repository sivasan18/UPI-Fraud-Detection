// ==============================================================================
// Achariya College Administrator Security Crest / Emblem
// ==============================================================================
import React from 'react';

export default function AdminEmblem({ size = 22, color = '#facc15', className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer shield perimeter */}
      <path
        d="M12 2L4 5V11.5C4 16.5 7.4 21.1 12 22.3C16.6 21.1 20 16.5 20 11.5V5L12 2Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner academic graduation mortarboard / check */}
      <path
        d="M12 6L7 8.5L12 11L17 8.5L12 6Z"
        fill={color}
      />
      <path
        d="M9 13.5C9.5 15 10.6 16 12 16C13.4 16 14.5 15 15 13.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="13.5" r="1.5" fill={color} />
    </svg>
  );
}
