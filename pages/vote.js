// pages/vote.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const STAR_LABELS = ['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'];

export default function VotePage() {
  const router = useRouter();
  const [state, setState] = useState(null);
  const [view, setView] = useState('list'); // 'list' | 'score'
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedStar, setSelectedStar] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [error, setError] = useState('');

  const teams = state?.teams ?? [];
  const myVotes = state?.myVotes ?? {};
  const voteCount = state?.voteCount ?? 0;
  const maxVotes = state?.maxVotesPerVoter ?? 4;
  const votesLeft = maxVotes - voteCount;

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

  function openScore(team) {
    setSelectedTeam(team);
    setSelectedStar(myVotes[team.id] ?? 0);
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
        body: JSON.stringify({ teamId: selectedTeam.id, score: selectedStar }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSubmitMsg(`✓ Score of ${selectedStar}/5 submitted for ${selectedTeam.name}!`);
      await loadState();
    } catch (e) {
      setError('Connection failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!state) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>Loading…</div>
    </div>
  );

  const activeStar = hoverStar || selectedStar;

  return (
    <>
      <Head>
        <title>PitchVote — Vote</title>
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
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
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18 }}>PitchVote</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
              {state.roll ? `${state.roll} — ${state?.name ?? 'voter'}` : `Welcome, ${state?.name ?? 'voter'}`}
            </div>
            {state.team && (
              <div style={{ fontSize: 11, color: '#6b93f5', marginTop: 2, fontWeight: 500 }}>
                🏫 Member of {state.team.name}
              </div>
            )}
          </div>
          <button className="btn-ghost" onClick={handleLogout} style={{ padding: '8px 14px', fontSize: 13 }}>
            Logout
          </button>
        </div>

        <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 24px' }}>

          {/* Vote counter */}
          <div style={{ margin: '24px 0 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Votes cast</span>
              <span style={{ fontWeight: 600 }}>
                <span style={{ color: voteCount >= maxVotes ? '#fbbf24' : '#6b93f5' }}>
                  {voteCount}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}> / {maxVotes}</span>
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0}%` }} />
            </div>
            {voteCount >= maxVotes && (
              <p style={{ fontSize: 12, color: '#fbbf24', marginTop: 8 }}>
                ✓ You have scored all available teams!
              </p>
            )}
          </div>

          {view === 'list' && (
            <div className="fade-up">
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 22, fontWeight: 700, margin: '28px 0 6px' }}>
                Teams
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 20 }}>
                Select a team to view members and submit your score.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {teams.map(team => {
                  const isOwnTeam = team.id === state.team?.id;
                  const myScore = myVotes[team.id];
                  const hasVoted = myScore !== undefined;
                  
                  return (
                    <div key={team.id}
                      style={{
                        width: '100%',
                        padding: '18px 20px', borderRadius: 16,
                        background: isOwnTeam 
                          ? 'rgba(255,255,255,0.02)' 
                          : hasVoted 
                            ? 'rgba(107,147,245,0.06)' 
                            : 'rgba(255,255,255,0.04)',
                        border: isOwnTeam
                          ? '1px dashed rgba(255,255,255,0.1)'
                          : hasVoted 
                            ? '1px solid rgba(107,147,245,0.25)' 
                            : '1px solid rgba(255,255,255,0.07)',
                        transition: 'all 0.15s',
                        display: 'flex', flexDirection: 'column', gap: 12,
                        opacity: isOwnTeam ? 0.6 : 1
                      }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 17, fontFamily: 'Sora, sans-serif' }}>
                            {team.name}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                            {team.members.map(m => (
                              <span key={m.roll} style={{
                                fontSize: 12,
                                background: 'rgba(255,255,255,0.06)',
                                color: 'rgba(255,255,255,0.5)',
                                padding: '4px 8px',
                                borderRadius: 6,
                              }}>
                                {m.name}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {isOwnTeam ? (
                          <span style={{
                            fontSize: 11, fontWeight: 600,
                            background: 'rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.4)',
                            padding: '3px 8px', borderRadius: 6
                          }}>Your Team</span>
                        ) : hasVoted ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                            <span style={{
                              fontSize: 11, fontWeight: 600,
                              background: 'rgba(107,147,245,0.15)',
                              color: '#6b93f5',
                              padding: '3px 8px', borderRadius: 6
                            }}>Scored {myScore}/5</span>
                            <button className="btn-ghost" onClick={() => openScore(team)} style={{ padding: '2px 6px', fontSize: 11, border: 'none' }}>
                              Change
                            </button>
                          </div>
                        ) : (
                          <button 
                            className="btn-primary" 
                            onClick={() => openScore(team)} 
                            disabled={votesLeft === 0 && !hasVoted}
                            style={{ width: 'auto', padding: '6px 12px', fontSize: 13, borderRadius: 8 }}>
                            Score →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* My votes summary */}
              {Object.keys(myVotes).length > 0 && (
                <div style={{ marginTop: 32 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                    Your Submitted Scores
                  </div>
                  <div className="glass" style={{ borderRadius: 14, padding: '4px 0' }}>
                    {Object.entries(myVotes).map(([teamId, score], i, arr) => {
                      const teamObj = teams.find(t => t.id === teamId);
                      return (
                        <div key={teamId} style={{
                          padding: '12px 20px',
                          borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                          <span style={{ fontSize: 14, fontWeight: 500 }}>{teamObj ? teamObj.name : 'Unknown Team'}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ color: '#f5c842', fontSize: 14, letterSpacing: 1 }}>
                              {'★'.repeat(score)}{'☆'.repeat(5 - score)}
                            </span>
                            <span style={{
                              fontSize: 12, fontWeight: 600,
                              background: 'rgba(107,147,245,0.15)',
                              color: '#6b93f5',
                              padding: '2px 10px', borderRadius: 99,
                            }}>{score}/5</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'score' && selectedTeam && (
            <div className="fade-up">
              <button onClick={() => setView('list')} style={{
                marginTop: 24, marginBottom: 4, background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 14, padding: 0,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>← Back to teams</button>

              <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 700, margin: '16px 0 4px' }}>
                {selectedTeam.name}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 12 }}>
                Team Members: {selectedTeam.members.map(m => m.name).join(', ')}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginBottom: 24 }}>
                Rate this team's product pitch from 1 to 5 stars.
              </p>

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
                        style={{ fontSize: '2.8rem', cursor: 'pointer', color: n <= activeStar ? '#f5c842' : 'rgba(255,255,255,0.18)', transition: 'transform 0.1s' }}>★</span>
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
                  disabled={submitting || (!myVotes[selectedTeam.id] && votesLeft === 0)}
                  onClick={submitVote}>
                  {submitting ? 'Submitting…' : `Submit Score ${selectedStar ? `(${selectedStar}/5)` : ''}`}
                </button>

                {votesLeft === 0 && !myVotes[selectedTeam.id] && (
                  <p style={{ fontSize: 13, color: '#fbbf24', textAlign: 'center', marginTop: 12 }}>
                    You have used all your votes.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}