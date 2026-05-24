// pages/host.js
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function HostPage() {
  const router = useRouter();
  const [state, setState] = useState(null);
  const [tab, setTab] = useState('results'); // 'results' | 'voters' | 'manage'
  const [selectedPresenter, setSelectedPresenter] = useState(null);
  const [newPresenter, setNewPresenter] = useState('');
  const [newVoter, setNewVoter] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadState(); }, []);

  // Auto-refresh every 10s
  useEffect(() => {
    const id = setInterval(loadState, 10000);
    return () => clearInterval(id);
  }, []);

  const presenters = state?.presenters ?? [];
  const voters = state?.voters ?? [];

  async function loadState() {
    const res = await fetch('/api/state');
    if (res.status === 401) { router.push('/'); return; }
    setState(await res.json());
  }

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/');
  }

  async function adminAction(action, value) {
    setLoading(true);
    setActionMsg('');
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, value }),
    });
    const data = await res.json();
    if (res.ok) {
      setActionMsg('Done!');
      await loadState();
    } else {
      setActionMsg('Error: ' + data.error);
    }
    setLoading(false);
    setTimeout(() => setActionMsg(''), 3000);
  }

  if (!state) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>Loading dashboard…</div>
    </div>
  );

  const totalVotes = voters.reduce((a, v) => a + (v.voteCount || 0), 0);
  const maxVotesPerVoter = state.maxVotesPerVoter ?? 0;

  return (
    <>
      <Head><title>PitchVote — Host Dashboard</title></Head>
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse 100% 40% at 50% 0%, rgba(51,85,209,0.18) 0%, transparent 60%), #080d1f',
        paddingBottom: 60,
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 28px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          maxWidth: 860, margin: '0 auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #3355d1, #6b93f5)',
              borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>🎯</div>
            <div>
              <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 17 }}>PitchVote</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Host Dashboard</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => adminAction('toggleMeeting')}
              style={{
                padding: '8px 14px', fontSize: 13, fontWeight: 500,
                borderRadius: 10, border: 'none', cursor: 'pointer',
                background: state.meetingOpen ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                color: state.meetingOpen ? '#34d399' : '#f87171',
              }}>
              {state.meetingOpen ? '🟢 Meeting Open' : '🔴 Meeting Closed'}
            </button>
            <button className="btn-ghost" onClick={() => loadState()} style={{ padding: '8px 12px', fontSize: 13 }}>
              ↻ Refresh
            </button>
            <button className="btn-ghost" onClick={handleLogout} style={{ padding: '8px 12px', fontSize: 13 }}>
              Logout
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 28px' }}>
          {/* Stats bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, margin: '24px 0' }}>
            {[
              { label: 'Presenters', value: state.presenters.length, icon: '🎤' },
              { label: 'Voters', value: state.voters.length, icon: '👥' },
              { label: 'Total votes cast', value: totalVotes, icon: '🗳️' },
              { label: 'Votes remaining', value: (state.voters.length * maxVotesPerVoter) - totalVotes, icon: '⏳' },
            ].map(s => (
              <div key={s.label} className="glass" style={{ borderRadius: 14, padding: '14px 18px' }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontFamily: 'Sora', fontSize: 26, fontWeight: 700 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, marginBottom: 24 }}>
            {[
              { id: 'results', label: '🏆 Results' },
              { id: 'voters', label: '👥 Voter Tracker' },
              { id: 'manage', label: '⚙️ Manage' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 14, fontWeight: 500,
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: tab === t.id ? 'rgba(107,147,245,0.2)' : 'transparent',
                  color: tab === t.id ? '#6b93f5' : 'rgba(255,255,255,0.4)',
                }}>{t.label}</button>
            ))}
          </div>

          {/* Results tab */}
          {tab === 'results' && (
            <div className="fade-up">
              {selectedPresenter ? (
                <PresenterDetail
                  presenter={selectedPresenter}
                  onBack={() => setSelectedPresenter(null)}
                />
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {presenters.map((p, i) => (
                      <button key={p?.name ?? i} onClick={() => setSelectedPresenter(p)}
                        style={{
                          width: '100%', textAlign: 'left', cursor: 'pointer',
                          padding: '18px 22px', borderRadius: 14,
                          background: 'rgba(255,255,255,0.04)',
                          border: i === 0 && p.avg ? '1px solid rgba(245,200,66,0.3)' : '1px solid rgba(255,255,255,0.07)',
                          transition: 'all 0.15s',
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <span style={{ fontSize: 24, minWidth: 30 }}>
                              {p.avg ? (MEDALS[i] || `#${i + 1}`) : '—'}
                            </span>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 17 }}>{p?.name ?? 'Unknown presenter'}</div>
                              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                                {(p?.votes?.length ?? 0)} vote{(p?.votes?.length ?? 0) !== 1 ? 's' : ''} · tap for breakdown
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{
                              fontFamily: 'Sora', fontSize: 28, fontWeight: 700,
                              color: (p?.avg ?? 0) >= 4 ? '#f5c842' : (p?.avg ?? 0) >= 3 ? '#6b93f5' : 'rgba(255,255,255,0.6)',
                            }}>
                              {p?.avg ? Number(p.avg).toFixed(1) : '—'}
                            </div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>avg / 5</div>
                          </div>
                        </div>
                        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="progress-track" style={{ flex: 1 }}>
                            <div className="progress-fill" style={{ width: `${p?.avg ? (p.avg / 5 * 100).toFixed(0) : 0}%` }} />
                          </div>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', minWidth: 20 }}>5</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {presenters.every(p => !p?.avg) && (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                      No votes cast yet. Waiting for voters…
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Voter tracker tab */}
          {tab === 'voters' && (
            <div className="fade-up">
              <div className="glass" style={{ borderRadius: 14, overflow: 'hidden' }}>
                {/* Table header */}
                  <div style={{
                  display: 'grid',
                  gridTemplateColumns: `180px repeat(${presenters.length}, 1fr) 80px`,
                  padding: '10px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.35)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  <span>Voter</span>
                  {presenters.map((p, i) => <span key={p?.name ?? i} style={{ textAlign: 'center' }}>{p?.name ?? 'Unknown'}</span>)}
                  <span style={{ textAlign: 'center' }}>Used</span>
                </div>

                {voters.map((voter, i) => (
                  <div key={voter?.name ?? i} style={{
                    display: 'grid',
                    gridTemplateColumns: `180px repeat(${presenters.length}, 1fr) 80px`,
                    padding: '12px 20px',
                    borderBottom: i < voters.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    alignItems: 'center',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{voter?.name ?? 'Unknown voter'}</span>
                    {presenters.map((p, presenterIndex) => {
                      const presenterName = p?.name ?? `Presenter ${presenterIndex + 1}`;
                      const score = voter?.votes?.[presenterName];
                      return (
                        <span key={presenterName} style={{ textAlign: 'center' }}>
                          {score !== undefined ? (
                            <span style={{
                              fontSize: 13, fontWeight: 600,
                              background: 'rgba(107,147,245,0.15)',
                              color: '#6b93f5',
                              padding: '2px 10px', borderRadius: 99,
                            }}>{score}</span>
                          ) : (
                            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 13 }}>—</span>
                          )}
                        </span>
                      );
                    })}
                    <span style={{ textAlign: 'center' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600,
                        color: voter.voteCount === 5 ? '#34d399' : voter.voteCount > 0 ? '#6b93f5' : 'rgba(255,255,255,0.3)',
                        background: voter.voteCount === 5 ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.05)',
                        padding: '3px 10px', borderRadius: 99,
                      }}>{voter.voteCount}/5</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manage tab */}
          {tab === 'manage' && (
            <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Presenters */}
              <div className="glass" style={{ borderRadius: 14, padding: 20 }}>
                <h3 style={{ fontFamily: 'Sora', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                  🎤 Presenters
                </h3>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <input type="text" placeholder="Add presenter…" value={newPresenter}
                    onChange={e => setNewPresenter(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && newPresenter.trim()) { adminAction('addPresenter', newPresenter.trim()); setNewPresenter(''); }}}
                    style={{ flex: 1 }} />
                  <button className="btn-ghost"
                    onClick={() => { adminAction('addPresenter', newPresenter.trim()); setNewPresenter(''); }}
                    style={{ whiteSpace: 'nowrap', padding: '10px 14px' }}>
                    + Add
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {presenters.map((p, i) => (
                    <div key={p?.name ?? i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)',
                    }}>
                      <span style={{ fontSize: 14 }}>{p?.name ?? 'Unknown presenter'}</span>
                      <button onClick={() => { if (p?.name && confirm(`Remove ${p.name}? Their votes will be deleted.`)) adminAction('removePresenter', p.name); }}
                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Voters */}
              <div className="glass" style={{ borderRadius: 14, padding: 20 }}>
                <h3 style={{ fontFamily: 'Sora', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                  👥 Voters
                </h3>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <input type="text" placeholder="Add voter…" value={newVoter}
                    onChange={e => setNewVoter(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && newVoter.trim()) { adminAction('addVoter', newVoter.trim()); setNewVoter(''); }}}
                    style={{ flex: 1 }} />
                  <button className="btn-ghost"
                    onClick={() => { adminAction('addVoter', newVoter.trim()); setNewVoter(''); }}
                    style={{ whiteSpace: 'nowrap', padding: '10px 14px' }}>
                    + Add
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
                  {voters.map((v, i) => (
                    <div key={v?.name ?? i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)',
                    }}>
                      <span style={{ fontSize: 14 }}>{v?.name ?? 'Unknown voter'}</span>
                      <button onClick={() => { if (v?.name && confirm(`Remove ${v.name}?`)) adminAction('removeVoter', v.name); }}
                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger zone */}
              <div style={{
                gridColumn: '1 / -1',
                padding: 20, borderRadius: 14,
                background: 'rgba(220,53,69,0.06)',
                border: '1px solid rgba(220,53,69,0.15)',
              }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f87171', marginBottom: 12 }}>
                  ⚠️ Danger zone
                </h3>
                <button
                  onClick={() => { if (confirm('Reset ALL votes? This cannot be undone!')) adminAction('resetVotes'); }}
                  style={{
                    padding: '10px 20px', borderRadius: 10, fontSize: 14, cursor: 'pointer',
                    background: 'rgba(220,53,69,0.12)', border: '1px solid rgba(220,53,69,0.3)',
                    color: '#f87171', fontWeight: 500,
                  }}>
                  Reset all votes
                </button>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
                  Clears all cast votes. Presenters and voter list remain intact.
                </p>
              </div>
            </div>
          )}

          {actionMsg && (
            <div style={{
              position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              padding: '12px 20px', borderRadius: 12, fontSize: 14,
              background: '#1a2e8a', border: '1px solid #3355d1', color: '#fff',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              {actionMsg}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function PresenterDetail({ presenter, onBack }) {
  const votes = presenter?.votes ?? [];
  return (
    <div className="fade-up">
      <button onClick={onBack} style={{
        marginBottom: 16, background: 'none', border: 'none',
        color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 14, padding: 0,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>← All results</button>

      <div className="glass" style={{ borderRadius: 16, padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontFamily: 'Sora', fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
              {presenter?.name ?? 'Unknown presenter'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
              {votes.length} voter{votes.length !== 1 ? 's' : ''} · Rank #{presenter?.rank ?? '—'}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Sora', fontSize: 40, fontWeight: 700, color: '#f5c842' }}>
              {presenter?.avg ? Number(presenter.avg).toFixed(2) : '—'}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>average score</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {votes.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>No votes yet.</p>
        ) : (
          [...votes].sort((a, b) => b[1] - a[1]).map(([voter, score]) => (
            <div key={voter} className="glass" style={{ borderRadius: 12, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15 }}>{voter}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#f5c842', fontSize: 18, letterSpacing: 2 }}>
                  {'★'.repeat(score)}{'☆'.repeat(5 - score)}
                </span>
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  background: 'rgba(107,147,245,0.15)', color: '#6b93f5',
                  padding: '3px 12px', borderRadius: 99,
                }}>{score}/5</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
