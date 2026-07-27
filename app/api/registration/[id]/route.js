import { NextResponse } from 'next/server';
import { connectDB, Registration } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  try {
    await connectDB();
    const reg = await Registration.findById(params.id).catch(() => null);
    if (!reg) return NextResponse.json({ message: 'Registration not found' }, { status: 404 });

    return NextResponse.json({
      name: reg.name,
      phone: reg.phone.replace(/^(\d{2})\d{4}(\d{4})$/, '$1••••$2'),
      occupation: reg.occupation,
      company: reg.company,
      college: reg.college,
      year: reg.year,
      amount: reg.amount,
      status: reg.status,
      ticketCode: reg.ticketCode || '',
    });
  } catch (err) {
    console.error('registration fetch error', err);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
