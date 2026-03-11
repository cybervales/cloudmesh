import { useEffect, useRef } from 'react'

export default function LiveLogs({ logs, onTraceClick }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="panel live-logs">
      <div className="panel-header">
        <h2 className="panel-title">SYSTEM EVENT LOGS</h2>
        <div className="status-indicator">
          <span className="status-dot" style={{ animation: 'blink 1s step-end infinite' }} />
          LIVE FEED
        </div>
      </div>
      
      <div className="logs-container" ref={scrollRef}>
        {logs.map(log => (
          <div 
            key={log.id} 
            className={`log-line ${log.traceId ? 'has-trace' : ''}`}
            onClick={() => log.traceId && onTraceClick && onTraceClick(log.traceId)}
          >
            <span className="log-time">[{log.time}]</span>
            <span className={`log-text ${log.type}`}>
              {log.text}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        .live-logs { height: 100%; display: flex; flex-direction: column; background: var(--bg); }
        .logs-container { 
          flex: 1; 
          overflow-y: auto; 
          font-size: 0.6rem; 
          padding: 0.5rem 0; 
          scrollbar-width: none;
        }
        .logs-container::-webkit-scrollbar { display: none; }
        .log-line { display: flex; gap: 1rem; margin-bottom: 0.25rem; opacity: 0.8; }
        .log-line.has-trace { cursor: pointer; transition: opacity 0.2s; }
        .log-line.has-trace:hover { opacity: 1; background: rgba(236, 72, 153, 0.05); }
        .log-time { color: var(--text-muted); white-space: nowrap; font-family: 'JetBrains Mono', monospace; }
        .log-text { color: var(--text-dim); font-family: 'JetBrains Mono', monospace; }
        
        .log-text.warn { color: #f59e0b; }
        .log-text.success { color: #22c55e; }
        .log-text.trace { color: var(--pink); font-weight: 700; }
        
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  )
}
