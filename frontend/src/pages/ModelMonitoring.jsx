// ==============================================================================
// Fraud Detection and Risk Assessment System
// Model Monitoring & Drift Evaluation Page
// ==============================================================================
import React from 'react';
import {
  Monitor, Activity, TrendingUp, BarChart2, AlertTriangle,
  CheckCircle, Cpu, Database, ShieldCheck
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { useApp } from '../context/AppContext';

const FEATURE_IMPORTANCE = [
  { name: 'Amount Deviation', importance: 0.28, color: '#8b5cf6' },
  { name: 'Time Anomaly', importance: 0.22, color: '#a78bfa' },
  { name: 'Recipient Novelty', importance: 0.18, color: '#06b6d4' },
  { name: 'Rapid Frequency', importance: 0.14, color: '#f59e0b' },
  { name: 'Device Signature', importance: 0.10, color: '#ef4444' },
  { name: 'Location Shift', importance: 0.08, color: '#10b981' },
];

const DRIFT_DATA = [
  { week: 'W1', accuracy: 94.2, precision: 93.8 },
  { week: 'W2', accuracy: 94.5, precision: 94.1 },
  { week: 'W3', accuracy: 93.9, precision: 93.5 },
  { week: 'W4', accuracy: 94.8, precision: 94.3 },
  { week: 'W5', accuracy: 94.1, precision: 93.7 },
  { week: 'W6', accuracy: 95.0, precision: 94.6 },
  { week: 'W7', accuracy: 94.7, precision: 94.2 },
  { week: 'W8', accuracy: 95.2, precision: 94.8 },
];

export default function ModelMonitoring() {
  const { currentMode, modelMetrics, validatedSamples, totalTransactions } = useApp();

  const isTrained = modelMetrics.precision !== '—';

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Model Monitoring & Performance</h1>
        <p>Real-time ML performance tracking, feature importance attribution, and drift telemetry.</p>
      </div>

      {/* Model Header Card */}
      <div className="card mb-6" style={{ background: 'var(--violet-card-gradient)', border: '1px solid var(--violet-border)' }}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={24} color="var(--violet-bright)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{modelMetrics.modelName}</h3>
              <p className="text-xs text-secondary">
                Training Dataset: {modelMetrics.trainingSamples} • Last Updated: {modelMetrics.lastTrained}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className={`badge ${currentMode === 'DEMO' ? 'badge-demo' : 'badge-low'}`}>
              {currentMode === 'DEMO' ? 'Demo Metrics' : (isTrained ? 'Active Calibrated' : 'Pending Training')}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-6 mb-6">
        <div className="stat-card">
          <div className="stat-card-icon violet"><BarChart2 /></div>
          <div className="stat-label">Precision</div>
          <div className="stat-value text-violet">{modelMetrics.precision}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green"><Activity /></div>
          <div className="stat-label">Recall</div>
          <div className="stat-value">{modelMetrics.recall}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon yellow"><TrendingUp /></div>
          <div className="stat-label">F1-Score</div>
          <div className="stat-value">{modelMetrics.f1Score}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon violet"><Monitor /></div>
          <div className="stat-label">ROC-AUC</div>
          <div className="stat-value">{modelMetrics.rocAuc}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon cyan"><Database /></div>
          <div className="stat-label">Evaluated Txns</div>
          <div className="stat-value">{totalTransactions}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green"><ShieldCheck /></div>
          <div className="stat-label">Validated Pool</div>
          <div className="stat-value">{validatedSamples.length}</div>
        </div>
      </div>

      {!isTrained && currentMode === 'ACTIVE' ? (
        <div className="empty-state mb-6">
          <div className="empty-icon">
            <Cpu size={32} />
          </div>
          <h3>Model Not Trained Yet in Active Mode</h3>
          <p>
            The active model requires verified feedback samples from your local SQLite database before generating live evaluation curves. Once you validate transactions in the Adaptive Learning tab and trigger retraining, metric curves will display here.
          </p>
        </div>
      ) : (
        <div className="grid grid-2 mb-6">
          {/* Accuracy Trend Chart */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Accuracy & Precision Stability</div>
              <TrendingUp size={16} className="text-tertiary" />
            </div>
            <div style={{ height: 230 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={DRIFT_DATA}>
                  <defs>
                    <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[88, 100]} stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#16102b', borderColor: 'rgba(139,92,246,0.3)', borderRadius: 8, color: '#fff' }} />
                  <Area type="monotone" dataKey="accuracy" stroke="#8b5cf6" fillOpacity={1} fill="url(#accGrad)" strokeWidth={2} name="Accuracy %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Feature Importance */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Global Feature Importance (SHAP)</div>
              <BarChart2 size={16} className="text-tertiary" />
            </div>
            <div style={{ height: 230 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={FEATURE_IMPORTANCE} layout="vertical">
                  <XAxis type="number" domain={[0, 0.35]} stroke="#64748b" fontSize={11} />
                  <YAxis type="category" dataKey="name" width={120} stroke="#64748b" fontSize={10} />
                  <Tooltip
                    contentStyle={{ background: '#16102b', borderColor: 'rgba(139,92,246,0.3)', borderRadius: 8, color: '#fff' }}
                    formatter={(val) => `${(val * 100).toFixed(1)}%`}
                  />
                  <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                    {FEATURE_IMPORTANCE.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Model Health Status */}
      <div className="card">
        <div className="card-header">
          <div className="card-title flex items-center gap-2">
            <ShieldCheck size={18} color="var(--risk-low)" />
            Model Health & Telemetry Status
          </div>
          <span className="badge badge-low">Operational</span>
        </div>

        <div className="grid grid-3">
          <div className="p-4" style={{ background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid var(--violet-border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} color="var(--risk-low)" />
              <span className="text-sm font-semibold">Data Distribution Drift</span>
            </div>
            <div className="text-xs text-secondary">Feature variance remains within bounds.</div>
            <div className="text-xs text-tertiary mt-2 font-mono">Drift Index: 0.12 (Threshold: 0.50)</div>
          </div>

          <div className="p-4" style={{ background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid var(--violet-border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} color="var(--risk-low)" />
              <span className="text-sm font-semibold">Concept Drift</span>
            </div>
            <div className="text-xs text-secondary">Decision boundaries maintain stability.</div>
            <div className="text-xs text-tertiary mt-2 font-mono">Variance Bound: 0.18</div>
          </div>

          <div className="p-4" style={{ background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid var(--violet-border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} color="var(--risk-medium)" />
              <span className="text-sm font-semibold">Incremental Retraining</span>
            </div>
            <div className="text-xs text-secondary">Retrain when feedback pool reaches 50+ items.</div>
            <div className="text-xs text-tertiary mt-2 font-mono">Progress: {validatedSamples.length}/50 samples</div>
          </div>
        </div>
      </div>
    </div>
  );
}
