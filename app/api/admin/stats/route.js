import { NextResponse } from 'next/server';
import { connectDB, Registration } from '@/lib/db';
import { isAuthed } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ message: 'Not signed in' }, { status: 401 });

  try {
    await connectDB();
    const paid = { status: 'paid' };

    const [agg] = await Registration.aggregate([
      {
        $facet: {
          totals: [
            { $match: paid },
            {
              $group: {
                _id: null,
                bookings: { $sum: 1 },
                heads: { $sum: '$heads' },
                revenue: { $sum: '$amount' },
                arrived: { $sum: { $cond: [{ $ifNull: ['$checkedInAt', false] }, '$heads', 0] } },
              },
            },
          ],
          byStatus: [{ $group: { _id: '$status', n: { $sum: 1 } } }],
          byTier: [{ $match: paid }, { $group: { _id: '$ticketType', n: { $sum: 1 } } }],
          byOccupation: [{ $match: paid }, { $group: { _id: '$occupation', n: { $sum: 1 } } }],
          colleges: [
            { $match: { status: 'paid', occupation: 'student' } },
            { $group: { _id: '$college', n: { $sum: 1 } } },
            { $sort: { n: -1 } },
            { $limit: 8 },
          ],
          daily: [
            { $match: paid },
            {
              $group: {
                _id: { $dateToString: { format: '%d %b', date: '$paidAt', timezone: 'Asia/Kolkata' } },
                heads: { $sum: '$heads' },
                at: { $min: '$paidAt' },
              },
            },
            { $sort: { at: 1 } },
            { $limit: 30 },
          ],
        },
      },
    ]);

    const t = agg.totals[0] || { bookings: 0, heads: 0, revenue: 0, arrived: 0 };
    const asMap = (rows) => Object.fromEntries(rows.map((r) => [r._id || 'unknown', r.n]));

    return NextResponse.json({
      bookings: t.bookings,
      heads: t.heads,
      revenue: t.revenue,
      arrived: t.arrived,
      byStatus: asMap(agg.byStatus),
      byTier: asMap(agg.byTier),
      byOccupation: asMap(agg.byOccupation),
      colleges: agg.colleges.map((c) => ({ name: c._id || 'Not given', n: c.n })),
      daily: agg.daily.map((d) => ({ day: d._id, heads: d.heads })),
    });
  } catch (err) {
    console.error('stats error', err);
    return NextResponse.json({ message: 'Could not load stats' }, { status: 500 });
  }
}
