import { useState } from 'react'

export default function ChaosPanel({ disabled, token, onAudit }) {
  const [activeChaos, setActiveChaos] = useState({
    latency: false,
    error: false
  })

  const SERVICES = [
    { name: 'GATEWAY', port: 8081 },
    { name: 'AUTH', port: 8082 },
    { name: 'ORDERS', port: 8083 },
    { name: 'INVENTORY', port: 8084 }
  ]

  const toggleChaos = async (type) => {
    if (disabled || !token) return;
    const newState = !activeChaos[type]
    
    const promises = SERVICES.map(svc => 
      fetch(`http://localhost:${svc.port}/admin/chaos`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, active: newState })
      }).catch(err => console.error(`Auth Error on ${svc.name}:`, err))
    )

    await Promise.all(promises)
    setActiveChaos(prev => ({ ...prev, [type]: newState }))
    
    if (onAudit) {
      onAudit({ action: `INJECT_${type.toUpperCase()}`, target: 'CLUSTER_WIDE', admin: 'sysadmin' })
    }
  }

  const resetAll = async () => {
    if (disabled || !token) return;
    const promises = SERVICES.map(svc => 
      fetch(`http://localhost:${svc.port}/admin/chaos`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: 'reset' })
      }).catch(err => console.error(`Auth Error on ${svc.name}:`, err))
    )

    await Promise.all(promises)
    setActiveChaos({ latency: false, error: false })
    if (onAudit) onAudit({ action: 'SYSTEM_RESET', target: 'CLUSTER_WIDE', admin: 'sysadmin' })
  }

  return (
    <div className={`panel chaos-panel ${disabled ? 'disabled' : ''}`}>
      <div className="panel-header">
        <h2 className="panel-title">CHAOS ENGINE</h2>
        <div className={`status-indicator ${activeChaos.latency || activeChaos.error ? 'active' : ''} ${disabled ? 'locked' : ''}`}>
          <span className="status-dot" />
          {disabled ? 'ENCRYPTION LOCKED' : (activeChaos.latency || activeChaos.error ? 'FAULT INJECTION ACTIVE' : 'SYSTEM NOMINAL')}
        </div>
      </div>

      <div className="chaos-grid">
        <button className={`chaos-btn ${activeChaos.latency ? 'active' : ''}`} onClick={() => toggleChaos('latency')} disabled={disabled}>
          <div className="btn-glitch" />
          INJECT LATENCY
          <span className="btn-subtext">{disabled ? 'UNAUTHORIZED' : '+1.5s Propagation Delay'}</span>
        </button>

        <button className={`chaos-btn ${activeChaos.error ? 'active' : ''}`} onClick={() => toggleChaos('error')} disabled={disabled}>
          <div className="btn-glitch" />
          TRIGGER 5XX FLOOD
          <span className="btn-subtext">{disabled ? 'UNAUTHORIZED' : '50% Success Rate Degradation'}</span>
        </button>

        <button className="chaos-btn chaos-btn--reset" onClick={resetAll} disabled={disabled}>
          {disabled ? 'LOCKED' : 'SYSTEM RESET'}
        </button>
      </div>

      <style>{`
        .chaos-panel.disabled { opacity: 0.6; filter: grayscale(0.5); }
        .status-indicator.locked { color: var(--text-muted); }
        .status-indicator.locked .status-dot { background: var(--text-muted); box-shadow: none; animation: none; }
        .chaos-panel { margin-top: 1rem; }
        .chaos-grid { display: flex; flex-direction: column; gap: 0.75rem; padding-top: 0.5rem; }
        .chaos-btn {
          position: relative;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text-dim);
          padding: 0.75rem;
          text-align: left;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .chaos-btn:disabled { cursor: not-allowed; opacity: 0.5; }
        .chaos-btn:hover:not(:disabled) { border-color: var(--border-lit); color: var(--text); }
        .chaos-btn.active {
          background: rgba(236, 72, 153, 0.08);
          border-color: var(--pink);
          color: var(--pink);
          box-shadow: inset 0 0 20px rgba(236, 72, 153, 0.05);
        }
        .btn-subtext { font-size: 0.5rem; opacity: 0.6; font-weight: 400; }
        .chaos-btn--reset {
          margin-top: 0.5rem;
          align-items: center;
          background: transparent;
          border-style: dashed;
          font-size: 0.6rem;
        }
        .chaos-btn--reset:hover:not(:disabled) { background: rgba(255,255,255,0.05); color: var(--text); border-style: solid; }
        .status-indicator.active .status-dot { background: var(--pink); box-shadow: 0 0 10px var(--pink); animation: blink 1s step-end infinite; }
        .status-indicator.active { color: var(--pink); }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  )
}
