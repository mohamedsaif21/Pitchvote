// pages/api/login.js
import { getData, findVoterByRoll } from '../../lib/store';
import { setSessionCookie, HOST_PASSWORD } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { password, roll } = req.body;

  // Host login (password provided)
  if (password !== undefined) {
    if (password === HOST_PASSWORD) {
      setSessionCookie(res, { role: 'host', name: 'Host' });
      return res.json({ ok: true, role: 'host' });
    }
    return res.status(401).json({ error: 'Wrong password' });
  }

  // Voter login — roll-based login (roll required)
  if (roll !== undefined) {
    const data = await getData();
    const voterInfo = findVoterByRoll(data, roll);
    if (!voterInfo) return res.status(401).json({ error: 'Roll number not recognized' });
    
    const voterName = voterInfo.member.name;
    const normalizedRoll = String(voterInfo.member.roll).trim();
    
    setSessionCookie(res, { role: 'voter', name: voterName, roll: normalizedRoll });
    return res.json({ ok: true, role: 'voter', name: voterName, roll: normalizedRoll });
  }

  return res.status(400).json({ error: 'Missing roll number or password' });
}
