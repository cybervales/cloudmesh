import React, { useState, useEffect } from 'react';

const Sparkline = ({ data, width = 80, height = 20, color = 'var(--cyan)' }) => {
  if (!data || data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        style={{ filter: 'drop-shadow(0 0 3px ' + color + ')' }}
      />
    </svg>
  );
};

export default function MetricsPanel({ metrics, anomalies = [] }) {
  const [latencyHistory, setLatencyHistory] = useState([]);
  const [healthHistory, setHealthHistory] = useState([]);

  useEffect(() => {
    setLatencyHistory(prev => [...prev.slice(-29), metrics.latency]);
    setHealthHistory(prev => [...prev.slice(-29), metrics.health]);
  }, [metrics]);

  return (
    <div className="panel metrics-panel">
      <div className="panel-header">
        <h2 className="panel-title">REAL-TIME TELEMETRY</h2>
      </div>

      <div className="metrics-container">
        <div className="metric-row">
          <div className="metric-header">
             <span className="metric-label">AVG LATENCY</span>
             <Sparkline data={latencyHistory} color={metrics.latency > 500 ? 'var(--pink)' : 'var(--cyan)'} />
          </div>
          <div className="metric-display">
            <span className="metric-value" style={{ color: metrics.latency > 500 ? 'var(--pink)' : 'var(--cyan)' }}>
              {metrics.latency}
            </span>
            <span className="metric-unit">ms</span>
          </div>
        </div>

        <div className="metric-row">
          <div className="metric-header">
            <span className="metric-label">SYSTEM HEALTH</span>
            <Sparkline data={healthHistory} color={metrics.health < 90 ? 'var(--pink)' : '#22c55e'} />
          </div>
          <div className="metric-display">
            <span className="metric-value" style={{ color: metrics.health < 90 ? 'var(--pink)' : '#22c55e' }}>
              {metrics.health}%
            </span>
          </div>
        </div>
      </div>

      <div className="anomaly-section">
        <div className="anomaly-header">
          <span className="anomaly-dot" />
          ANOMALY DETECTION
        </div>
        
        <div className="anomaly-list">
          {anomalies.length === 0 ? (
            <div className="anomaly-empty">NO ANOMALIES DETECTED</div>
          ) : (
            anomalies.map(anomaly => (
              <div key={anomaly.id} className={`anomaly-item severity-${anomaly.severity}`}>
                <span className="anomaly-title">{anomaly.title}</span>
                <span className="anomaly-status">ACTIVE</span>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .metrics-container { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2rem; }
        .metric-row { border-bottom: 1px solid var(--border); padding-bottom: 1rem; }
        .metric-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 0.5rem; }
        .metric-label { font-size: 0.5rem; color: var(--text-muted); font-weight: 700; letter-spacing: 0.1em; }
        .metric-display { display: flex; align-items: baseline; gap: 0.3rem; }
        .metric-value { font-family: 'Syne', sans-serif; font-size: 1.8rem; font-weight: 800; line-height: 1; }
        .metric-unit { font-size: 0.6rem; color: var(--text-muted); }

        .anomaly-section { padding-top: 1rem; }
        .anomaly-header { display: flex; align-items: center; gap: 0.5rem; font-family: 'JetBrains Mono', monospace; font-size: 0.55rem; font-weight: 800; color: var(--text-dim); margin-bottom: 0.75rem; }
        .anomaly-dot { width: 6px; height: 6px; background: #22c55e; border-radius: 50%; }
        
        .anomaly-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .anomaly-empty { font-family: 'JetBrains Mono', monospace; font-size: 0.5rem; color: var(--text-muted); border: 1px dashed var(--border); padding: 0.5rem; text-align: center; }

        .anomaly-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: rgba(236, 72, 153, 0.05); border-left: 2px solid var(--pink); font-family: 'JetBrains Mono', monospace; font-size: 0.55rem; animation: pulse-border 1.5s infinite alternate; }
        @keyframes pulse-border { from { background: rgba(236, 72, 153, 0.05); } to { background: rgba(236, 72, 153, 0.15); } }

        .anomaly-title { color: var(--pink); font-weight: 800; }
        .anomaly-status { font-size: 0.45rem; background: var(--pink); color: #fff; padding: 1px 4px; border-radius: 2px; }

        .severity-medium { border-left-color: #f59e0b; }
        .severity-medium .anomaly-title { color: #f59e0b; }
        .severity-medium .anomaly-status { background: #f59e0b; }
      `}</style>
    </div>
  )
}
