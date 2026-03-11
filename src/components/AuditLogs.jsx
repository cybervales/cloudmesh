import React from 'react';

const AuditLogs = ({ logs }) => {
  return (
    <div className="panel audit-panel">
      <div className="panel-header">
        <h2 className="panel-title">SECURITY & CHAOS AUDIT</h2>
        <div className="status-indicator active">
          <span className="status-dot alert" />
          SYSTEM_WATCH
        </div>
      </div>
      
      <div className="audit-container">
        {logs && logs.length > 0 ? (
          logs.map((log, idx) => (
            <div key={idx} className="audit-entry">
              <div className="audit-entry-header">
                <span className="audit-time">{log.timestamp}</span>
                <span className="audit-badge">ADMIN_EXEC</span>
              </div>
              <p className="audit-action">
                <span className="audit-user">@sysadmin</span> :: {log.action}
              </p>
              {log.target && (
                <div className="audit-target">TARGET: {log.target}</div>
              )}
            </div>
          ))
        ) : (
          <div className="audit-empty">NO_AUDIT_LOGS_AVAILABLE</div>
        )}
      </div>
      
      <div className="audit-footer">
        <span>SECURITY_CONTEXT: ENFORCED</span>
        <span>LEVEL: 0 (KERNEL)</span>
      </div>

      <style>{`
        .audit-panel { height: 100%; display: flex; flex-direction: column; overflow: hidden; margin-top: 1rem; }
        .audit-container { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; padding-top: 0.5rem; }
        .audit-container::-webkit-scrollbar { display: none; }
        
        .audit-entry {
          border-left: 2px solid rgba(239, 68, 68, 0.3);
          padding: 0.5rem 0.75rem;
          background: rgba(239, 68, 68, 0.03);
          transition: background 0.2s;
        }
        .audit-entry:hover { background: rgba(239, 68, 68, 0.06); }
        
        .audit-entry-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
        .audit-time { font-family: 'JetBrains Mono', monospace; font-size: 0.5rem; color: #ef4444; opacity: 0.7; }
        .audit-badge { font-family: 'JetBrains Mono', monospace; font-size: 0.45rem; border: 1px solid rgba(255,255,255,0.1); padding: 1px 3px; color: var(--text-muted); }
        
        .audit-action { font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; color: var(--text); margin: 0; }
        .audit-user { color: var(--pink); font-weight: 800; }
        
        .audit-target {
          display: inline-block;
          margin-top: 0.4rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.5rem;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          padding: 1px 4px;
          border-radius: 2px;
          font-weight: 700;
        }

        .audit-empty {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.55rem;
          color: var(--text-muted);
          opacity: 0.3;
          font-style: italic;
        }

        .audit-footer {
          margin-top: 1rem;
          padding-top: 0.5rem;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.45rem;
          color: var(--text-muted);
          opacity: 0.6;
        }

        .status-dot.alert { background: #ef4444; box-shadow: 0 0 8px #ef4444; animation: blink 1s infinite; }
      `}</style>
    </div>
  );
};

export default AuditLogs;
