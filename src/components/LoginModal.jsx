import React, { useState } from 'react';
import * as jose from 'jose';

const LoginModal = ({ onLogin }) => {
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (pass === 'admin') {
      try {
        // Sign a real JWT using the shared secret
        const secret = new TextEncoder().encode('cybermesh-enterprise-secret-2026');
        const alg = 'HS256';

        const jwt = await new jose.SignJWT({ 'urn:cloudmesh:admin': true })
          .setProtectedHeader({ alg })
          .setIssuedAt()
          .setIssuer('urn:cloudmesh:dashboard')
          .setAudience('urn:cloudmesh:cluster')
          .setExpirationTime('2h')
          .sign(secret);

        onLogin(jwt);
      } catch (err) {
        console.error("JWT Signing Error:", err);
        setError(true);
      }
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="login-modal">
      <div className="login-content">
        <div className="login-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <h2 className="login-title">ACCESS CONTROL</h2>
        <p className="login-subtitle">Admin privileges required for Chaos Engine</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>SYSTEM KEYCARD (PASSWORD)</label>
            <input 
              type="password"
              autoFocus
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className={error ? 'error' : ''}
              placeholder="••••••"
              disabled={loading}
            />
            {error && <p className="error-text">INVALID CREDENTIALS: ACCESS DENIED</p>}
          </div>
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'GENERATING TOKEN...' : 'AUTHENTICATE SEQUENCE'}
          </button>
        </form>
      </div>

      <style>{`
        .login-modal {
          position: fixed;
          inset: 0;
          background: rgba(13, 13, 16, 0.98);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
        }

        .login-content {
          background: var(--surface);
          border: 1px solid var(--pink-border);
          width: 100%;
          max-width: 400px;
          padding: 3rem;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 0 60px rgba(236, 72, 153, 0.1);
        }

        .login-icon {
          width: 64px;
          height: 64px;
          background: rgba(236, 72, 153, 0.05);
          border: 1px solid var(--pink-border);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--pink);
          margin-bottom: 1.5rem;
        }

        .login-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: 0.2em;
          color: var(--text);
          margin-bottom: 0.5rem;
        }

        .login-subtitle {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.65rem;
          color: var(--text-muted);
          margin-bottom: 2.5rem;
          text-transform: uppercase;
        }

        .login-form { width: 100%; }

        .input-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; }
        .input-group label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.55rem;
          color: var(--pink);
          opacity: 0.8;
          letter-spacing: 0.1em;
        }

        .input-group input {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          padding: 0.8rem;
          border-radius: 4px;
          color: var(--text);
          font-family: 'JetBrains Mono', monospace;
          text-align: center;
          letter-spacing: 0.5em;
          transition: border-color 0.2s;
        }

        .input-group input:focus { outline: none; border-color: var(--pink); }
        .input-group input.error { border-color: #ef4444; box-shadow: 0 0 10px rgba(239, 68, 68, 0.1); }

        .error-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.55rem;
          color: #ef4444;
          text-align: center;
          margin-top: 0.5rem;
          animation: blink 1s infinite;
        }

        .login-btn {
          width: 100%;
          background: rgba(236, 72, 153, 0.1);
          border: 1px solid var(--pink-border);
          color: var(--pink);
          padding: 1rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .login-btn:hover { background: rgba(236, 72, 153, 0.2); box-shadow: 0 0 20px rgba(236, 72, 153, 0.2); }
        .login-btn:disabled { opacity: 0.5; cursor: wait; }

        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
};

export default LoginModal;
