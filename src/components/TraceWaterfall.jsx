import React from 'react';

const TraceWaterfall = ({ spans, onClose }) => {
  if (!spans || spans.length === 0) return null;

  const totalDuration = Math.max(...spans.map(s => s.duration));

  const sortedSpans = [...spans].sort((a, b) => {
    const order = { 'gateway-svc': 1, 'auth-svc': 2, 'orders-svc': 3, 'inventory-svc': 4 };
    return (order[a.service] || 99) - (order[b.service] || 99);
  });

  return (
    <div className="trace-modal">
      <div className="trace-content">
        <div className="trace-header">
          <div className="trace-header-left">
            <h2 className="trace-title">TRACE ANALYSIS: {spans[0].traceId}</h2>
            <p className="trace-subtitle">End-to-end latency waterfall chart</p>
          </div>
          <button onClick={onClose} className="trace-close-btn">[CLOSE_X]</button>
        </div>

        <div className="trace-body">
          {sortedSpans.map((span, idx) => {
            let offset = 0;
            if (span.service === 'auth-svc') offset = 10;
            if (span.service === 'orders-svc') offset = 35;
            if (span.service === 'inventory-svc') offset = 65;

            const width = Math.max((span.duration / totalDuration) * 100, 5);
            
            return (
              <div key={idx} className="trace-row">
                <div className="trace-row-info">
                  <span className="trace-service-name">{span.service.toUpperCase()}</span>
                  <span className="trace-duration">{span.duration.toFixed(2)}ms</span>
                </div>
                <div className="trace-bar-bg">
                  <div 
                    className="trace-bar-fill"
                    style={{ left: `${offset}%`, width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="trace-footer">
          <span>SYSTEM_OS: CLOUDMESH_CORE_V4</span>
          <span>LATENCY_DISTRIBUTION: NORMALIZED</span>
        </div>
      </div>

      <style>{`
        .trace-modal {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .trace-content {
          background: var(--surface);
          border: 1px solid var(--pink-border);
          width: 100%;
          max-width: 800px;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 0 50px rgba(0,0,0,0.5);
        }
        .trace-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .trace-title {
          font-family: 'Syne', sans-serif;
          font-size: 0.9rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--pink);
        }
        .trace-subtitle {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.6rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }
        .trace-close-btn {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-dim);
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.65rem;
          padding: 0.4rem 0.8rem;
          cursor: pointer;
          border-radius: 2px;
        }
        .trace-close-btn:hover { border-color: var(--pink); color: var(--pink); }
        
        .trace-body { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
        .trace-row { display: flex; flex-direction: column; gap: 0.5rem; }
        .trace-row-info { display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; }
        .trace-service-name { color: var(--text-dim); }
        .trace-duration { color: var(--pink); font-weight: 700; }
        
        .trace-bar-bg {
          height: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          position: relative;
          border-radius: 2px;
          overflow: hidden;
        }
        .trace-bar-fill {
          position: absolute;
          height: 100%;
          background: linear-gradient(90deg, var(--pink), #8b5cf6);
          box-shadow: 0 0 15px rgba(236, 72, 153, 0.3);
          border-radius: 2px;
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .trace-footer {
          padding: 1rem 1.5rem;
          background: rgba(0,0,0,0.2);
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.5rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};

export default TraceWaterfall;
