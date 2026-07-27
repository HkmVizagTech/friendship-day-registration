import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { connectDB, Registration } from '@/lib/db';
import { ticketCode } from '@/lib/util';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ message: 'Missing payment details' }, { status: 400 });
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return NextResponse.json({ message: 'Payment signature did not match' }, { status: 400 });
    }

    await connectDB();
    const reg = await Registration.findOne({ razorpayOrderId: razorpay_order_id });
    if (!reg) return NextResponse.json({ message: 'Registration not found' }, { status: 404 });

    if (reg.status !== 'paid') {
      reg.status = 'paid';
      reg.razorpayPaymentId = razorpay_payment_id;
      reg.paidAt = new Date();
      if (!reg.ticketCode) reg.ticketCode = ticketCode();
      await reg.save();
    }

    return NextResponse.json({ registrationId: String(reg._id), ticketCode: reg.ticketCode });
  } catch (err) {
    console.error('verify error', err);
    return NextResponse.json({ message: 'Could not verify the payment' }, { status: 500 });
  }
}
