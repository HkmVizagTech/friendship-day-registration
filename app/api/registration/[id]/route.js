import { NextResponse } from 'next/server';
import { connectDB, Registration } from '@/lib/db';

export const dynamic = 'force-dynamic';

const mask = (p = '') => p.replace(/^(\d{2})\d{4}(\d{4})$/, '$1XXXX$2');

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    await connectDB();
    const reg = await Registration.findById(id).catch(() => null);
    if (!reg) return NextResponse.json({ message: 'Registration not found' }, { status: 404 });

    return NextResponse.json({
      name: reg.name,
      phone: mask(reg.phone),
      occupation: reg.occupation,
      company: reg.company,
      college: reg.college,
      year: reg.year,
      preacher: reg.preacher,
      ticketType: reg.ticketType,
      heads: reg.heads,
      friend: reg.friend
        ? {
            name: reg.friend.name,
            phone: mask(reg.friend.phone),
            occupation: reg.friend.occupation,
            company: reg.friend.company,
            college: reg.friend.college,
            year: reg.friend.year,
            preacher: reg.friend.preacher,
          }
        : null,
      ticketCode: reg.ticketCode || '',
    });
  } catch (err) {
    console.error('registration fetch error', err);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
