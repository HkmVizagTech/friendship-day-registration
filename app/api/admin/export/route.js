import { connectDB, Registration } from '@/lib/db';
import { isAuthed } from '@/lib/auth';
import { buildQuery } from '../list/route';

export const dynamic = 'force-dynamic';

const cell = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /["\n,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const ist = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) : '';

export async function GET(req) {
  if (!(await isAuthed())) return new Response('Not signed in', { status: 401 });

  try {
    await connectDB();
    const rows = await Registration.find(buildQuery(req.nextUrl.searchParams))
      .sort({ createdAt: -1 })
      .lean();

    const header = [
      'Ticket code', 'Name', 'Mobile', 'Age', 'Currently', 'College / Company', 'Year',
      'Preacher', 'Registered at (IST)', 'Arrived at (IST)',
    ];

    const lines = [header.join(',')];
    for (const r of rows) {
      lines.push(
        [
          r.ticketCode || '',
          r.name,
          r.phone,
          r.age,
          r.occupation,
          r.occupation === 'student' ? r.college : r.company,
          r.year || '',
          r.preacher || '',
          ist(r.createdAt),
          ist(r.checkedInAt),
        ].map(cell).join(',')
      );
    }

    const stamp = new Date().toISOString().slice(0, 10);
    return new Response('\uFEFF' + lines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="friendship-unlimited-${stamp}.csv"`,
      },
    });
  } catch (err) {
    console.error('export error', err);
    return new Response('Export failed', { status: 500 });
  }
}
