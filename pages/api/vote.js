// pages/api/vote.js
import { getData, castVote, getVoteCount, getMaxVotesPerVoter, getRollForName } from '../../lib/store';
import { getSession } from '../../lib/auth';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const session = getSession(req);
  if (!session || session.role !== 'voter') return res.status(401).json({ error: 'Not logged in' });

  const { presenter, score } = req.body;
  if (!presenter || !score || score < 1 || score > 5) return res.status(400).json({ error: 'Invalid vote' });

  const data = getData();
  const sessionRoll = session.roll || getRollForName(data, session.name);
  const presenterRoll = getRollForName(data, presenter);
  if (
    (sessionRoll && presenterRoll && sessionRoll === presenterRoll) ||
    String(presenter).trim().toLowerCase() === String(session.name || '').trim().toLowerCase()
  ) {
    return res.status(400).json({ error: 'You cannot vote for yourself' });
  }
  if (!data.presenters.includes(presenter)) return res.status(400).json({ error: 'Unknown presenter' });

  const alreadyVoted = data.votes[presenter]?.[session.name] !== undefined;
  if (alreadyVoted) return res.status(400).json({ error: 'Already voted for this presenter' });

  const count = getVoteCount(data, session.name);
  const maxVotes = getMaxVotesPerVoter(data);
  if (count >= maxVotes) return res.status(400).json({ error: `You have used all ${maxVotes} votes` });

  const updated = castVote(presenter, session.name, score);
  return res.json({ ok: true, voteCount: getVoteCount(updated, session.name) });
}
