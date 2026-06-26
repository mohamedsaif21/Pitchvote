// pages/api/state.js
import { getData, getVoteCount, getTeamStats, getAllVoters, findVoterByRoll } from '../../lib/store';
import { getSession } from '../../lib/auth';

export default function handler(req, res) {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not logged in' });

  const data = getData();

  if (session.role === 'host') {
    const stats = getTeamStats(data);
    const voters = getAllVoters(data);
    
    const voterListWithVotes = voters.map(v => ({
      name: v.name,
      roll: v.roll,
      teamId: v.teamId,
      teamName: v.teamName,
      voteCount: getVoteCount(data, v.roll),
      votes: Object.entries(data.votes).reduce((acc, [teamId, votesObj]) => {
        if (votesObj[v.roll] !== undefined) acc[teamId] = votesObj[v.roll];
        return acc;
      }, {})
    }));

    return res.json({
      role: 'host',
      teams: stats,
      presenters: stats, // alias for backwards compatibility
      voters: voterListWithVotes,
      maxVotesPerVoter: 4,
      meetingOpen: data.meetingOpen,
    });
  }

  // Voter - only their own data and available teams to vote on
  const voterRoll = session.roll;
  const voterInfo = findVoterByRoll(data, voterRoll);
  if (!voterInfo) return res.status(401).json({ error: 'Voter not found' });

  const myVotes = Object.entries(data.votes).reduce((acc, [teamId, votesObj]) => {
    if (votesObj[voterRoll] !== undefined) acc[teamId] = votesObj[voterRoll];
    return acc;
  }, {});

  const availableTeams = data.teams.filter(t => t.id !== voterInfo.team.id);

  return res.json({
    role: 'voter',
    name: voterInfo.member.name,
    roll: voterRoll,
    team: {
      id: voterInfo.team.id,
      name: voterInfo.team.name
    },
    teams: data.teams,
    presenters: availableTeams, // alias for backwards compatibility (teams that are votable)
    myVotes,
    voteCount: getVoteCount(data, voterRoll),
    maxVotesPerVoter: 4,
    meetingOpen: data.meetingOpen,
  });
}
