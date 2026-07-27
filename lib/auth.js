import crypto from 'crypto';
import { cookies } from 'next/headers';

const COOKIE = 'fu_admin';
const TTL_HOURS = 12;

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!s) throw new Error('ADMIN_PASSWORD is not set');
  return s;
}

function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('hex');
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function checkPassword(input) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(input || '', expected);
}

export async function issueSession() {
  const exp = String(Date.now() + TTL_HOURS * 3600 * 1000);
  const token = `${exp}.${sign(exp)}`;
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TTL_HOURS * 3600,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export async function isAuthed() {
  try {
    const store = await cookies();
    const raw = store.get(COOKIE)?.value;
    if (!raw) return false;
    const [exp, mac] = raw.split('.');
    if (!exp || !mac) return false;
    if (Number(exp) < Date.now()) return false;
    return safeEqual(mac, sign(exp));
  } catch {
    return false;
  }
}

// Very small brute-force damper. Per-instance only, but it costs nothing.
const attempts = new Map();
export function tooManyAttempts(ip) {
  const now = Date.now();
  const rec = attempts.get(ip) || { n: 0, until: 0 };
  if (rec.until > now) return true;
  return rec.n >= 8;
}
export function noteAttempt(ip, ok) {
  const now = Date.now();
  if (ok) return attempts.delete(ip);
  const rec = attempts.get(ip) || { n: 0, until: 0 };
  rec.n += 1;
  if (rec.n >= 8) rec.until = now + 10 * 60 * 1000;
  attempts.set(ip, rec);
}
