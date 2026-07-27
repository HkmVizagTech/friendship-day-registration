import { NextResponse } from 'next/server';
import { checkPassword, issueSession, tooManyAttempts, noteAttempt } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (tooManyAttempts(ip)) {
    return NextResponse.json({ message: 'Too many attempts. Wait 10 minutes.' }, { status: 429 });
  }
  const { password } = await req.json().catch(() => ({}));
  const ok = checkPassword(password);
  noteAttempt(ip, ok);
  if (!ok) return NextResponse.json({ message: 'Wrong password' }, { status: 401 });
  issueSession();
  return NextResponse.json({ ok: true });
}
