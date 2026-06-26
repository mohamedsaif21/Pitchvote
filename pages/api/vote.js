// pages/api/vote.js
import { getData, castVote, getVoteCount } from '../../lib/store';
import { getSession } from '../../lib/auth';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const session = getSession(req);
  if (!session || session.role !== 'voter') return res.status(401).json({ error: 'Not logged in' });

  const { score } = req.body;
  const teamId = req.body.teamId || req.body.presenter;

  if (!teamId || !score || score < 1 || score > 5) {
    return res.status(400).json({ error: 'Invalid vote parameters' });
  }

  const data = getData();
  const voterRoll = session.roll;

  try {
    const updated = castVote(data, teamId, voterRoll, score);
    return res.json({ ok: true, voteCount: getVoteCount(updated, voterRoll) });
  } catch (errorMsg) {
    return res.status(400).json({ error: typeof errorMsg === 'string' ? errorMsg : 'Voting failed' });
  }
}
