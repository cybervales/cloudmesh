import { useState } from 'react'

export default function ServiceMap({ serviceMetrics, activeTraces, circuits = {} }) {
  const [hoverNode, setHoverNode] = useState(null)

  const nodes = [
    { id: 'gateway-svc', label: 'GATEWAY', x: 100, y: 150 },
    { id: 'auth-svc', label: 'AUTH', x: 250, y: 150 },
    { id: 'orders-svc', label: 'ORDERS', x: 400, y: 150 },
    { id: 'inventory-svc', label: 'INVENTORY', x: 550, y: 150 }
  ]

  const getStatus = (id) => serviceMetrics[id]?.status || 'offline'
  const isTracing = (id) => !!activeTraces[id]
  
  // Logic to determine if a connection is "Broken" by a circuit breaker
  // We check the destination service's circuit status
  const isCircuitOpen = (serviceId) => circuits[serviceId] === 'Open'

  return (
    <div className="panel service-map">
      <div className="panel-header">
        <h2 className="panel-title">LIVE SERVICE MESH</h2>
        <div className="status-indicator">
          <span className="status-dot" />
          {Object.keys(serviceMetrics).length} NODES ACTIVE
        </div>
      </div>
      
      <div className="map-container" style={{ position: 'relative' }}>
        <svg viewBox="0 0 650 300">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Connections - Rendered with Circuit Breaker Logic */}
          <Connection 
            x1={100} y1={150} x2={250} y2={150} 
            isOpen={isCircuitOpen('auth-svc')} 
          />
          <Connection 
            x1={250} y1={150} x2={400} y2={150} 
            isOpen={isCircuitOpen('orders-svc')} 
          />
          <Connection 
            x1={400} y1={150} x2={550} y2={150} 
            isOpen={isCircuitOpen('inventory-svc')} 
          />

          {/* Nodes */}
          {nodes.map(node => (
            <g 
              key={node.id} 
              transform={`translate(${node.x}, ${node.y})`}
              onMouseEnter={() => setHoverNode(node.id)}
              onMouseLeave={() => setHoverNode(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect 
                x="-40" y="-18" width="80" height="36" rx="4"
                className={`node ${getStatus(node.id)} ${isTracing(node.id) ? 'tracing' : ''}`}
              />
              <text y="4" textAnchor="middle" className="node-text">{node.label}</text>
              <circle r="2.5" cx="34" cy="-12" className={`status-led ${getStatus(node.id)}`} />
              
              {/* Circuit Status Badge */}
              {isCircuitOpen(node.id) && (
                <g transform="translate(0, 28)">
                  <rect x="-25" y="-6" width="50" height="12" rx="2" fill="#ef4444" />
                  <text textAnchor="middle" y="3" fontSize="6" fill="#fff" fontWeight="800">CIRCUIT OPEN</text>
                </g>
              )}
            </g>
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoverNode && serviceMetrics[hoverNode] && (
          <div className="node-tooltip">
            <div className="tooltip-title">{hoverNode.toUpperCase()}</div>
            <div className="tooltip-row"><span>STATUS:</span> <span style={{ color: isCircuitOpen(hoverNode) ? '#ef4444' : '#22c55e' }}>{isCircuitOpen(hoverNode) ? 'PROTECTED' : 'STABLE'}</span></div>
            <div className="tooltip-row"><span>CPU:</span> <span>{serviceMetrics[hoverNode].cpuUsage.toFixed(1)}%</span></div>
            <div className="tooltip-row"><span>MEM:</span> <span>{serviceMetrics[hoverNode].memoryUsage.toFixed(1)}%</span></div>
            <div className="tooltip-row"><span>CONNS:</span> <span>{serviceMetrics[hoverNode].connections}</span></div>
          </div>
        )}
      </div>

      <style>{`
        .service-map { flex: 1; height: 100%; }
        .map-container { height: 100%; display: flex; align-items: center; justify-content: center; }
        
        .link { stroke: var(--border); stroke-width: 1; stroke-dasharray: 4; opacity: 0.4; transition: all 0.5s ease; }
        .link.broken { stroke: #ef4444; stroke-width: 2; stroke-dasharray: 2; opacity: 0.8; animation: pulse-red 1s infinite; }
        
        @keyframes pulse-red { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }

        .node { fill: var(--card); stroke: var(--border); stroke-width: 1.5; transition: all 0.3s ease; }
        .node.online { stroke: var(--border-lit); }
        .node.degraded { stroke: var(--pink); fill: rgba(236, 72, 153, 0.05); }
        .node.offline { opacity: 0.2; stroke-dasharray: 2; }
        
        .node.tracing { stroke: var(--pink); stroke-width: 2.5; filter: url(#glow); animation: pulse 0.5s ease-in-out infinite alternate; }
        @keyframes pulse { from { opacity: 0.8; } to { opacity: 1; } }

        .node-text { fill: var(--text-dim); font-family: 'JetBrains Mono', monospace; font-size: 7px; font-weight: 700; pointer-events: none; letter-spacing: 0.05em; }
        .status-led { fill: #444; transition: fill 0.3s ease; }
        .status-led.online { fill: #22c55e; filter: drop-shadow(0 0 4px #22c55e); }
        .status-led.degraded { fill: var(--pink); filter: drop-shadow(0 0 4px var(--pink)); }

        .node-tooltip { position: absolute; top: 10px; right: 10px; background: rgba(13, 13, 16, 0.95); border: 1px solid var(--pink-border); padding: 0.75rem; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; min-width: 120px; z-index: 100; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
        .tooltip-title { color: var(--pink); font-weight: 800; margin-bottom: 0.5rem; border-bottom: 1px solid var(--border); padding-bottom: 2px; }
        .tooltip-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
        .tooltip-row span:first-child { color: var(--text-muted); }
        .tooltip-row span:last-child { color: var(--text-dim); }
      `}</style>
    </div>
  )
}

function Connection({ x1, y1, x2, y2, isOpen }) {
  if (isOpen) {
    // Render a "Broken" visual: two dashed lines with a gap
    const midX = (x1 + x2) / 2
    const midY = (y1 + y2) / 2
    return (
      <g className="connection-broken">
        <line x1={x1} y1={y1} x2={midX - 10} y2={midY} className="link broken" />
        <line x1={midX + 10} y1={midY} x2={x2} y2={y2} className="link broken" />
        <circle cx={midX} cy={midY} r="3" fill="#ef4444" className="pulse-dot" />
      </g>
    )
  }
  return <line x1={x1} y1={y1} x2={x2} y2={y2} className="link" />
}
