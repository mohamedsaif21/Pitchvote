// pages/api/state.js
import { getData, getVoteCount, getPresenterStats, getMaxVotesPerVoter, getPresentersWithRoll, getRollForName } from '../../lib/store';
import { getSession } from '../../lib/auth';

export default function handler(req, res) {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not logged in' });

  const data = getData();
  const sessionNameKey = String(session.name || '').trim().toLowerCase();
  const sessionRoll = session.roll || getRollForName(data, session.name);

  if (session.role === 'host') {
    const stats = getPresenterStats(data);
    const maxVotesPerVoter = getMaxVotesPerVoter(data);
    return res.json({
      role: 'host',
      presenters: stats,
      voters: data.voters.map(v => ({
        name: v,
        voteCount: getVoteCount(data, v),
        votes: Object.entries(data.votes).reduce((acc, [presenter, votes]) => {
          if (votes[v] !== undefined) acc[presenter] = votes[v];
          return acc;
        }, {})
      })),
      maxVotesPerVoter,
      rolls: data.rolls || {},
      meetingOpen: data.meetingOpen,
    });
  }

  // Voter - only their own data
  const myVotes = Object.entries(data.votes).reduce((acc, [presenter, votes]) => {
    if (votes[session.name] !== undefined) acc[presenter] = votes[session.name];
    return acc;
  }, {});
  const availablePresenters = data.presenters.filter(p => {
    if (sessionRoll) {
      const roll = getRollForName(data, p);
      return roll !== sessionRoll;
    }
    return String(p || '').trim().toLowerCase() !== sessionNameKey;
  });
  const availableWithRoll = getPresentersWithRoll(data).filter(line => {
    const parts = String(line).split('—');
    const name = (parts[1] || parts[0] || '').trim().toLowerCase();
    return name !== sessionNameKey;
  });

  return res.json({
    role: 'voter',
    name: session.name,
    roll: session.roll,
    presenters: availablePresenters,
    presentersWithRoll: availableWithRoll,
    myVotes,
    voteCount: getVoteCount(data, session.name),
    maxVotesPerVoter: getMaxVotesPerVoter(data),
    meetingOpen: data.meetingOpen,
  });
}
