'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import Sunset from './sunset';
import PersonFields from './fields';
import { EVENT, TIERS } from '@/lib/event';

const blank = { name: '', phone: '', age: '', occupation: '', company: '', college: '', year: '' };

export default function Register() {
  const router = useRouter();
  const [ticketType, setTicketType] = useState('single');
  const [me, setMe] = useState(blank);
  const [friend, setFriend] = useState(blank);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  const isDuo = ticketType === 'duo';
  const tier = TIERS[ticketType];

  const clearErr = (k) => setErrors((x) => (x[k] ? { ...x, [k]: '' } : x));

  const setMine = (k) => (ev) => {
    const v = ev.target.value;
    setMe((f) => ({ ...f, [k]: v }));
    clearErr(k);
  };
  const pickMine = (v) => () => {
    setMe((f) => ({ ...f, occupation: v, company: '', college: '', year: '' }));
    clearErr('occupation');
  };
  const setTheirs = (k) => (ev) => {
    const v = ev.target.value;
    setFriend((f) => ({ ...f, [k]: v }));
    clearErr(`friend.${k}`);
  };
  const pickTheirs = (v) => () => {
    setFriend((f) => ({ ...f, occupation: v, company: '', college: '', year: '' }));
    clearErr('friend.occupation');
  };

  function chooseTier(t) {
    setTicketType(t);
    setNotice('');
    setErrors((x) => {
      const next = {};
      Object.keys(x).forEach((k) => {
        if (!k.startsWith('friend.')) next[k] = x[k];
      });
      return next;
    });
  }

  async function pay() {
    setNotice('');
    setBusy(true);
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...me, ticketType, friend: isDuo ? friend : undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
          setNotice('A few things need fixing below.');
        } else {
          setNotice(data.message || 'Could not start the payment. Try again.');
        }
        setBusy(false);
        return;
      }

      if (!window.Razorpay) {
        setNotice('Payment window did not load. Refresh the page and try again.');
        setBusy(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        order_id: data.orderId,
        amount: data.amount,
        currency: data.currency,
        name: 'Friendship Unlimited 2026',
        description: isDuo ? 'Entry for two' : 'Entry for one',
        prefill: { name: data.name, contact: data.phone },
        theme: { color: '#E8551F' },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setNotice('Payment cancelled. Your seat is not booked yet.');
          },
        },
        handler: async (r) => {
          try {
            await fetch('/api/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(r),
            });
          } catch {
            // The webhook still confirms it; the next page polls until it does.
          }
          router.push(`/thank-you?rid=${data.registrationId}`);
        },
      });

      rzp.on('payment.failed', (resp) => {
        setBusy(false);
        setNotice(resp?.error?.description || 'Payment failed. Try another method.');
      });

      rzp.open();
    } catch {
      setNotice('Network problem. Check your connection and try again.');
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
      />

      <header className="hero">
        <p className="lockup">
          {EVENT.host} invites you
          <span>{EVENT.org}</span>
        </p>
        <h1 className="title">
          {EVENT.title}
          <span className="script">{EVENT.titleScript}</span>
        </h1>
        <p className="ribbon">{EVENT.kicker}</p>
        <Sunset />
      </header>

      <section className="verse">
        <p className="sanskrit">suhṛdaṁ sarva-bhūtānām</p>
        <p className="gloss">Krishna, the well-wishing friend of every living being.</p>
        <span className="ref">Bhagavad-gītā 5.29</span>
      </section>

      <section className="section">
        <p className="eyebrow">What the evening holds</p>
        <ul className="hl">
          {EVENT.highlights.map(([h, s]) => (
            <li key={h}>
              <b>{h}</b>
              <small>{s}</small>
            </li>
          ))}
        </ul>

        <dl className="when">
          <dt>When</dt>
          <dd>
            {EVENT.weekday}, {EVENT.date}
            <small>Starts {EVENT.time}</small>
          </dd>
          <dt>Where</dt>
          <dd>
            {EVENT.venue}
            <small>{EVENT.address}</small>
          </dd>
        </dl>
      </section>

      <section className="card">
        <div className="card-top" />
        <div className="card-body">
          <h2>Book your seat</h2>
          <p className="sub">Seats are limited and the feast is counted by headcount, so please register early.</p>

          {notice && <p className="formerr">{notice}</p>}

          <div className="tiers">
            <button
              type="button"
              className="tier single"
              aria-pressed={!isDuo}
              onClick={() => chooseTier('single')}
            >
              <span className="who">Just me</span>
              <span className="price">₹99</span>
              <span className="note">One entry</span>
            </button>

            <button
              type="button"
              className="tier duo"
              aria-pressed={isDuo}
              onClick={() => chooseTier('duo')}
            >
              <span className="save">Save ₹49</span>
              <span className="who">Me + a friend</span>
              <span className="price">₹149</span>
              <span className="note">Two entries</span>
            </button>
          </div>

          <div className="who-head">
            <b>{isDuo ? 'You' : 'Your details'}</b>
            {isDuo && <span>Person 1</span>}
          </div>
          <PersonFields
            idPrefix="me"
            keyPrefix=""
            values={me}
            errors={errors}
            onSet={setMine}
            onPick={pickMine}
          />

          {isDuo && (
            <div className="reveal">
              <div className="who-head">
                <b>Your friend</b>
                <span>Person 2</span>
              </div>
              <p className="hint">
                Both of you come in on one pass, so bring them along on the evening.
              </p>
              <PersonFields
                idPrefix="friend"
                keyPrefix="friend."
                values={friend}
                errors={errors}
                onSet={setTheirs}
                onPick={pickTheirs}
              />
            </div>
          )}

          <button className="pay" onClick={pay} disabled={busy || !sdkReady}>
            <span>{busy ? 'Opening payment…' : isDuo ? 'Pay for two' : 'Pay and register'}</span>
            <span className="amt">₹{tier.amount / 100}</span>
          </button>

          <p className="fineprint">
            Secure payment by Razorpay. Your pass reaches this screen the moment payment clears.
          </p>
        </div>
      </section>

      <footer className="foot">
        <p className="om">Hare Krishna</p>
        <p>
          Questions? Call <a href={`tel:${EVENT.phone}`}>{EVENT.phone}</a>
        </p>
        <p>
          {EVENT.venue}, {EVENT.address}
        </p>
        <p>{EVENT.org}</p>
      </footer>
    </main>
  );
}
