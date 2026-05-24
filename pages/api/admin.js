// pages/api/admin.js
import { getData, saveData } from '../../lib/store';
import { getSession } from '../../lib/auth';

export default function handler(req, res) {
  const session = getSession(req);
  if (!session || session.role !== 'host') return res.status(401).json({ error: 'Host only' });

  const data = getData();

  function removePerson(name) {
    data.voters = data.voters.filter(v => v !== name);
    data.presenters = data.presenters.filter(p => p !== name);
    delete data.votes[name];
    Object.keys(data.votes).forEach(p => { delete data.votes[p][name]; });
  }

  if (req.method === 'POST') {
    const { action, value } = req.body;

    if (action === 'addPresenter') {
      const name = (value || '').trim();
      if (!name) return res.status(400).json({ error: 'Name required' });
      if (data.presenters.includes(name)) return res.status(400).json({ error: 'Already exists' });
      data.presenters.push(name);
      if (!data.voters.includes(name)) data.voters.push(name);
      saveData(data);
      return res.json({ ok: true, presenters: data.presenters });
    }

    if (action === 'removePresenter') {
      removePerson(value);
      saveData(data);
      return res.json({ ok: true });
    }

    if (action === 'addVoter') {
      const name = (value || '').trim();
      if (!name) return res.status(400).json({ error: 'Name required' });
      if (data.voters.includes(name)) return res.status(400).json({ error: 'Already exists' });
      data.voters.push(name);
      if (!data.presenters.includes(name)) data.presenters.push(name);
      saveData(data);
      return res.json({ ok: true, voters: data.voters });
    }

    if (action === 'removeVoter') {
      removePerson(value);
      saveData(data);
      return res.json({ ok: true });
    }

    if (action === 'toggleMeeting') {
      data.meetingOpen = !data.meetingOpen;
      saveData(data);
      return res.json({ ok: true, meetingOpen: data.meetingOpen });
    }

    if (action === 'resetVotes') {
      data.votes = {};
      saveData(data);
      return res.json({ ok: true });
    }
  }

  res.status(405).end();
}
