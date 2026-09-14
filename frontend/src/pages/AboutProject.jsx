// ==============================================================================
// UPI Fraud Detection and Risk Assessment System
// About Project Page (Undergraduate B.Tech Final Year Academic Project)
// ==============================================================================
import React from 'react';
import {
  Shield, Brain, Search, Upload, AlertTriangle, BarChart2,
  FileText, Monitor, Users, Database, Cpu, Code,
  CheckCircle, ArrowRight, Sparkles, Lock, Info, HelpCircle
} from 'lucide-react';

const TECH_STACK = [
  { name: 'React + JSX', desc: 'Simple, responsive client interface', icon: Code, color: '#ec4899' },
  { name: 'Python Flask', desc: 'Lightweight REST API backend', icon: Cpu, color: '#db2777' },
  { name: 'SQLite Database', desc: 'Local zero-cloud database storage', icon: Database, color: '#06b6d4' },
  { name: 'scikit-learn & pandas', desc: 'Simple ML baseline & data modeling', icon: Brain, color: '#f59e0b' },
  { name: 'Tesseract OCR', desc: 'Screenshot text extraction pipeline', icon: FileText, color: '#f472b6' },
  { name: 'Rule Engine', desc: 'Understandable heuristic risk checks', icon: Search, color: '#10b981' },
];

export default function AboutProject() {
  return (
    <div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div style={{
            width: 54, height: 54, borderRadius: 14,
            background: 'var(--pink-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 25px rgba(236, 72, 153, 0.35)',
          }}>
            <img src="/favicon.svg" alt="Logo" style={{ width: 32, height: 32 }} />
          </div>
        </div>
        <h1>UPI Fraud Detection and Risk Assessment System</h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-pink)', maxWidth: 650, margin: '0 auto' }}>
          AI-Based Explainable UPI Fraud Detection and Risk Assessment System
        </p>
        <div className="flex justify-center gap-2 mt-3">
          <span className="badge badge-pink">Undergraduate B.Tech Final-Year Project</span>
          <span className="badge badge-low">100% Localhost Architecture</span>
        </div>
      </div>

      {/* Project Objective */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title">Project Objective</div>
        </div>
        <div className="text-sm text-secondary leading-relaxed">
          <p className="mb-3">
            To detect potentially suspicious UPI transactions using transaction history, simple user behavioural analysis, Machine Learning, explainable risk assessment, and actionable safety recommendations.
          </p>
          <p>
            Unlike complex commercial banking systems, this student-level prototype operates entirely locally on <strong>localhost</strong> using an embedded <strong>SQLite database</strong>, simple statistical baseline metrics, and transparent rule-based risk evaluation.
          </p>
        </div>
      </div>

      {/* 5-Step Project Workflow */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title flex items-center gap-2">
            <ArrowRight size={18} color="var(--pink-light)" />
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
            <p className="text-xs text-tertiary mt-1">User verifies and edits extracted fields before saving to local SQLite.</p>
          </div>
          <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8 }}>
            <strong className="text-sm text-pink">4. Analyse</strong>
            <p className="text-xs text-tertiary mt-1">Evaluates transaction against historical profile across 6 key fraud indicators.</p>
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
              <div key={i} className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8, border: '1px solid var(--pink-border)' }}>
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
        <Info size={16} color="var(--pink-light)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div className="text-xs text-tertiary leading-relaxed">
          <strong>Academic Project Disclaimer:</strong> This project is an academic prototype for UPI transaction risk assessment. It does not access bank accounts, initiate payments, or guarantee that a transaction is safe or fraudulent.
        </div>
      </div>
    </div>
  );
}
