import { NextResponse } from 'next/server';
import { connectDB, Registration } from '@/lib/db';
import { isAuthed } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function buildQuery(sp) {
  const q = {};
  const occ = sp.get('occupation');
  const arrived = sp.get('arrived');
  const preacher = sp.get('preacher');
  const search = (sp.get('q') || '').trim();

  if (occ && occ !== 'all') q.occupation = occ;
  if (arrived === 'yes') q.checkedInAt = { $ne: null };
  if (arrived === 'no') q.checkedInAt = null;
  if (preacher && preacher !== 'all') q.preacher = preacher;

  if (search) {
    const rx = new RegExp(esc(search), 'i');
    q.$or = [{ name: rx }, { phone: rx }, { college: rx }, { company: rx }, { ticketCode: rx }];
  }
  return q;
}

export async function GET(req) {
  if (!(await isAuthed())) return NextResponse.json({ message: 'Not signed in' }, { status: 401 });

  try {
    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(sp.get('limit') || '25', 10)));
    const query = buildQuery(sp);

    await connectDB();
    const [rows, total] = await Promise.all([
      Registration.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Registration.countDocuments(query),
    ]);

    return NextResponse.json({
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
      rows: rows.map((r) => ({
        id: String(r._id),
        name: r.name,
        phone: r.phone,
        age: r.age,
        occupation: r.occupation,
        company: r.company,
        college: r.college,
        year: r.year,
        preacher: r.preacher,
        ticketCode: r.ticketCode,
        checkedInAt: r.checkedInAt || null,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error('list error', err);
    return NextResponse.json({ message: 'Could not load registrations' }, { status: 500 });
  }
}
