// pages/vote.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const STAR_LABELS = ['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'];

export default function VotePage() {
  const router = useRouter();
  const [state, setState] = useState(null);
  const [view, setView] = useState('list'); // 'list' | 'score' | 'result'
  const [selectedPresenter, setSelectedPresenter] = useState(null);
  const [selectedStar, setSelectedStar] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadState(); }, []);

  async function loadState() {
    const res = await fetch('/api/state');
    if (res.status === 401) { router.push('/'); return; }
    const data = await res.json();
    setState(data);
  }

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/');
  }

  function openScore(presenter) {
    setSelectedPresenter(presenter);
    setSelectedStar(0);
    setHoverStar(0);
    setError('');
    setSubmitMsg('');
    setView('score');
  }

  async function submitVote() {
    if (!selectedStar) { setError('Please select a score.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presenter: selectedPresenter, score: selectedStar }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSubmitMsg(`✓ Score of ${selectedStar}/5 submitted for ${selectedPresenter}!`);
      await loadState();
    } finally {
      setSubmitting(false);
    }
  }

  if (!state) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>Loading…</div>
    </div>
  );

  const maxVotes = state.maxVotesPerVoter ?? 0;
  const votesLeft = maxVotes - state.voteCount;
  const activeStar = hoverStar || selectedStar;

  return (
    <>
      <Head><title>PitchVote — Vote</title></Head>
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(51,85,209,0.2) 0%, transparent 60%), #080d1f',
        padding: '0 0 60px',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          maxWidth: 520, margin: '0 auto',
        }}>
          <div>
            <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 18 }}>PitchVote</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
              {state.roll ? `${state.roll} — ${state.name}` : `Welcome, ${state.name}`}
            </div>
          </div>
          <button className="btn-ghost" onClick={handleLogout} style={{ padding: '8px 14px', fontSize: 13 }}>
            Logout
          </button>
        </div>

        <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 24px' }}>

          {/* Vote counter */}
          <div style={{ margin: '24px 0 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Votes used</span>
              <span style={{ fontWeight: 600 }}>
                <span style={{ color: state.voteCount >= maxVotes ? '#f87171' : '#6b93f5' }}>
                  {state.voteCount}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}> / {maxVotes}</span>
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${maxVotes > 0 ? (state.voteCount / maxVotes) * 100 : 0}%` }} />
            </div>
            {state.voteCount >= maxVotes && (
              <p style={{ fontSize: 12, color: '#fbbf24', marginTop: 8 }}>
                ⚠️ You have used all your votes.
              </p>
            )}
          </div>

          {view === 'list' && (
            <div className="fade-up">
              <h2 style={{ fontFamily: 'Sora', fontSize: 22, fontWeight: 700, margin: '28px 0 6px' }}>
                Presenters
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 20 }}>
                Select a presenter to score them. You have {votesLeft} vote{votesLeft !== 1 ? 's' : ''} remaining.
              </p>

              {/* presentersWithRoll removed to avoid showing placeholder lines */}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {state.presenters.map(presenter => {
                  const myScore = state.myVotes[presenter];
                  const hasVoted = myScore !== undefined;
                  return (
                    <button key={presenter} onClick={() => openScore(presenter)}
                      style={{
                        width: '100%', textAlign: 'left', cursor: 'pointer',
                        padding: '16px 20px', borderRadius: 14,
                        background: hasVoted ? 'rgba(107,147,245,0.08)' : 'rgba(255,255,255,0.04)',
                        border: hasVoted ? '1px solid rgba(107,147,245,0.3)' : '1px solid rgba(255,255,255,0.07)',
                        transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 3 }}>{presenter}</div>
                        {hasVoted ? (
                          <div style={{ fontSize: 13, color: '#6b93f5' }}>
                            {'★'.repeat(myScore)}{'☆'.repeat(5 - myScore)} · You scored {myScore}/5
                          </div>
                        ) : (
                          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                            {votesLeft > 0 ? 'Tap to score →' : 'No votes remaining'}
                          </div>
                        )}
                      </div>
                      {hasVoted && (
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'rgba(107,147,245,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18,
                        }}>✓</div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* My votes summary */}
              {Object.keys(state.myVotes).length > 0 && (
                <div style={{ marginTop: 32 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                    Your scores
                  </div>
                  <div className="glass" style={{ borderRadius: 14, padding: '4px 0' }}>
                    {Object.entries(state.myVotes).map(([p, s], i, arr) => (
                      <div key={p} style={{
                        padding: '12px 20px',
                        borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <span style={{ fontSize: 14 }}>{p}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ color: '#f5c842', fontSize: 16, letterSpacing: 1 }}>
                            {'★'.repeat(s)}{'☆'.repeat(5 - s)}
                          </span>
                          <span style={{
                            fontSize: 12, fontWeight: 600,
                            background: 'rgba(107,147,245,0.15)',
                            color: '#6b93f5',
                            padding: '2px 10px', borderRadius: 99,
                          }}>{s}/5</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'score' && (
            <div className="fade-up">
              <button onClick={() => setView('list')} style={{
                marginTop: 24, marginBottom: 4, background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 14, padding: 0,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>← Back to list</button>

              <h2 style={{ fontFamily: 'Sora', fontSize: 26, fontWeight: 700, margin: '16px 0 4px' }}>
                {selectedPresenter}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 28 }}>
                Rate this pitch from 1 to 5 stars
              </p>

              {state.myVotes[selectedPresenter] !== undefined ? (
                <div className="glass pop" style={{ borderRadius: 16, padding: 28, textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>
                    {'★'.repeat(state.myVotes[selectedPresenter])}
                    {'☆'.repeat(5 - state.myVotes[selectedPresenter])}
                  </div>
                  <div style={{ fontFamily: 'Sora', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
                    You gave {state.myVotes[selectedPresenter]}/5
                  </div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
                    {STAR_LABELS[state.myVotes[selectedPresenter]]}
                  </div>
                  {submitMsg && (
                    <div style={{ marginTop: 16, padding: '10px 16px', borderRadius: 10, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399', fontSize: 14 }}>
                      {submitMsg}
                    </div>
                  )}
                  <button className="btn-ghost" onClick={() => setView('list')} style={{ marginTop: 20 }}>
                    Back to list
                  </button>
                </div>
              ) : (
                <div className="glass" style={{ borderRadius: 16, padding: 28 }}>
                  {/* Stars */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
                      {[1,2,3,4,5].map(n => (
                        <span key={n}
                          className={`star-btn ${n <= activeStar ? 'lit' : 'unlit'}`}
                          onClick={() => setSelectedStar(n)}
                          onMouseEnter={() => setHoverStar(n)}
                          onMouseLeave={() => setHoverStar(0)}
                          style={{ fontSize: '2.8rem' }}>★</span>
                      ))}
                    </div>
                    <div style={{
                      fontSize: 15, fontWeight: 500, minHeight: 22,
                      color: activeStar ? '#fff' : 'rgba(255,255,255,0.3)',
                    }}>
                      {activeStar ? STAR_LABELS[activeStar] : 'Tap to rate'}
                    </div>
                    {activeStar > 0 && (
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                        {activeStar} out of 5
                      </div>
                    )}
                  </div>

                  {error && (
                    <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.2)', color: '#f87171', fontSize: 13 }}>
                      ⚠️ {error}
                    </div>
                  )}

                  {submitMsg && (
                    <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399', fontSize: 13 }}>
                      {submitMsg}
                    </div>
                  )}

                  <button className="btn-primary" style={{ marginTop: 20 }}
                    disabled={submitting || votesLeft === 0 || state.myVotes[selectedPresenter] !== undefined}
                    onClick={submitVote}>
                    {submitting ? 'Submitting…' : `Submit Score ${selectedStar ? `(${selectedStar}/5)` : ''}`}
                  </button>

                  {votesLeft === 0 && (
                    <p style={{ fontSize: 13, color: '#fbbf24', textAlign: 'center', marginTop: 12 }}>
                      You have used all your votes.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}