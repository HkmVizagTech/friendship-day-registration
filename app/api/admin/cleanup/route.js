import { NextResponse } from 'next/server';
import { connectDB, Registration } from '@/lib/db';
import { isAuthed } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Midnight today in IST, expressed as a UTC Date — since everything is
// stored in UTC but "today" means the Indian calendar day to everyone
// using this dashboard.
function startOfTodayIST() {
  const now = new Date();
  // IST is UTC+5:30 with no DST, so this offset math is safe year-round.
  const istNow = new Date(now.getTime() + 5.5 * 3600 * 1000);
  const y = istNow.getUTCFullYear();
  const m = istNow.getUTCMonth();
  const d = istNow.getUTCDate();
  const istMidnightAsUTC = Date.UTC(y, m, d, 0, 0, 0) - 5.5 * 3600 * 1000;
  return new Date(istMidnightAsUTC);
}

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ message: 'Not signed in' }, { status: 401 });
  try {
    await connectDB();
    const cutoff = startOfTodayIST();
    const count = await Registration.countDocuments({ createdAt: { $lt: cutoff } });
    return NextResponse.json({ cutoff, wouldDelete: count });
  } catch (err) {
    console.error('cleanup preview error', err);
    return NextResponse.json({ message: 'Could not check' }, { status: 500 });
  }
}

export async function DELETE() {
  if (!(await isAuthed())) return NextResponse.json({ message: 'Not signed in' }, { status: 401 });
  try {
    await connectDB();
    const cutoff = startOfTodayIST();
    const res = await Registration.deleteMany({ createdAt: { $lt: cutoff } });
    return NextResponse.json({ deleted: res.deletedCount, cutoff });
  } catch (err) {
    console.error('cleanup error', err);
    return NextResponse.json({ message: 'Delete failed' }, { status: 500 });
  }
}
