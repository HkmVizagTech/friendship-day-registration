# Friendship Unlimited 2026 — Registration

Friends of Lord Krishna · Hare Krishna Movement, Visakhapatnam
Chaitanya Bhavan, IIM Road, Gambhiram · 01 August 2026 · 5:30 PM

Next.js 14 (App Router) · MongoDB · Razorpay · deployed on Netlify.

## Tickets

| Tier | Price | Heads |
| --- | --- | --- |
| `single` | ₹99 | 1 |
| `duo` | ₹149 | 2 |

Prices live in `lib/event.js` (`TIERS`) and are applied **server-side only** — the browser
never sends an amount. Change them in that one file.

All poster copy (date, venue, time, phone, highlights) is also in `lib/event.js`.

## Environment variables

Netlify → Site configuration → Environment variables:

| Key | Notes |
| --- | --- |
| `MONGODB_URI` | Atlas connection string. Allow access from anywhere in Network Access. |
| `RAZORPAY_KEY_ID` | Live or test key id. |
| `RAZORPAY_KEY_SECRET` | Server only, never sent to the browser. |
| `RAZORPAY_WEBHOOK_SECRET` | Same string you type into the Razorpay webhook form. |

Redeploy after adding or changing them.

## Razorpay webhook

Dashboard → Settings → Webhooks → Add New Webhook.

- URL: `https://<your-netlify-domain>/api/webhook`
- Secret: same as `RAZORPAY_WEBHOOK_SECRET`
- Events: `payment.captured`, `payment.failed`, `order.paid`

The handler verifies the HMAC against the raw body before parsing, matches strictly on
`razorpayOrderId` with a `notes.registrationId` fallback, and never runs a loose query — a null
order id cannot attach to another registrant. Updates are idempotent, so retries are safe.

## Confirmation, two ways

1. `/api/verify` — signature check straight from the checkout handler, instant.
2. `/api/webhook` — source of truth. Covers closed tabs, dropped connections, slow UPI captures.

`/thank-you` polls `/api/registration/[id]` every 3s for ~30s while status is `created`.

## Data

Collection: `registrations`

```
name, phone, age, occupation ('student' | 'working'), company | college + year,
ticketType ('single' | 'duo'), heads, friend { same shape },
amount (paise), status ('created' | 'paid' | 'failed'),
razorpayOrderId, razorpayPaymentId, paymentMethod, paidAt, ticketCode, checkedInAt
```

One `ticketCode` per registration, prefixed `FU-`. A duo pass admits 2 — `heads` is the
number to count for the feast.

## Note on the date

01 August 2026 falls on a **Saturday**; the first Sunday of August is the 2nd. The poster says
"Sunday 01 August". Whichever is correct, fix `EVENT.weekday` and `EVENT.date` in `lib/event.js`.
