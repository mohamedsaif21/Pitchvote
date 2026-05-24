// lib/store.js
import fs from 'fs';
import path from 'path';

const IS_VERCEL = process.env.VERCEL === '1';

const DEFAULT_STATE = {
  voters: [
    "Ram","Sita","Arjun","Preethi","Vikram",
    "Anita","Suresh","Kavya","Mohan","Divya",
    "Rajan","Nisha","Sundar","Lakshmi","Gopal"
  ],
  presenters: ["Arun","Priya","Karthik","Deepa","Meena"],
  votes: {},
  meetingOpen: true,
};

// In-memory store for Vercel serverless
let memoryStore = JSON.parse(JSON.stringify(DEFAULT_STATE));

// File store path — /tmp is the only writable folder on Vercel
const DATA_FILE = path.join('/tmp', 'pitchvote-data.json');

function readData() {
  if (IS_VERCEL) {
    return JSON.parse(JSON.stringify(memoryStore));
  }
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function writeData(data) {
  if (IS_VERCEL) {
    memoryStore = JSON.parse(JSON.stringify(data));
    return;
  }
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
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

// No roll support in this simpler store; keep compatibility helpers
export function getRollForName(/* data, name */) {
  return null;
}

export function getPresentersWithRoll(data) {
  return (Array.isArray(data.presenters) ? data.presenters : []).map(name => `— — ${name}`);
}

export function getMaxVotesPerVoter(data) {
  return Math.max(0, (Array.isArray(data?.presenters) ? data.presenters.length : 0) - 1);
}
