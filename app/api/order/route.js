import { NextResponse } from 'next/server';
import { connectDB, Registration } from '@/lib/db';
import { razorpay, validate, FEE_PAISE } from '@/lib/util';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const { ok, errors, data } = validate(body);
    if (!ok) return NextResponse.json({ errors }, { status: 400 });

    await connectDB();

    const reg = await Registration.create({ ...data, amount: FEE_PAISE, status: 'created' });

    const order = await razorpay().orders.create({
      amount: FEE_PAISE,
      currency: 'INR',
      receipt: String(reg._id),
      notes: {
        registrationId: String(reg._id),
        name: data.name,
        phone: data.phone,
        occupation: data.occupation,
        event: 'Friendship Day',
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
