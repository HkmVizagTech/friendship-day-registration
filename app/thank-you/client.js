'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sunset from '../sunset';
import { EVENT } from '@/lib/event';

export default function ThankYouClient() {
  const rid = useSearchParams().get('rid');
  const [reg, setReg] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    if (!rid) {
      setState('missing');
      return;
    }
    let tries = 0;
    let stop = false;

    async function poll() {
      try {
        const res = await fetch(`/api/registration/${rid}`, { cache: 'no-store' });
        if (!res.ok) {
          setState('missing');
          return;
        }
        const data = await res.json();
        if (stop) return;
        setReg(data);
        if (data.status === 'paid') {
          setState('ok');
          return;
        }
        setState('pending');
        if (tries++ < 10) setTimeout(poll, 3000);
      } catch {
        if (!stop) setState('pending');
      }
    }

    poll();
    return () => {
      stop = true;
    };
  }, [rid]);

  if (state === 'loading') {
    return (
      <main className="shell">
        <section className="section">
          <p className="eyebrow">One moment</p>
          <p>Checking your payment…</p>
        </section>
      </main>
    );
  }

  if (state === 'missing') {
    return (
      <main className="shell">
        <header className="hero">
          <h1 className="title">
            Nothing
            <span className="script">here yet</span>
          </h1>
        </header>
        <section className="section">
          <p>
            We could not find this registration. If money has left your account, call{' '}
            <a href={`tel:${EVENT.phone}`} style={{ color: '#FFDE95' }}>
              {EVENT.phone}
            </a>{' '}
            with your payment ID and we will sort it out the same day.
          </p>
          <Link className="back" href="/">
            ← Back to the form
          </Link>
        </section>
      </main>
    );
  }

  const paid = state === 'ok';
  const duo = reg?.heads === 2;

  return (
    <main className="shell">
      <header className="hero">
        <p className="lockup">
          {paid ? 'Your seat is booked' : 'Almost there'}
          <span>{EVENT.org}</span>
        </p>
        <h1 className="title">
          See you
          <span className="script">on {EVENT.weekday}</span>
        </h1>
        <p className="ribbon">
          {EVENT.venue} · {EVENT.time}
        </p>
        <Sunset />
      </header>

      <section className="card" style={{ marginTop: 24 }}>
        <div className="card-top" />
        <div className="card-body">
          {!paid && (
            <p className="pending">
              Confirming with the bank. Please do not pay again — this page updates on its own.
            </p>
          )}

          {paid && reg?.ticketCode && (
            <>
              <label>Show this at the gate</label>
              <p className="tick">{reg.ticketCode}</p>
              <span className="admits">Admits {reg.heads}</span>
            </>
          )}

          <ul className="rows">
            <li className="head">
              <span className="k">{duo ? 'Person 1' : 'Attendee'}</span>
            </li>
            <li>
              <span className="k">Name</span>
              <span className="v">{reg?.name}</span>
            </li>
            <li>
              <span className="k">Mobile</span>
              <span className="v">{reg?.phone}</span>
            </li>
            {reg?.occupation === 'working' && (
              <li>
                <span className="k">Company</span>
                <span className="v">{reg.company}</span>
              </li>
            )}
            {reg?.occupation === 'student' && (
              <>
                <li>
                  <span className="k">College</span>
                  <span className="v">{reg.college}</span>
                </li>
                <li>
                  <span className="k">Year</span>
                  <span className="v">{reg.year}</span>
                </li>
              </>
            )}

            {duo && reg?.friend && (
              <>
                <li className="head">
                  <span className="k">Person 2</span>
                </li>
                <li>
                  <span className="k">Name</span>
                  <span className="v">{reg.friend.name}</span>
                </li>
                <li>
                  <span className="k">Mobile</span>
                  <span className="v">{reg.friend.phone}</span>
                </li>
                {reg.friend.occupation === 'working' && (
                  <li>
                    <span className="k">Company</span>
                    <span className="v">{reg.friend.company}</span>
                  </li>
                )}
                {reg.friend.occupation === 'student' && (
                  <>
                    <li>
                      <span className="k">College</span>
                      <span className="v">{reg.friend.college}</span>
                    </li>
                    <li>
                      <span className="k">Year</span>
                      <span className="v">{reg.friend.year}</span>
                    </li>
                  </>
                )}
              </>
            )}

            <li className="head">
              <span className="k">Payment</span>
            </li>
            <li>
              <span className="k">Amount</span>
              <span className="v">₹{((reg?.amount || 0) / 100).toFixed(0)}</span>
            </li>
            <li>
              <span className="k">Status</span>
              <span className="v">{paid ? 'Paid' : 'Processing'}</span>
            </li>
          </ul>

          {paid && (
            <p className="fineprint">
              Take a screenshot. Reach a little before {EVENT.time} so you do not miss the kirtan.
            </p>
          )}
        </div>
      </section>

      <footer className="foot">
        <p className="om">Hare Krishna</p>
        <p>
          Questions? Call <a href={`tel:${EVENT.phone}`}>{EVENT.phone}</a>
        </p>
        <Link className="back" href="/">
          ← Register someone else
        </Link>
      </footer>
    </main>
  );
}
