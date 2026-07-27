import { connectDB, Registration } from '@/lib/db';
import { isAuthed } from '@/lib/auth';
import { buildQuery } from '../list/route';

export const dynamic = 'force-dynamic';

const cell = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const ist = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) : '';

export async function GET(req) {
  if (!isAuthed()) return new Response('Not signed in', { status: 401 });

  try {
    await connectDB();
    const rows = await Registration.find(buildQuery(req.nextUrl.searchParams))
      .sort({ createdAt: -1 })
      .lean();

    const header = [
      'Ticket code', 'Person', 'Name', 'Mobile', 'Age', 'Currently', 'College / Company', 'Year',
      'Ticket', 'Admits', 'Amount (Rs)', 'Status', 'Payment ID', 'Method', 'Booked at (IST)',
      'Paid at (IST)', 'Arrived at (IST)',
    ];

    // One line per attendee, so the total line count is the headcount for the feast.
    const lines = [header.join(',')];
    for (const r of rows) {
      const shared = [
        r.ticketType === 'duo' ? 'Duo' : 'Single',
        r.heads,
        (r.amount / 100).toFixed(0),
        r.status,
        r.razorpayPaymentId || '',
        r.paymentMethod || '',
        ist(r.createdAt),
        ist(r.paidAt),
        ist(r.checkedInAt),
      ];
      lines.push(
        [r.ticketCode || '', '1', r.name, r.phone, r.age, r.occupation,
         r.occupation === 'student' ? r.college : r.company, r.year || '', ...shared].map(cell).join(',')
      );
      if (r.friend?.name) {
        lines.push(
          [r.ticketCode || '', '2', r.friend.name, r.friend.phone, r.friend.age ?? '',
           r.friend.occupation, r.friend.occupation === 'student' ? r.friend.college : r.friend.company,
           r.friend.year || '', ...shared].map(cell).join(',')
        );
      }
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
