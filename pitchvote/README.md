# PitchVote — Product Pitch Scoring System

A full-stack voting app for your product pitch meetings.

## Quick Start (Local)

```bash
npm install
npm run dev
```
Open http://localhost:3000

## Default Credentials

- **Host password:** `host1234`
- **Voters:** Ram, Sita, Arjun, Preethi, Vikram, Anita, Suresh, Kavya, Mohan, Divya, Rajan, Nisha, Sundar, Lakshmi, Gopal

## Deploy to Vercel

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Add these Environment Variables in Vercel:
   - `HOST_PASSWORD` → your secret host password
   - `JWT_SECRET` → any random string (e.g. `myrandomsecret123`)
4. Click Deploy

> **Note:** Vercel's filesystem is read-only in production. For persistent votes across deployments, add a Vercel KV store (free tier available) or use any external database. For a one-day meeting, the in-memory file approach works fine on a single serverless instance.

## How it Works

### For Voters
1. Open the deployed URL
2. Enter your name on the login screen
3. See the list of presenters
4. Tap a presenter → rate with stars (1–5)
5. You have 5 votes total to use across any presenters
6. You can only see your own votes

### For Host (You)
1. Click "Host Login" and enter the host password
2. See the **Results** tab — all presenters ranked by average score
3. Click any presenter to see exactly who gave what score
4. See the **Voter Tracker** tab — full grid of who voted for whom
5. Use the **Manage** tab to add/remove presenters and voters
6. Toggle the meeting open/closed
7. Reset all votes if needed

## Customization

Edit `lib/store.js` to change the default voter list and presenter list.
Change `HOST_PASSWORD` via environment variable.
