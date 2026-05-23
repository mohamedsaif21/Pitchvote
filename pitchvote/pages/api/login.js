// pages/api/login.js
import { getData } from '../../lib/store';
import { setSessionCookie, HOST_PASSWORD } from '../../lib/auth';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { name, password, roll } = req.body;

  // Host login (password provided)
  if (password !== undefined) {
    if (password === HOST_PASSWORD) {
      setSessionCookie(res, { role: 'host', name: 'Host' });
      return res.json({ ok: true, role: 'host' });
    }
    return res.status(401).json({ error: 'Wrong password' });
  }

  // Voter login — prefer roll-based login (roll required)
  const data = getData();
  if (roll) {
    const normalizedRoll = String(roll).trim();
    const voterName = data.rolls && data.rolls[normalizedRoll];
    if (!voterName) return res.status(401).json({ error: 'Roll number not recognized' });
    setSessionCookie(res, { role: 'voter', name: voterName, roll: normalizedRoll });
    return res.json({ ok: true, role: 'voter', name: voterName, roll: normalizedRoll });
  }

  // Backwards-compatible name login
  if (name) {
    const voter = data.voters.find(v => v.toLowerCase() === (name || '').toLowerCase().trim());
    if (!voter) return res.status(401).json({ error: 'Name not on voter list' });
    // try to find roll
    const entry = Object.entries(data.rolls || {}).find(([, n]) => String(n).trim().toLowerCase() === String(voter).trim().toLowerCase());
    const rollFound = entry ? entry[0] : undefined;
    setSessionCookie(res, { role: 'voter', name: voter, roll: rollFound });
    return res.json({ ok: true, role: 'voter', name: voter, roll: rollFound });
  }

  return res.status(400).json({ error: 'Missing roll or name' });
}
