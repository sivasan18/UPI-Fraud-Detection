// ==============================================================================
// 3D Realistic Lanyard Strap & Chrome Clasp / Clip Assembly
// ==============================================================================
import React from 'react';

export default function LanyardClip() {
  return (
    <div className="lanyard-assembly" aria-hidden="true">
      {/* 1. Hanging Woven Strap from top of screen */}
      <div className="lanyard-strap">
        <div className="strap-stitch strap-stitch-left" />
        <div className="strap-text-container">
          <span className="strap-text">ACHARIYA COLLEGE</span>
        </div>
        <div className="strap-stitch strap-stitch-right" />
      </div>

      {/* 2. Lower Metal Crimp / Rivet Plate */}
      <div className="lanyard-crimp">
        <div className="crimp-rivet" />
      </div>

      {/* 3. Silver Chrome Swivel Buckle & Crocodile Clip */}
      <div className="lanyard-hardware">
        {/* Metal Clasp / Buckle */}
        <div className="metal-clasp">
          <div className="clasp-ridge" />
          <div className="clasp-ridge" />
          <div className="clasp-ridge" />
          <div className="clasp-shine" />
        </div>

        {/* Polished D-Ring / Swivel Loop passing into card badge slot */}
        <div className="metal-ring">
          <div className="ring-inner" />
        </div>
      </div>
    </div>
  );
}
