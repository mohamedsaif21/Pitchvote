// lib/auth.js
import jwt from 'jsonwebtoken';
import { serialize, parse } from 'cookie';

const SECRET = process.env.JWT_SECRET || 'pitchvote-secret-2025';
const COOKIE = 'pv_session';

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '12h' });
}

export function verifyToken(token) {
  try { return jwt.verify(token, SECRET); } catch { return null; }
}

export function setSessionCookie(res, payload) {
  const token = signToken(payload);
  res.setHeader('Set-Cookie', serialize(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', path: '/',
    maxAge: 43200,
    secure: process.env.NODE_ENV === 'production',
  }));
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', serialize(COOKIE, '', { maxAge: -1, path: '/' }));
}

export function getSession(req) {
  const cookies = parse(req.headers.cookie || '');
  if (!cookies[COOKIE]) return null;
  return verifyToken(cookies[COOKIE]);
}

export const HOST_PASSWORD = process.env.HOST_PASSWORD || 'host1234';
