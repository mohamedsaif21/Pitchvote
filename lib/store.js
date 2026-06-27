// lib/store.js  — team-based voting
// Voters login by roll number. Each voter can vote for teams they are NOT part of.
// Each team vote = a score 1-5. Host sees total + avg per team.

import fs from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';

const IS_VERCEL = process.env.VERCEL === '1';
const USE_KV = !!process.env.KV_REST_API_URL;
const KV_KEY = 'pitchvote-data';

// ─── DEFAULT DATA ──────────────────────────────────────────────────────────
// Each team has exactly 3 members. Max 5 teams.
const DEFAULT_STATE = {
  teams: [
    {
      id: 'team1',
      name: 'Team Alpha',
      members: [
        { name: 'Akhilan B',    roll: '712523205004' },
        { name: 'Jeni',  roll: '712523205028' },
        { name: 'Akash',      roll: '7125232000' },
      ],
    },
    {
      id: 'team2',
      name: 'Team Beta',
      members: [
        { name: 'rohith',  roll: '712523205001' },
        { name: 'Thamil Selvan P', roll: '712523205065' },
        { name: 'D Dinesh',       roll: '712523205701' },
      ],
    },
    {
      id: 'team3',
      name: 'Team Gamma',
      members: [
        { name: 'Diya Angelin S.P', roll: '712523205021' },
        { name: 'Sidharth',      roll: '712523205000' },
        { name: 'Manjima',        roll: '712523205039' },
      ],
    },
    {
      id: 'team4',
      name: 'Team Delta',
      members: [
        { name: 'Ram Kishore',     roll: '712523205047' },
        { name: 'Priya M',         roll: '712523205011' },
        { name: 'Kavya R',         roll: '712523205013' },
      ],
    },
    {
      id: 'team5',
      name: 'Team Epsilon',
      members: [
        { name: 'Surya Y',   roll: '712523295062' },
        { name: 'Nisha V',   roll: '712523205015' },
        { name: 'Gopal S',   roll: '712523205016' },
      ],
    },
  ],
  // votes[teamId][voterRoll] = score (1-5)
  votes: {},
  meetingOpen: true,
};

// ─── STORAGE ───────────────────────────────────────────────────────────────
let memoryStore = JSON.parse(JSON.stringify(DEFAULT_STATE));
const DATA_FILE = path.join(process.cwd(), '.pitchvote-data.json');

async function readData() {
  if (USE_KV) {
    try {
      const data = await kv.get(KV_KEY);
      if (data && Array.isArray(data.teams)) {
        return data;
      }
    } catch (e) {
      console.error('Vercel KV read error, falling back to DEFAULT_STATE:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  if (IS_VERCEL) return JSON.parse(JSON.stringify(memoryStore));

  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      if (data && Array.isArray(data.teams)) {
        return data;
      }
    }
  } catch (e) {}

  // If file doesn't exist or is in outdated format, write and return DEFAULT_STATE
  const defaultStateCopy = JSON.parse(JSON.stringify(DEFAULT_STATE));
  await writeData(defaultStateCopy);
  return defaultStateCopy;
}

async function writeData(data) {
  if (USE_KV) {
    try {
      await kv.set(KV_KEY, data);
    } catch (e) {
      console.error('Vercel KV write error:', e);
    }
    return;
  }

  if (IS_VERCEL) { memoryStore = JSON.parse(JSON.stringify(data)); return; }
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8'); }
  catch (e) { console.error('Write error', e); }
}

// ─── PUBLIC API ────────────────────────────────────────────────────────────
export async function getData() { return await readData(); }
export async function saveData(d) { await writeData(d); }

/** Find a voter by roll number. Returns { member, team } or null. */
export function findVoterByRoll(data, roll) {
  if (!roll) return null;
  const normalized = String(roll).trim();
  for (const team of data.teams) {
    const member = team.members.find(m => String(m.roll).trim() === normalized);
    if (member) return { member, team };
  }
  return null;
}

/** Get all 15 voters with their team context. */
export function getAllVoters(data) {
  const list = [];
  for (const team of data.teams) {
    for (const m of team.members) {
      list.push({
        name: m.name,
        roll: m.roll,
        teamId: team.id,
        teamName: team.name,
      });
    }
  }
  return list;
}

/** How many teams has this voter already scored? */
export function getVoteCount(data, roll) {
  if (!roll) return 0;
  const normalized = String(roll).trim();
  return Object.values(data.votes).filter(v => v[normalized] !== undefined).length;
}

/** Cast a vote. Returns updated data or throws a string error. */
export async function castVote(data, teamId, voterRoll, score) {
  if (!data.meetingOpen) throw 'Voting is closed by the host';
  
  const voterInfo = findVoterByRoll(data, voterRoll);
  if (!voterInfo) throw 'Voter not found';

  // Cannot vote for own team
  if (voterInfo.team.id === teamId) throw 'You cannot vote for your own team';

  // Validate score
  const parsedScore = parseInt(score, 10);
  if (isNaN(parsedScore) || parsedScore < 1 || parsedScore > 5) {
    throw 'Invalid score (must be 1-5)';
  }

  // Already voted for this team
  const normalizedRoll = String(voterRoll).trim();
  if (data.votes[teamId]?.[normalizedRoll] !== undefined)
    throw 'You already voted for this team';

  // Check if voter already used all votes (max 4)
  const usedVotes = getVoteCount(data, voterRoll);
  if (usedVotes >= 4) {
    throw 'You have already voted for all available teams';
  }

  if (!data.votes[teamId]) data.votes[teamId] = {};
  data.votes[teamId][normalizedRoll] = parsedScore;
  await writeData(data);
  return data;
}

/** Stats for all teams sorted by average score descending. */
export function getTeamStats(data) {
  return data.teams.map((team) => {
    const teamVotes = data.votes[team.id] ? Object.entries(data.votes[team.id]) : [];
    const scores = teamVotes.map(([, s]) => s);
    const total = scores.reduce((a, b) => a + b, 0);
    const avg   = scores.length ? total / scores.length : null;
    return { 
      id: team.id,
      name: team.name,
      members: team.members,
      voteCount: scores.length, 
      total, 
      avg, 
      votes: teamVotes 
    };
  }).sort((a, b) => {
    if (a.avg === null && b.avg === null) return 0;
    if (a.avg === null) return 1;
    if (b.avg === null) return -1;
    if (b.avg !== a.avg) return b.avg - a.avg;
    return b.total - a.total; // tiebreaker
  }).map((t, i) => ({ ...t, rank: i + 1 }));
}