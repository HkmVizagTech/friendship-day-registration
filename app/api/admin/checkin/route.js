import { NextResponse } from 'next/server';
import { connectDB, Registration } from '@/lib/db';
import { isAuthed } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!isAuthed()) return NextResponse.json({ message: 'Not signed in' }, { status: 401 });

  try {
    const { code, undo } = await req.json().catch(() => ({}));
    const clean = String(code || '').trim().toUpperCase();
    if (!clean) return NextResponse.json({ message: 'Enter a code' }, { status: 400 });

    await connectDB();
    const reg = await Registration.findOne({ ticketCode: clean });
    if (!reg) return NextResponse.json({ message: `No pass found for ${clean}` }, { status: 404 });

    if (reg.status !== 'paid') {
      return NextResponse.json({ message: 'This pass is not paid. Send them to the desk.' }, { status: 409 });
    }

    const already = Boolean(reg.checkedInAt);

    if (undo) {
      reg.checkedInAt = undefined;
      await reg.save();
    } else if (!already) {
      reg.checkedInAt = new Date();
      await reg.save();
    }

    return NextResponse.json({
      ok: true,
      already: already && !undo,
      undone: Boolean(undo),
      pass: {
        code: reg.ticketCode,
        heads: reg.heads,
        name: reg.name,
        friendName: reg.friend?.name || '',
        checkedInAt: reg.checkedInAt || null,
      },
    });
  } catch (err) {
    console.error('checkin error', err);
    return NextResponse.json({ message: 'Check-in failed' }, { status: 500 });
  }
}
