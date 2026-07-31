import { NextResponse } from 'next/server';
import { connectDB, Registration } from '@/lib/db';
import { validate, ticketCode } from '@/lib/util';

export const dynamic = 'force-dynamic';

// Free event: registration is complete the moment validation passes.
// No payment gateway, no order, no webhook — just save and hand back a code.
export async function POST(req) {
  try {
    const body = await req.json();
    const { ok, errors, data } = validate(body);
    if (!ok) return NextResponse.json({ errors }, { status: 400 });

    await connectDB();

    // Belt-and-braces: a duo pass's own two phone numbers can't collide with
    // each other (checked in validate()), but two separate submissions with
    // the exact same phone racing each other is still possible in theory.
    // Not worth blocking on for a free RSVP — duplicates just mean two rows
    // for the same person, which the gate/admin search will surface anyway.
    const reg = await Registration.create({
      ...data,
      ticketCode: ticketCode(),
    });

    return NextResponse.json({
      registrationId: String(reg._id),
    });
  } catch (err) {
    console.error('register error', err);
    return NextResponse.json({ message: 'Could not complete registration. Try again.' }, { status: 500 });
  }
}
