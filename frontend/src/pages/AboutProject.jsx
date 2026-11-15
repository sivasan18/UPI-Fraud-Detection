// ==============================================================================
// UPI Fraud Detection and Risk Assessment System
// About Project Page (Undergraduate B.Tech Final Year Academic Project)
// ==============================================================================
import React from 'react';
import {
  Search, FileText, Database, Cpu, Code, ArrowRight, Info
} from 'lucide-react';

const TECH_STACK = [
  { name: 'React + Vite', desc: 'Simple, responsive client interface', icon: Code, color: '#facc15' },
  { name: 'Supabase PostgreSQL & Auth', desc: 'Direct client-side cloud database & multi-admin auth', icon: Database, color: '#facc15' },
  { name: 'Tesseract.js WASM', desc: 'In-browser client-side screenshot text extraction', icon: FileText, color: '#facc15' },
  { name: '13-Pattern Rule Engine', desc: 'Explainable transaction risk scoring & adaptive profile', icon: Search, color: '#facc15' },
];

export default function AboutProject() {
  return (
    <div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div style={{
            width: 54, height: 54, borderRadius: 14,
            background: 'var(--yellow-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 25px rgba(250, 204, 21, 0.35)',
          }}>
            <img src="/favicon.svg" alt="Logo" style={{ width: 32, height: 32 }} />
          </div>
        </div>
        <h1>UPI Fraud Detection and Risk Assessment System</h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-accent)', maxWidth: 650, margin: '0 auto' }}>
          Explainable UPI transaction risk assessment with 13 behavioral rules
        </p>
        <div className="flex justify-center gap-2 mt-3">
          <span className="badge badge-pink">Undergraduate B.Tech Final-Year Project</span>
          <span className="badge badge-low">Local + Cloud Ready</span>
        </div>
      </div>

      {/* Project Objective */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title">Project Objective</div>
        </div>
        <div className="text-sm text-secondary leading-relaxed">
          <p className="mb-3">
            To flag potentially suspicious UPI transactions using transaction history, behavioural analysis, explainable risk scoring, and safety recommendations.
          </p>
          <p>
            The local version uses SQLite; the cloud version uses Supabase PostgreSQL through Flask. Screenshots are processed temporarily and are not stored.
          </p>
        </div>
      </div>

      {/* 5-Step Project Workflow */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title flex items-center gap-2">
            <ArrowRight size={18} color="var(--yellow-light)" />
            Core System Workflow
          </div>
        </div>
        <div className="grid grid-2">
          <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8 }}>
            <strong className="text-sm text-pink">1. Upload</strong>
            <p className="text-xs text-tertiary mt-1">Upload UPI screenshot (PNG/JPG) or enter transaction values manually.</p>
          </div>
          <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8 }}>
            <strong className="text-sm text-pink">2. Extract</strong>
            <p className="text-xs text-tertiary mt-1">OCR reads Amount, Date, Time, Recipient, UPI ID, and Reference ID.</p>
          </div>
          <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8 }}>
            <strong className="text-sm text-pink">3. Verify</strong>
            <p className="text-xs text-tertiary mt-1">Review and confirm fields before saving.</p>
          </div>
          <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8 }}>
            <strong className="text-sm text-pink">4. Analyse</strong>
            <p className="text-xs text-tertiary mt-1">Compares confirmed fields against history and 13 suspicious patterns.</p>
          </div>
          <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8, gridColumn: 'span 2' }}>
            <strong className="text-sm text-pink">5. Result (Risk Score + Why? + What Next?)</strong>
            <p className="text-xs text-tertiary mt-1">Outputs bounded score (0–100), transparent explanation of reasons, and immediate actionable recommendations.</p>
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title">Simple Undergraduate Technology Stack</div>
        </div>
        <div className="grid grid-3">
          {TECH_STACK.map((t, i) => {
            const Icon = t.icon;
            return (
              <div key={i} className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8, border: '1px solid var(--yellow-border)' }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon size={16} color={t.color} />
                  <span className="font-semibold text-xs text-secondary">{t.name}</span>
                </div>
                <p className="text-xs text-tertiary">{t.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Academic Disclaimer */}
      <div className="notice-box info mb-6">
        <Info size={16} color="var(--yellow-light)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div className="text-xs text-tertiary leading-relaxed">
          <strong>Academic Project Disclaimer:</strong> This project is an academic prototype for UPI transaction risk assessment. It does not access bank accounts, initiate payments, or guarantee that a transaction is safe or fraudulent.
        </div>
      </div>
    </div>
  );
}
