// lib/store.js
import fs from 'fs';
import path from 'path';

const IS_VERCEL = process.env.VERCEL === '1';

const DEFAULT_STATE = {
  voters: [
    'Akhilan B',
    'Jeevanandan K',
    'James Aathithyan',
    'Diya Angelin S.P',
    'Surya Y',
    'D Dinesh',
    'Ram Kishore',
    'THAMIL SELVAN P',
    'Aadharsh K',
    'Bindhiya',
    'Tamil Vanan K',
    'Vijaya Varma R',
    'Srikanth M',
    'Krishna Moorthi'
  ],
  presenters: [
    'Akhilan B',
    'Jeevanandan K',
    'James Aathithyan',
    'Diya Angelin S.P',
    'Surya Y',
    'D Dinesh',
    'Ram Kishore',
    'THAMIL SELVAN P',
    'Aadharsh K',
    'Bindhiya',
    'Tamil Vanan K',
    'Vijaya Varma R',
    'Srikanth M',
    'Krishna Moorthi'
  ],
  rolls: {
    '712523205004': 'Akhilan B',
    '712523205027': 'Jeevanandan K',
    '712523205026': 'James Aathithyan',
    '712523205021': 'Diya Angelin S.P',
    '712523205062': 'Surya Y',
    '712523205701': 'D Dinesh',
    '712523205047': 'Ram Kishore',
    '712523205065': 'THAMIL SELVAN P',
    '712523205001': 'Aadharsh K',
    '712523205014': 'Bindhiya',
    '712523205064': 'Tamil Vanan K',
    '712523205070': 'Vijaya Varma R',
    '712523205056': 'Srikanth M',
    '712523205033': 'Krishna Moorthi'
  },
  votes: {},
  meetingOpen: true,
};

function cloneState(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeLoose(value) {
  return normalizeName(value).replace(/[^a-z0-9]/g, '');
}

function syncRoster(data) {
  const incoming = data && typeof data === 'object' ? data : {};
  const rolls = incoming.rolls && typeof incoming.rolls === 'object' ? incoming.rolls : { ...DEFAULT_STATE.rolls };

  const voters = Array.isArray(incoming.voters) ? incoming.voters : DEFAULT_STATE.voters;
  const presenters = Array.isArray(incoming.presenters) ? incoming.presenters : DEFAULT_STATE.presenters;
  const merged = [];
  const seen = new Set();

  [...voters, ...presenters].forEach((name) => {
    const key = normalizeName(name);
    if (!key || seen.has(key)) return;
    seen.add(key);
    merged.push(String(name).trim());
  });

  return {
    ...cloneState(DEFAULT_STATE),
    ...incoming,
    voters: merged,
    presenters: merged,
    rolls,
    votes: incoming.votes && typeof incoming.votes === 'object' ? incoming.votes : {},
    meetingOpen: typeof incoming.meetingOpen === 'boolean' ? incoming.meetingOpen : true,
  };
}

// In-memory store for Vercel serverless
let memoryStore = cloneState(DEFAULT_STATE);

// File store path — /tmp is the only writable folder on Vercel
const DATA_FILE = path.join('/tmp', 'pitchvote-data.json');

function readData() {
  if (IS_VERCEL) {
    return syncRoster(cloneState(memoryStore));
  }
  try {
    if (fs.existsSync(DATA_FILE)) {
      return syncRoster(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')));
    }
  } catch (e) {}
  return cloneState(DEFAULT_STATE);
}

function writeData(data) {
  const normalized = syncRoster(data);
  if (IS_VERCEL) {
    memoryStore = cloneState(normalized);
    return;
  }
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(normalized, null, 2), 'utf8');
  } catch (e) {
    console.error('Write error', e);
  }
}

export function getData() { return readData(); }
export function saveData(data) { writeData(data); }

export function castVote(presenterName, voterName, score) {
  const data = readData();
  if (!data.votes[presenterName]) data.votes[presenterName] = {};
  data.votes[presenterName][voterName] = score;
  writeData(data);
  return data;
}

export function getVoteCount(data, voterName) {
  return Object.values(data.votes).filter(v => v[voterName] !== undefined).length;
}

export function getPresenterStats(data) {
  return data.presenters.map((name) => {
    const votes = data.votes[name] ? Object.entries(data.votes[name]) : [];
    const scores = votes.map(([, s]) => s);
    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    return { name, votes, avg, rank: 0 };
  }).sort((a, b) => (b.avg || 0) - (a.avg || 0))
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

export function getRollForName(data, name) {
  const rolls = (data && data.rolls) || {};
  const targetExact = normalizeName(name);
  const targetLoose = normalizeLoose(name);

  const exact = Object.entries(rolls).find(([, n]) => normalizeName(n) === targetExact);
  if (exact) return exact[0];

  const loose = Object.entries(rolls).find(([, n]) => {
    const nLoose = normalizeLoose(n);
    return nLoose === targetLoose || nLoose.startsWith(targetLoose) || targetLoose.startsWith(nLoose);
  });

  return loose ? loose[0] : null;
}

export function getPresentersWithRoll(data) {
  const rolls = (data && data.rolls) || {};
  return (Array.isArray(data.presenters) ? data.presenters : []).map((name) => {
    const entry = Object.entries(rolls).find(([, n]) => normalizeName(n) === normalizeName(name));
    return entry ? `${entry[0]} — ${name}` : `— — ${name}`;
  });
}

export function getMaxVotesPerVoter(data) {
  return Math.max(0, (Array.isArray(data?.presenters) ? data.presenters.length : 0) - 1);
}
