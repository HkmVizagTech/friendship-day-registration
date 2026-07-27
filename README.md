# Friendship Day 2026 — Registration

Next.js 14 (App Router) · MongoDB · Razorpay. Fee: ₹99 per person.

## Environment variables

Set these in Vercel → Project → Settings → Environment Variables (Production + Preview):

| Key | Notes |
| --- | --- |
| `MONGODB_URI` | Atlas connection string. Allow `0.0.0.0/0` in Network Access, or Vercel's egress IPs. |
| `RAZORPAY_KEY_ID` | Live or test key id. |
| `RAZORPAY_KEY_SECRET` | Never exposed to the browser. |
| `RAZORPAY_WEBHOOK_SECRET` | Whatever you type into the Razorpay webhook form. |

Redeploy after adding them — Next.js bakes env vars at build time for the client bundle.

## Razorpay webhook

Dashboard → Settings → Webhooks → Add New Webhook.

- URL: `https://<your-domain>/api/webhook`
- Secret: same string as `RAZORPAY_WEBHOOK_SECRET`
- Active events: `payment.captured`, `payment.failed`, `order.paid`

The handler verifies the HMAC against the **raw** request body before parsing, matches strictly on
`razorpay_order_id` (falling back to `notes.registrationId`), and never runs a loose query — a null
order id cannot match another registrant's document. Updates are idempotent, so retries are safe.

## Payment confirmation

Two paths, deliberately:

1. `/api/verify` — checkout handler signature check, gives instant confirmation on the thank-you page.
2. `/api/webhook` — source of truth. Catches closed tabs, dropped connections and delayed UPI captures.

The thank-you page polls `/api/registration/[id]` every 3s for ~30s while status is `created`.

## Data

Collection: `registrations`

```
name, phone, age, occupation ('student' | 'working'),
company            // working only
college, year      // student only
amount (paise), status ('created' | 'paid' | 'failed'),
razorpayOrderId, razorpayPaymentId, paymentMethod, paidAt, ticketCode
```

## Editing event details

Date, venue and time are plain text in `app/page.js` (the `.eyebrow` and `.facts` blocks) and in
`app/thank-you/client.js`.
