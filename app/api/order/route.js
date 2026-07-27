import { NextResponse } from 'next/server';
import { connectDB, Registration } from '@/lib/db';
import { razorpay, validate } from '@/lib/util';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const { ok, errors, tier, data } = validate(body);
    if (!ok) return NextResponse.json({ errors }, { status: 400 });

    await connectDB();

    // Amount always comes from the server-side tier table, never from the client.
    const reg = await Registration.create({ ...data, amount: tier.amount, status: 'created' });

    const order = await razorpay().orders.create({
      amount: tier.amount,
      currency: 'INR',
      receipt: String(reg._id),
      notes: {
        registrationId: String(reg._id),
        name: data.name,
        phone: data.phone,
        ticketType: data.ticketType,
        heads: String(data.heads),
        event: 'Friendship Unlimited 2026',
      },
    });

    reg.razorpayOrderId = order.id;
    await reg.save();

    return NextResponse.json({
      registrationId: String(reg._id),
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      name: data.name,
      phone: data.phone,
    });
  } catch (err) {
    console.error('order error', err);
    return NextResponse.json({ message: 'Could not start the payment. Try again.' }, { status: 500 });
  }
}
