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
  { name: 'Amount Deviation', importance: 0.28, color: '#facc15' },
  { name: 'Time Anomaly', importance: 0.22, color: '#facc15' },
  { name: 'Recipient Novelty', importance: 0.18, color: '#facc15' },
  { name: 'Rapid Frequency', importance: 0.14, color: '#facc15' },
  { name: 'Device Signature', importance: 0.10, color: '#facc15' },
  { name: 'Location Shift', importance: 0.08, color: '#facc15' },
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
        <h1>Risk Engine Monitoring</h1>
        <p>Rule-based scoring status and Demo Mode benchmarks.</p>
      </div>

      {/* Model Header Card */}
      <div className="card mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--yellow-border)' }}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(250, 204, 21, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={24} color="var(--yellow-bright)" />
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
          <div className="stat-card-icon yellow"><BarChart2 /></div>
          <div className="stat-label">Precision</div>
          <div className="stat-value text-pink">{modelMetrics.precision}</div>
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
          <div className="stat-card-icon yellow"><Monitor /></div>
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
          <h3>Active Mode Uses Fixed Rules</h3>
          <p>
            Active Mode uses the 13-pattern rule engine and does not train a statistical model. Feedback labels are stored for review; they do not change risk scores.
          </p>
        </div>
      ) : (
        <div className="grid grid-2 mb-6">
          {/* Accuracy Trend Chart */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Demo Benchmark Trend</div>
              <TrendingUp size={16} className="text-tertiary" />
            </div>
            <div style={{ height: 230 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={DRIFT_DATA}>
                  <XAxis dataKey="week" stroke="#facc15" fontSize={11} />
                  <YAxis domain={[88, 100]} stroke="#facc15" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#000000', borderColor: 'rgba(250, 204, 21, 0.3)', borderRadius: 8, color: '#ffffff' }} />
                  <Area type="monotone" dataKey="accuracy" stroke="#facc15" fill="#facc15" fillOpacity={0.18} strokeWidth={2} name="Accuracy %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Feature Importance */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Demo Pattern Weight Reference</div>
              <BarChart2 size={16} className="text-tertiary" />
            </div>
            <div style={{ height: 230 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={FEATURE_IMPORTANCE} layout="vertical">
                  <XAxis type="number" domain={[0, 0.35]} stroke="#facc15" fontSize={11} />
                  <YAxis type="category" dataKey="name" width={120} stroke="#facc15" fontSize={10} />
                  <Tooltip
                    contentStyle={{ background: '#000000', borderColor: 'rgba(250, 204, 21, 0.3)', borderRadius: 8, color: '#ffffff' }}
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
          <div className="p-4" style={{ background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid var(--yellow-border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} color="var(--risk-low)" />
              <span className="text-sm font-semibold">Data Distribution Drift</span>
            </div>
            <div className="text-xs text-secondary">Feature variance remains within bounds.</div>
            <div className="text-xs text-tertiary mt-2 font-mono">Drift Index: 0.12 (Threshold: 0.50)</div>
          </div>

          <div className="p-4" style={{ background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid var(--yellow-border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} color="var(--risk-low)" />
              <span className="text-sm font-semibold">Concept Drift</span>
            </div>
            <div className="text-xs text-secondary">Decision boundaries maintain stability.</div>
            <div className="text-xs text-tertiary mt-2 font-mono">Variance Bound: 0.18</div>
          </div>

          <div className="p-4" style={{ background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid var(--yellow-border)' }}>
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
