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
                registrations: { $sum: 1 },
                arrived: { $sum: { $cond: [{ $ifNull: ['$checkedInAt', false] }, 1, 0] } },
              },
            },
          ],
          byOccupation: [{ $group: { _id: '$occupation', n: { $sum: 1 } } }],
          byPreacher: [
            { $group: { _id: '$preacher', n: { $sum: 1 } } },
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
                n: { $sum: 1 },
                at: { $min: '$createdAt' },
              },
            },
            { $sort: { at: 1 } },
            { $limit: 30 },
          ],
        },
      },
    ]);

    const t = agg.totals[0] || { registrations: 0, arrived: 0 };

    return NextResponse.json({
      registrations: t.registrations,
      arrived: t.arrived,
      byOccupation: Object.fromEntries(agg.byOccupation.map((r) => [r._id || 'unknown', r.n])),
      preachers: agg.byPreacher.map((p) => ({ name: p._id || 'Not given', n: p.n })),
      colleges: agg.colleges.map((c) => ({ name: c._id || 'Not given', n: c.n })),
      daily: agg.daily.map((d) => ({ day: d._id, n: d.n })),
    });
  } catch (err) {
    console.error('stats error', err);
    return NextResponse.json({ message: 'Could not load stats' }, { status: 500 });
  }
}
