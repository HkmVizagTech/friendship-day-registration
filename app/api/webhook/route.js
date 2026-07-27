import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { connectDB, Registration } from '@/lib/db';
import { ticketCode } from '@/lib/util';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req) {
  // Raw body is required for the signature check - do not parse before verifying.
  const raw = await req.text();
  const signature = req.headers.get('x-razorpay-signature') || '';
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.error('webhook: RAZORPAY_WEBHOOK_SECRET is not set');
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ ok: false, message: 'Invalid signature' }, { status: 400 });
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const event = payload.event;
    const payment = payload?.payload?.payment?.entity;
    const orderEntity = payload?.payload?.order?.entity;

    const orderId = payment?.order_id || orderEntity?.id || null;
    const notesRegId = payment?.notes?.registrationId || orderEntity?.notes?.registrationId || null;

    await connectDB();

    // Guard: never fall back to a loose query. A null order_id must not match a document.
    let reg = null;
    if (orderId) reg = await Registration.findOne({ razorpayOrderId: orderId });
    if (!reg && notesRegId) reg = await Registration.findById(notesRegId).catch(() => null);

    if (!reg) {
      console.warn('webhook: no registration matched', { event, orderId, notesRegId });
      return NextResponse.json({ ok: true, matched: false });
    }

    if (event === 'payment.captured' || event === 'order.paid') {
      if (reg.status !== 'paid') {
        reg.status = 'paid';
        reg.razorpayPaymentId = payment?.id || reg.razorpayPaymentId;
        reg.paymentMethod = payment?.method || reg.paymentMethod;
        reg.paidAt = new Date();
        if (!reg.ticketCode) reg.ticketCode = ticketCode();
        await reg.save();
      }
    } else if (event === 'payment.failed') {
      if (reg.status === 'created') {
        reg.status = 'failed';
        reg.razorpayPaymentId = payment?.id || '';
        reg.failureReason = payment?.error_description || 'Payment failed';
        await reg.save();
      }
    }

    return NextResponse.json({ ok: true, matched: true });
  } catch (err) {
    console.error('webhook error', err);
    // 500 tells Razorpay to retry.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
