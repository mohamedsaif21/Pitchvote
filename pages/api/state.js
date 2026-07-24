// pages/api/state.js
import { getData, getVoteCount, getTeamStats, getAllVoters, findVoterByRoll } from '../../lib/store';
import { getSession } from '../../lib/auth';

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not logged in' });

  const data = await getData();

  if (session.role === 'host') {
    const stats = getTeamStats(data);
    const voters = getAllVoters(data);
    
    const voterListWithVotes = voters.map(v => ({
      name: v.name,
      roll: v.roll,
      voteCount: getVoteCount(data, v.roll),
      votes: Object.entries(data.votes).reduce((acc, [teamId, votesObj]) => {
        if (votesObj[v.roll] !== undefined) acc[teamId] = votesObj[v.roll];
        return acc;
      }, {})
    }));

    return res.json({
      role: 'host',
      teams: stats,
      presenters: stats,
      voters: voterListWithVotes,
      maxVotesPerVoter: data.teams.length,
      meetingOpen: data.meetingOpen,
    });
  }

  // Voter - show all teams to vote on
  const voterRoll = session.roll;
  const voterInfo = findVoterByRoll(data, voterRoll);
  if (!voterInfo) return res.status(401).json({ error: 'Voter not found' });

  const myVotes = Object.entries(data.votes).reduce((acc, [teamId, votesObj]) => {
    if (votesObj[voterRoll] !== undefined) acc[teamId] = votesObj[voterRoll];
    return acc;
  }, {});

  return res.json({
    role: 'voter',
    name: voterInfo.name,
    roll: voterRoll,
    teams: data.teams,
    presenters: data.teams,
    myVotes,
    voteCount: getVoteCount(data, voterRoll),
    maxVotesPerVoter: data.teams.length,
    meetingOpen: data.meetingOpen,
  });
}
