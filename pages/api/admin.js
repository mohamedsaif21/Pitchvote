// pages/api/admin.js
import { getData, saveData } from '../../lib/store';
import { getSession } from '../../lib/auth';

export default function handler(req, res) {
  const session = getSession(req);
  if (!session || session.role !== 'host') return res.status(401).json({ error: 'Host only' });

  const data = getData();

  if (req.method === 'POST') {
    const { action } = req.body;

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
