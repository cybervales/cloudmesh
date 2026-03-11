import React, { useState, useEffect, useCallback, useRef } from 'react'
import Header from './components/Header'
import ServiceMap from './components/ServiceMap'
import MetricsPanel from './components/MetricsPanel'
import ChaosPanel from './components/ChaosPanel'
import LiveLogs from './components/LiveLogs'
import TraceWaterfall from './components/TraceWaterfall'
import AuditLogs from './components/AuditLogs'
import LoginModal from './components/LoginModal'
import './App.css'

export default function App() {
  const [metrics, setMetrics] = useState({ latency: 0, throughput: 0, errors: 0, nodes: 0, health: 100 })
  const [serviceMetrics, setServiceMetrics] = useState({})
  const [logs, setLogs] = useState([{ id: 'init', time: new Date().toLocaleTimeString(), text: '[SYSTEM] Initializing Dashboard...' }])
  const [activeTraces, setActiveTraces] = useState({})
  const [anomalies, setAnomalies] = useState([])
  const [circuits, setCircuits] = useState({})
  const [auditLogs, setAuditLogs] = useState([])
  const [authToken, setAuthToken] = useState(null)
  const [selectedTrace, setSelectedTrace] = useState(null)
  
  const traceHistoryRef = useRef({})

  const addLog = useCallback((text, type = 'info', traceId = null) => {
    setLogs(prev => [...prev.slice(-49), { id: Math.random(), time: new Date().toLocaleTimeString(), text, type, traceId }])
  }, [])

  useEffect(() => {
    let socket = null;
    let isCleanup = false;

    const connect = () => {
      if (isCleanup) return;
      socket = new WebSocket('ws://localhost:8080/ws')
      socket.onopen = () => addLog('[SYSTEM] WebSocket Connection Established', 'success')
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'metrics') {
          const m = data.payload
          setServiceMetrics(prev => {
            const next = { ...prev, [m.serviceId]: m }
            const services = Object.values(next)
            const avgLat = services.reduce((a, s) => a + (s.latency || 0), 0) / services.length
            const totalConn = services.reduce((a, s) => a + (s.connections || 0), 0)
            const healthPct = (services.filter(s => s.status === 'online').length / services.length) * 100
            setMetrics({ latency: Math.round(avgLat) || 0, throughput: totalConn, errors: 0, nodes: services.length, health: Math.round(healthPct) || 100 })
            
            const alerts = []
            if (avgLat > 1000) alerts.push({ id: 'lat', title: 'CRITICAL LATENCY SPIKE', severity: 'medium' })
            if (services.some(s => s.cpuUsage > 85)) alerts.push({ id: 'cpu', title: 'RESOURCE EXHAUSTION', severity: 'high' })
            setAnomalies(alerts)
            
            return next
          })
        }
        if (data.type === 'trace') {
          const t = data.payload
          const serviceId = t.service
          const traceOrder = { 'gateway-svc': 0, 'auth-svc': 300, 'orders-svc': 600, 'inventory-svc': 900 }
          setTimeout(() => {
            setActiveTraces(prev => ({ ...prev, [serviceId]: true }))
            setTimeout(() => { setActiveTraces(prev => { const n = { ...prev }; delete n[serviceId]; return n }) }, 800)
          }, traceOrder[serviceId] || 0)
          if (!traceHistoryRef.current[t.traceId]) traceHistoryRef.current[t.traceId] = []
          traceHistoryRef.current[t.traceId].push(t)
          addLog(`[TRACE] ${t.service} processed ${t.traceId} (${t.duration}ms)`, 'trace', t.traceId)
        }
        if (data.type === 'circuit') {
          const c = data.payload
          setCircuits(prev => ({ ...prev, [c.serviceId]: c.status }))
          addLog(`[CIRCUIT] ${c.serviceId} is now ${c.status}`, c.status === 'Open' ? 'error' : 'success')
        }
        if (data.type === 'audit') {
          const a = data.payload
          setAuditLogs(prev => [{ ...a, timestamp: new Date().toLocaleTimeString() }, ...prev.slice(0, 19)])
          addLog(`[AUDIT] Chaos action: ${a.action} on ${a.target}`, 'warning')
        }
      }
      socket.onclose = () => { if (!isCleanup) setTimeout(connect, 3000) }
    }
    connect()
    return () => { isCleanup = true; if (socket) socket.close() }
  }, [addLog])

  return (
    <div className="dashboard">
      <div className="crt-overlay" />
      {!authToken && <LoginModal onLogin={(token) => setAuthToken(token)} />}
      {selectedTrace && <TraceWaterfall spans={selectedTrace.spans} onClose={() => setSelectedTrace(null)} />}
      <Header metrics={metrics} />
      <main className="dashboard__grid">
        <div className="dashboard__left">
          <ServiceMap serviceMetrics={serviceMetrics} activeTraces={activeTraces} circuits={circuits} />
        </div>
        <div className="dashboard__right">
          <MetricsPanel metrics={metrics} anomalies={anomalies} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1, minHeight: 0 }}>
            <ChaosPanel disabled={!authToken} token={authToken} onAudit={(a) => setAuditLogs(prev => [{ ...a, timestamp: new Date().toLocaleTimeString() }, ...prev.slice(0, 19)])} />
            <AuditLogs logs={auditLogs} />
          </div>
        </div>
      </main>
      <footer className="dashboard__footer">
        <LiveLogs logs={logs} onTraceClick={(id) => traceHistoryRef.current[id] && setSelectedTrace({ id, spans: traceHistoryRef.current[id] })} />
      </footer>
    </div>
  )
}
