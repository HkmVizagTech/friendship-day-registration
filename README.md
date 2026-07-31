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

Confirmed with you: the event is on **Saturday 01 August 2026**. Earlier poster copy said
"Sunday" — the site now says Saturday. Both live in `EVENT` in `lib/event.js`.

## Admin dashboard

`/admin` — password protected, one shared password for the team.

| Key | Notes |
| --- | --- |
| `ADMIN_PASSWORD` | Required. The desk password. |
| `ADMIN_SESSION_SECRET` | Optional, recommended. Long random string. Falls back to `ADMIN_PASSWORD`. |

Session is a signed httpOnly cookie, 12 hour expiry. Login is timing-safe and locks an IP out
for 10 minutes after 8 wrong attempts.

**Dashboard** (`/admin`)
- Headcount for the feast, paid bookings, amount collected, arrivals, started-but-unpaid, failed
- Breakdown by ticket type, studying vs working, top colleges, registrations per day
- Search across name, mobile, college, company, ticket code and Razorpay payment ID
- Filter by status, ticket type, occupation, arrived or not; 25 per page
- **Export CSV** respects whatever filters are on screen

**Gate** (`/admin/gate`)
- Type either the ticket code OR the guest's 10-digit mobile number, press enter
- A phone number matches against both the primary attendee's number and the friend's
  number on duo passes, so either person in a pair can be checked in with either phone
- If a phone number happens to match more than one *paid* booking (e.g. it appears as
  primary on one booking and as someone's friend on another), the gate shows both
  bookings side by side so the volunteer picks the right one — nothing is guessed
- Big green "Let 2 in" with both names, or amber if that pass already came through
- Undo, in case of a mis-check-in
- Running list of who just walked in

The CSV is **one row per attendee**, not per booking — so the line count is the headcount to
cook for. Duo passes produce two rows sharing one ticket code.

## Security note (July 2026)

Next.js published nine CVEs on 21 Jul 2026 (SSRF via rewrites, Server Action DoS, cache
confusion, and others). The 14.x line was never patched — fixes only landed in `15.5.21`
and `16.2.11`. This project moved to Next 15.5.x. Server Actions, rewrites and custom
middleware are not used here, so most of those CVEs did not apply to this app's actual
behaviour, but Railway (and any dependency scanner) checks the version number, not usage,
so the upgrade was required regardless.

**What the Next 15 upgrade changed in code:** `cookies()` is now async. `lib/auth.js` and
every route/page that calls `isAuthed()`, `issueSession()`, or `clearSession()` now awaits
it. The dynamic route `app/api/registration/[id]/route.js` now awaits `params` before
reading `params.id`. Both were re-tested end to end (login, session check, logout,
registration lookup) against a real MongoDB instance after the change, not just built.

`postcss` and `sharp` (bundled inside Next's own tooling, not used by this app's code)
were pinned to patched versions via `overrides` in `package.json` to clear the remaining
audit warnings.

## Free event, no payment (31 Jul 2026 change)

This was rebuilt from a paid Razorpay flow into a free registration flow. Everyone
still fills the same form and gets the same `FU-XXXXX` pass — there's just no
payment step, no Razorpay account needed, and no webhook to configure.

**What changed:**
- `/api/order`, `/api/verify`, `/api/webhook` — removed. Replaced by a single
  `/api/register`, which validates and saves the registration in one step.
- Registration is complete (and the ticket code exists) the instant the form is
  submitted — the thank-you page does one fetch, not a payment-status poll.
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` are no
  longer needed. The `razorpay` npm package was removed.
- Every registration now carries a **preacher** field — required, for both the
  primary registrant and the friend on a duo pass — chosen from a fixed list in
  `PREACHERS` (`lib/event.js`). Admin dashboard, CSV export, and gate check-in
  all show it; `/admin` can filter by preacher.
- Age cap lowered to 30 (was 100) as part of the same change.
- Admin dashboard no longer shows revenue or payment status — there's nothing
  to collect. "Registrations" replaces "Paid bookings."

**Full flow re-tested against a real MongoDB before deploying:** valid single,
age-cap rejection at 31, missing/invalid preacher rejection, duo with two
different preachers, thank-you page fetch, admin stats/list/export, and gate
check-in by both ticket code and a duo friend's phone number.

## Single registration only (31 Jul 2026 change)

Removed the "Just me" / "Me + a friend" tier cards entirely. Every registration
is now one person, one form, one pass. Everyone attending — including friends
who used to come in on someone else's duo pass — fills in their own form.

**What changed:**
- `ticketType`, `heads`, and the `friend` sub-document are gone from the schema.
- The form shows a single set of fields, no tier selection.
- Admin dashboard, CSV export, and gate check-in no longer show ticket type or
  "admits N" — it's one row, one person, one pass throughout.
- Re-tested end to end against a real MongoDB after the change: registration,
  validation, thank-you fetch, admin stats/list/export, and gate check-in by
  both code and phone.
