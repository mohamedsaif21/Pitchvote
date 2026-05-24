// pages/index.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [roll, setRoll] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('voter'); // 'voter' | 'host'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = mode === 'host' ? { password } : { roll: roll || name };
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); return; }
      router.push(data.role === 'host' ? '/host' : '/vote');
    } catch (e) {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>PitchVote — Product Pitch Scoring</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(51,85,209,0.25) 0%, transparent 70%), #080d1f',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }} className="fade-up">
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              width: 56, height: 56,
              background: 'linear-gradient(135deg, #3355d1, #6b93f5)',
              borderRadius: 16,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, marginBottom: 16,
            }}>🎯</div>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>
              PitchVote
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 6 }}>
              Product Pitch Scoring System
            </p>
          </div>

          {/* Mode tabs */}
          <div style={{
            display: 'flex', gap: 4,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12, padding: 4, marginBottom: 20,
          }}>
            {['voter', 'host'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 14, fontWeight: 500,
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: mode === m ? 'rgba(107,147,245,0.25)' : 'transparent',
                  color: mode === m ? '#6b93f5' : 'rgba(255,255,255,0.45)',
                }}>
                {m === 'voter' ? '👤 Voter Login' : '🔐 Host Login'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="glass" style={{ borderRadius: 18, padding: 24 }}>
            {mode === 'voter' ? (
              <>
                <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 8 }}>
                  Roll number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 712523205000"
                  value={roll}
                  onChange={e => setRoll(e.target.value)}
                  autoFocus
                />
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
                  Enter your roll number to enter the voting room.
                </p>
              </>
            ) : (
              <>
                <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 8 }}>
                  Host password
                </label>
                <input
                  type="password"
                  placeholder="Enter host password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoFocus
                />
              </>
            )}

            {error && (
              <div style={{
                marginTop: 12, padding: '10px 14px', borderRadius: 10,
                background: 'rgba(220,53,69,0.12)', border: '1px solid rgba(220,53,69,0.25)',
                color: '#f87171', fontSize: 13,
              }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 16 }}>
              {loading ? 'Signing in…' : mode === 'voter' ? 'Enter Voting Room →' : 'Open Host Dashboard →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 20 }}>
            PitchVote · Secure scoring platform
          </p>
        </div>
      </div>
    </>
  );
}