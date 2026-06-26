// pages/host.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function HostPage() {
  const router = useRouter();
  const [state, setState] = useState(null);
  const [tab, setTab] = useState('results'); // 'results' | 'voters' | 'manage'
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [actionMsg, setActionMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadState(); }, []);

  // Auto-refresh every 10s
  useEffect(() => {
    const id = setInterval(loadState, 10000);
    return () => clearInterval(id);
  }, []);

  const teams = state?.teams ?? [];
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
    try {
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
    } catch (e) {
      setActionMsg('Request failed');
    } finally {
      setLoading(false);
      setTimeout(() => setActionMsg(''), 3000);
    }
  }

  if (!state) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>Loading dashboard…</div>
    </div>
  );

  const totalVotes = voters.reduce((a, v) => a + (v.voteCount || 0), 0);
  const maxVotesPerVoter = state.maxVotesPerVoter ?? 4;
  const maxPossibleVotes = voters.length * maxVotesPerVoter;

  return (
    <>
      <Head>
        <title>PitchVote — Host Dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
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
          maxWidth: 960, margin: '0 auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #3355d1, #6b93f5)',
              borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>🎯</div>
            <div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 17 }}>PitchVote</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Host Dashboard</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => adminAction('toggleMeeting')}
              disabled={loading}
              style={{
                padding: '8px 14px', fontSize: 13, fontWeight: 500,
                borderRadius: 10, border: 'none', cursor: 'pointer',
                background: state.meetingOpen ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                color: state.meetingOpen ? '#34d399' : '#f87171',
              }}>
              {state.meetingOpen ? '🟢 Voting Open' : '🔴 Voting Closed'}
            </button>
            <button className="btn-ghost" onClick={() => loadState()} style={{ padding: '8px 12px', fontSize: 13 }}>
              ↻ Refresh
            </button>
            <button className="btn-ghost" onClick={handleLogout} style={{ padding: '8px 12px', fontSize: 13 }}>
              Logout
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 28px' }}>
          {/* Stats bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, margin: '24px 0' }}>
            {[
              { label: 'Teams', value: teams.length, icon: '🏫' },
              { label: 'Voters (total)', value: voters.length, icon: '👥' },
              { label: 'Votes cast', value: totalVotes, icon: '🗳️' },
              { label: 'Votes remaining', value: maxPossibleVotes - totalVotes, icon: '⏳' },
            ].map(s => (
              <div key={s.label} className="glass" style={{ borderRadius: 14, padding: '14px 18px' }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 700 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, marginBottom: 24 }}>
            {[
              { id: 'results', label: '🏆 Team Standings' },
              { id: 'voters', label: '👥 Voter Tracker' },
              { id: 'manage', label: '⚙️ Session Controls' },
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
              {selectedTeam ? (
                <TeamDetail
                  team={selectedTeam}
                  votersList={voters}
                  onBack={() => setSelectedTeam(null)}
                />
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {teams.map((t, i) => (
                      <button key={t.id} onClick={() => setSelectedTeam(t)}
                        style={{
                          width: '100%', textAlign: 'left', cursor: 'pointer',
                          padding: '18px 22px', borderRadius: 16,
                          background: 'rgba(255,255,255,0.04)',
                          border: i === 0 && t.avg ? '1px solid rgba(245,200,66,0.3)' : '1px solid rgba(255,255,255,0.07)',
                          transition: 'all 0.15s',
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <span style={{ fontSize: 24, minWidth: 32 }}>
                              {t.avg ? (MEDALS[i] || `#${i + 1}`) : '—'}
                            </span>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 17, fontFamily: 'Sora, sans-serif' }}>{t.name}</div>
                              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                                {t.members.map(m => (
                                  <span key={m.roll} style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{m.name}</span>
                                ))}
                              </div>
                              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
                                {t.voteCount} vote{t.voteCount !== 1 ? 's' : ''} cast · click to view breakdown
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{
                              fontFamily: 'Sora, sans-serif', fontSize: 28, fontWeight: 700,
                              color: t.avg >= 4 ? '#f5c842' : t.avg >= 3 ? '#6b93f5' : 'rgba(255,255,255,0.6)',
                            }}>
                              {t.avg ? Number(t.avg).toFixed(2) : '—'}
                            </div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>avg / 5</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>total: {t.total}</div>
                          </div>
                        </div>
                        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="progress-track" style={{ flex: 1 }}>
                            <div className="progress-fill" style={{ width: `${t.avg ? (t.avg / 5 * 100).toFixed(0) : 0}%` }} />
                          </div>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', minWidth: 20 }}>5.0</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {teams.every(t => !t.avg) && (
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
              <div style={{ overflowX: 'auto' }}>
                <div className="glass" style={{ borderRadius: 14, minWidth: 700 }}>
                  {/* Table header */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `200px repeat(${teams.length}, 1fr) 80px`,
                    padding: '14px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    <span>Voter (Name / Roll)</span>
                    {teams.map(t => (
                      <span key={t.id} style={{ textAlign: 'center', fontSize: 11 }} title={t.name}>
                        {t.name.split(' ')[1] || t.name}
                      </span>
                    ))}
                    <span style={{ textAlign: 'center' }}>Voted</span>
                  </div>

                  {voters.map((voter, idx) => (
                    <div key={voter.roll} style={{
                      display: 'grid',
                      gridTemplateColumns: `200px repeat(${teams.length}, 1fr) 80px`,
                      padding: '12px 20px',
                      borderBottom: idx < voters.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      alignItems: 'center',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{voter.name}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                          {voter.roll} · {voter.teamName}
                        </span>
                      </div>
                      
                      {teams.map(t => {
                        const isOwnTeam = t.id === voter.teamId;
                        const score = voter.votes[t.id];
                        return (
                          <span key={t.id} style={{ textAlign: 'center' }}>
                            {isOwnTeam ? (
                              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, fontStyle: 'italic' }}>own</span>
                            ) : score !== undefined ? (
                              <span style={{
                                fontSize: 12, fontWeight: 700,
                                background: 'rgba(107,147,245,0.15)',
                                color: '#6b93f5',
                                padding: '3px 8px', borderRadius: 6,
                              }}>{score}</span>
                            ) : (
                              <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 12 }}>—</span>
                            )}
                          </span>
                        );
                      })}
                      
                      <span style={{ textAlign: 'center' }}>
                        <span style={{
                          fontSize: 12, fontWeight: 600,
                          color: voter.voteCount === 4 ? '#34d399' : voter.voteCount > 0 ? '#6b93f5' : 'rgba(255,255,255,0.3)',
                          background: voter.voteCount === 4 ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.05)',
                          padding: '3px 10px', borderRadius: 99,
                        }}>{voter.voteCount}/4</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Manage tab */}
          {tab === 'manage' && (
            <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Teams Reference */}
              <div className="glass" style={{ borderRadius: 14, padding: 20 }}>
                <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                  🏫 Registered Teams and Members
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  {teams.map(t => (
                    <div key={t.id} style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>{t.name}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {t.members.map(m => (
                          <div key={m.roll} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{m.name}</span>
                            <span style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{m.roll}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger zone */}
              <div style={{
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
                  Clears all cast votes. Teams and voter registration remain intact.
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

function TeamDetail({ team, votersList, onBack }) {
  const votes = team?.votes ?? [];

  const getVoterInfo = (roll) => {
    const v = votersList.find(x => String(x.roll).trim() === String(roll).trim());
    return v ? `${v.name} (${v.roll}) · ${v.teamName}` : `Roll ${roll}`;
  };

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
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
              {team?.name ?? 'Unknown team'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
              {votes.length} vote{votes.length !== 1 ? 's' : ''} cast · Rank #{team?.rank ?? '—'}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 40, fontWeight: 700, color: '#f5c842' }}>
              {team?.avg ? Number(team.avg).toFixed(2) : '—'}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>average score</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {votes.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>No votes yet.</p>
        ) : (
          [...votes].sort((a, b) => b[1] - a[1]).map(([voterRoll, score]) => (
            <div key={voterRoll} className="glass" style={{ borderRadius: 12, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{getVoterInfo(voterRoll)}</span>
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
