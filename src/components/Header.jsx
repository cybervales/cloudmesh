export default function Header({ metrics }) {
  return (
    <header className="header">
      <div className="header__left">
        <div className="header__logo">
          <span className="header__logo-dot" />
          <span className="header__logo-text">CLOUDMESH.IO</span>
        </div>
        <div className="header__badge">SYSTEM STATUS: OPTIMAL</div>
      </div>
      
      <div className="header__stats">
        <div className="header__stat">
          <span className="header__stat-label">NODES</span>
          <span className="header__stat-value">{metrics.nodes}</span>
        </div>
        <div className="header__stat">
          <span className="header__stat-label">HEALTH</span>
          <span className="header__stat-value" style={{ color: 'var(--green)' }}>{metrics.health}%</span>
        </div>
        <div className="header__stat">
          <span className="header__stat-label">UPTIME</span>
          <span className="header__stat-value">99.999%</span>
        </div>
      </div>

      <style>{`
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 4px;
        }
        .header__left { display: flex; align-items: center; gap: 2rem; }
        .header__logo { display: flex; align-items: center; gap: 0.75rem; }
        .header__logo-dot { width: 10px; height: 10px; background: var(--pink); border-radius: 2px; }
        .header__logo-text { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 800; }
        .header__badge { 
          font-size: 0.55rem; 
          background: rgba(34, 197, 94, 0.1); 
          color: var(--green); 
          border: 1px solid rgba(34, 197, 94, 0.3);
          padding: 2px 8px;
          border-radius: 20px;
        }
        .header__stats { display: flex; gap: 2.5rem; }
        .header__stat { display: flex; flex-direction: column; align-items: flex-end; }
        .header__stat-label { font-size: 0.5rem; color: var(--text-dim); letter-spacing: 0.1em; }
        .header__stat-value { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 800; color: var(--pink); }
      `}</style>
    </header>
  )
}
