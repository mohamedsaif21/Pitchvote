// lib/store.js  — presenter-based voting
// Voters are presenters who login by roll number.
// When one person presents, all other presenters vote for them.
// Each vote = a score 1-5. Host sees total + avg per presenter.

import fs from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';

const IS_VERCEL = process.env.VERCEL === '1';
const USE_KV = !!process.env.KV_REST_API_URL;
const KV_KEY = 'pitchvote-data';

// ─── DEFAULT DATA ──────────────────────────────────────────────────────────
const DEFAULT_STATE = {
  presenters: [
    { name: 'Akhilan Balan', roll: '712523205004' },
    { name: 'Jenileya  J', roll: '712523205028' },
    { name: 'Diya Angelin S.P', roll: '712523205021' },
    { name: 'Manjima', roll: '712523205038' },
    { name: 'Ram Kishore', roll: '712523205047' },
    { name: 'Surya Y', roll: '712523295062' },
    { name: 'Dinesh D', roll: '712523205701' },
    { name: 'Selva', roll: '712523205065' },
    { name: 'Krishna ', roll: '712523205033' },
    { name: 'Varma', roll: '712523205070' },
    { name: 'Srikanth', roll: '712523205056' },
    { name: 'Anish', roll: '712523205040' },
    { name: 'Jeeeva', roll: '712523205027' },
    { name: 'Naveen', roll: '712523205042' },
    { name: 'Priyan', roll: '712523205045' } ,
    { name: 'Vanan', roll: '712523205064' } ,
  ],

  // votes[presenterRoll][voterRoll] = score (1-5)
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
      if (data && Array.isArray(data.presenters)) {
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
      if (data && Array.isArray(data.presenters)) {
        return data;
      }
    }
  } catch (e) {}

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

/** Find a presenter by roll number. Returns { name, roll } or null. */
export function findVoterByRoll(data, roll) {
  if (!roll) return null;
  const normalized = String(roll).trim();
  const presenter = (data.presenters ?? []).find(p => String(p.roll).trim() === normalized);
  return presenter ? { name: presenter.name, roll: presenter.roll } : null;
}

/** Get all presenters (all voters). */
export function getAllVoters(data) {
  return (data.presenters ?? []).map(p => ({ name: p.name, roll: p.roll }));
}

/** How many presenters has this voter already scored? */
export function getVoteCount(data, roll) {
  if (!roll) return 0;
  const normalized = String(roll).trim();
  return Object.values(data.votes).filter(v => v[normalized] !== undefined).length;
}

/** Cast a vote. Returns updated data or throws a string error. */
export async function castVote(data, presenterRoll, voterRoll, score) {
  if (!data.meetingOpen) throw 'Voting is closed by the host';
  
  const voterInfo = findVoterByRoll(data, voterRoll);
  if (!voterInfo) throw 'Voter not found';

  const targetPresenter = (data.presenters ?? []).find(p => String(p.roll).trim() === String(presenterRoll).trim());
  if (!targetPresenter) throw 'Presenter not found';

  // Cannot vote for yourself
  if (String(voterRoll).trim() === String(presenterRoll).trim()) throw 'You cannot vote for yourself';

  // Validate score
  const parsedScore = parseInt(score, 10);
  if (isNaN(parsedScore) || parsedScore < 1 || parsedScore > 5) {
    throw 'Invalid score (must be 1-5)';
  }

  // Already voted for this presenter
  const normalizedPresenter = String(presenterRoll).trim();
  const normalizedVoter = String(voterRoll).trim();
  if (data.votes[normalizedPresenter]?.[normalizedVoter] !== undefined)
    throw 'You already voted for this presenter';

  // Check if voter already used all votes (max = number of presenters)
  const usedVotes = getVoteCount(data, voterRoll);
  const maxVotes = data.presenters.length;
  if (usedVotes >= maxVotes) {
    throw 'You have already voted for all presenters';
  }

  if (!data.votes[normalizedPresenter]) data.votes[normalizedPresenter] = {};
  data.votes[normalizedPresenter][normalizedVoter] = parsedScore;
  await writeData(data);
  return data;
}

/** Stats for all presenters sorted by average score descending. */
export function getPresenterStats(data) {
  return (data.presenters ?? []).map((presenter) => {
    const presVotes = data.votes[presenter.roll] ? Object.entries(data.votes[presenter.roll]) : [];
    const scores = presVotes.map(([, s]) => s);
    const total = scores.reduce((a, b) => a + b, 0);
    const avg   = scores.length ? total / scores.length : null;
    return { 
      roll: presenter.roll,
      name: presenter.name,
      voteCount: scores.length, 
      total, 
      avg, 
      votes: presVotes 
    };
  }).sort((a, b) => {
    if (a.avg === null && b.avg === null) return 0;
    if (a.avg === null) return 1;
    if (b.avg === null) return -1;
    if (b.avg !== a.avg) return b.avg - a.avg;
    return b.total - a.total;
  }).map((p, i) => ({ ...p, rank: i + 1 }));
}
