// lib/store.js
// Works locally (JSON file) and on Vercel (KV or file fallback)
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), '.pitchvote-data.json');

const DEFAULT_PEOPLE = [
  'Akhilan B',
  'Jeevanandan K ',
  'James Aathithyan ',
  'Diya angelin s.p ',
  'Surya Y ',
  'D Dinesh',
  'Ram Kishore',
  'THAMIL SELVAN P',
  'Aadharsh K ',
  'Bindhiya ',
  'Tamil vanan k',
  'Vijaya Varma R',
  'Srikanth M ',
  'Krishna Moorthi'
];

const DEFAULT_STATE = {
  voters: [...DEFAULT_PEOPLE],
  presenters: [...DEFAULT_PEOPLE],
  // roll -> name mapping (string keys)
  rolls: {
    '712523205004': 'Akhilan B',
    '712523205027': 'Jeevanandan K ',
    '712523205026': 'James Aathithyan ',
    '712523205021': 'Diya angelin s.p ',
    '712523295062': 'Surya Y ',
    '712523205701': 'D Dinesh',
    '712523205047': 'Ram Kishore',
    '712523205065': 'THAMIL SELVAN P',
    '712523205001': 'Aadharsh K ',
    '712523205014': 'Bindhiya ',
    '712523205064': 'Tamil vanan k',
    '712523205070': 'Vijaya Varma R',
    '712523205056': 'Srikanth M ',
    '712523205033': 'Krishna Moorthi'
  },
  votes: {},      // { presenterName: { voterName: score } }
  meetingOpen: true,
};

function cloneDefaultState() {
  return {
    voters: [...DEFAULT_STATE.voters],
    presenters: [...DEFAULT_STATE.presenters],
    votes: {},
    meetingOpen: true,
  };
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeLoose(value) {
  return normalizeName(value).replace(/[^a-z0-9]/g, '');
}

function getCanonicalNameForRoll(data, name) {
  const roll = getRollForName(data, name);
  const rolls = (data && data.rolls) || {};
  return roll ? rolls[roll] : String(name || '').trim();
}

function syncRoster(data) {
  const voters = Array.isArray(data?.voters) ? data.voters : [];
  const presenters = Array.isArray(data?.presenters) ? data.presenters : [];
  const merged = [];
  const seen = new Set();

  [...voters, ...presenters].forEach(name => {
    const label = getCanonicalNameForRoll(data, typeof name === 'string' ? name : String(name || ''));
    const key = normalizeName(label);
    if (!key || seen.has(key)) return;
    seen.add(key);
    merged.push(label);
  });

  return {
    ...cloneDefaultState(),
    ...data,
    voters: merged,
    presenters: merged,
    votes: data?.votes && typeof data.votes === 'object' ? data.votes : {},
    meetingOpen: typeof data?.meetingOpen === 'boolean' ? data.meetingOpen : true,
    rolls: data?.rolls && typeof data.rolls === 'object' ? data.rolls : { ...DEFAULT_STATE.rolls },
  };
}

export function getPresentersWithRoll(data) {
  const rolls = (data && data.rolls) || {};
  return (Array.isArray(data.presenters) ? data.presenters : []).map(name => {
    // find roll for name (first match)
    const entry = Object.entries(rolls).find(([, n]) => String(n).trim().toLowerCase() === String(name).trim().toLowerCase());
    return entry ? `${entry[0]} — ${name}` : `— — ${name}`;
  });
}

export function getRollForName(data, name) {
  const rolls = (data && data.rolls) || {};
  const targetExact = normalizeName(name);
  const targetLoose = normalizeLoose(name);

  // Exact normalized match first
  const exact = Object.entries(rolls).find(([, n]) => normalizeName(n) === targetExact);
  if (exact) return exact[0];

  // Loose fallback for small naming variants (e.g., Akhilan vs Akhilan B)
  const loose = Object.entries(rolls).find(([, n]) => {
    const nLoose = normalizeLoose(n);
    return nLoose === targetLoose || nLoose.startsWith(targetLoose) || targetLoose.startsWith(nLoose);
  });

  return loose ? loose[0] : null;
}

function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return syncRoster(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')));
    }
  } catch (e) {}
  return cloneDefaultState();
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(syncRoster(data), null, 2), 'utf8');
  } catch (e) {
    console.error('Write error', e);
  }
}

export function getData() {
  return readData();
}

export function saveData(data) {
  writeData(data);
}

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

export function getMaxVotesPerVoter(data) {
  return Math.max(0, (Array.isArray(data?.presenters) ? data.presenters.length : 0) - 1);
}

export function getPresenterStats(data) {
  return data.presenters.map((name, i) => {
    const votes = data.votes[name] ? Object.entries(data.votes[name]) : [];
    const scores = votes.map(([, s]) => s);
    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    return { name, votes, avg, rank: 0 };
  }).sort((a, b) => (b.avg || 0) - (a.avg || 0))
    .map((p, i) => ({ ...p, rank: i + 1 }));
}
