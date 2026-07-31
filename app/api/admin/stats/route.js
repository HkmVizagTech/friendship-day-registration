import { NextResponse } from 'next/server';
import { connectDB, Registration } from '@/lib/db';
import { isAuthed } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ message: 'Not signed in' }, { status: 401 });

  try {
    await connectDB();

    const [agg] = await Registration.aggregate([
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                bookings: { $sum: 1 },
                heads: { $sum: '$heads' },
                arrived: { $sum: { $cond: [{ $ifNull: ['$checkedInAt', false] }, '$heads', 0] } },
              },
            },
          ],
          byTier: [{ $group: { _id: '$ticketType', n: { $sum: 1 } } }],
          byOccupation: [{ $group: { _id: '$occupation', n: { $sum: 1 } } }],
          byPreacher: [
            {
              $project: {
                preachers: {
                  $filter: {
                    input: ['$preacher', '$friend.preacher'],
                    as: 'p',
                    cond: { $ne: ['$$p', null] },
                  },
                },
              },
            },
            { $unwind: '$preachers' },
            { $group: { _id: '$preachers', n: { $sum: 1 } } },
            { $sort: { n: -1 } },
          ],
          colleges: [
            { $match: { occupation: 'student' } },
            { $group: { _id: '$college', n: { $sum: 1 } } },
            { $sort: { n: -1 } },
            { $limit: 8 },
          ],
          daily: [
            {
              $group: {
                _id: { $dateToString: { format: '%d %b', date: '$createdAt', timezone: 'Asia/Kolkata' } },
                heads: { $sum: '$heads' },
                at: { $min: '$createdAt' },
              },
            },
            { $sort: { at: 1 } },
            { $limit: 30 },
          ],
        },
      },
    ]);

    const t = agg.totals[0] || { bookings: 0, heads: 0, arrived: 0 };
    const asMap = (rows) => Object.fromEntries(rows.map((r) => [r._id || 'unknown', r.n]));

    return NextResponse.json({
      bookings: t.bookings,
      heads: t.heads,
      arrived: t.arrived,
      byTier: asMap(agg.byTier),
      byOccupation: asMap(agg.byOccupation),
      preachers: agg.byPreacher.map((p) => ({ name: p._id || 'Not given', n: p.n })),
      colleges: agg.colleges.map((c) => ({ name: c._id || 'Not given', n: c.n })),
      daily: agg.daily.map((d) => ({ day: d._id, heads: d.heads })),
    });
  } catch (err) {
    console.error('stats error', err);
    return NextResponse.json({ message: 'Could not load stats' }, { status: 500 });
  }
}
