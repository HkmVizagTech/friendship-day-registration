import { NextResponse } from 'next/server';
import { connectDB, Registration } from '@/lib/db';
import { isAuthed } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function summarize(reg) {
  return {
    id: String(reg._id),
    code: reg.ticketCode,
    name: reg.name,
    checkedInAt: reg.checkedInAt || null,
  };
}

async function findByCode(clean) {
  return Registration.findOne({ ticketCode: clean });
}

async function findByPhone(digits) {
  return Registration.find({ phone: digits }).sort({ createdAt: -1 });
}

async function settle(reg, undo) {
  const already = Boolean(reg.checkedInAt);

  if (undo) {
    reg.checkedInAt = undefined;
    await reg.save();
  } else if (!already) {
    reg.checkedInAt = new Date();
    await reg.save();
  }

  return {
    ok: true,
    already: already && !undo,
    undone: Boolean(undo),
    pass: summarize(reg),
  };
}

export async function POST(req) {
  if (!(await isAuthed())) return NextResponse.json({ message: 'Not signed in' }, { status: 401 });

  try {
    const { query, id, undo } = await req.json().catch(() => ({}));
    await connectDB();

    // A tap on one of the disambiguation choices sends the exact registration id.
    if (id) {
      const reg = await Registration.findById(id);
      if (!reg) return NextResponse.json({ message: 'That pass could not be found' }, { status: 404 });
      return NextResponse.json(await settle(reg, undo));
    }

    const raw = String(query || '').trim();
    if (!raw) return NextResponse.json({ message: 'Enter a code or phone number' }, { status: 400 });

    const digits = raw.replace(/\D/g, '');
    const isPhone = digits.length === 10 && /^[6-9]/.test(digits);

    if (isPhone) {
      const matches = await findByPhone(digits);
      if (!matches.length) {
        return NextResponse.json({ message: `No registration found for ${digits}` }, { status: 404 });
      }
      if (matches.length > 1) {
        return NextResponse.json({ multiple: true, choices: matches.map(summarize) });
      }
      return NextResponse.json(await settle(matches[0], undo));
    }

    const clean = raw.toUpperCase();
    const reg = await findByCode(clean);
    if (!reg) return NextResponse.json({ message: `No pass found for ${clean}` }, { status: 404 });
    return NextResponse.json(await settle(reg, undo));
  } catch (err) {
    console.error('checkin error', err);
    return NextResponse.json({ message: 'Check-in failed' }, { status: 500 });
  }
}
