'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Braid from '../braid';

export default function ThankYouClient() {
  const rid = useSearchParams().get('rid');
  const [reg, setReg] = useState(null);
  const [state, setState] = useState('loading'); // loading | ok | pending | missing

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
        // Webhooks can lag a few seconds. Keep checking for ~30s.
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
        <p className="standfirst">Checking your payment…</p>
      </main>
    );
  }

  if (state === 'missing') {
    return (
      <main className="shell">
        <h1>
          Nothing to
          <span className="knot">show</span>
        </h1>
        <p className="standfirst">
          We could not find this registration. If money left your account, send us the payment ID and we
          will sort it out.
        </p>
        <Link className="back" href="/">
          ← Back to the form
        </Link>
      </main>
    );
  }

  const paid = state === 'ok';

  return (
    <main className="shell">
      <p className="eyebrow">{paid ? 'You are in' : 'Almost there'}</p>
      <h1>
        See you on
        <span className="knot">Sunday</span>
      </h1>
      <p className="standfirst">
        {paid
          ? 'Your spot is booked. Show this screen at the gate to collect your band.'
          : 'Your payment is going through. This page updates on its own.'}
      </p>

      <section className="card" style={{ marginTop: 22 }}>
        <Braid />
        <div className="card-body">
          {!paid && (
            <p className="pending">
              Confirming with the bank. Do not pay again — keep this page open for a few seconds.
            </p>
          )}

          {paid && reg?.ticketCode && (
            <>
              <label>Your entry code</label>
              <p className="tick">{reg.ticketCode}</p>
            </>
          )}

          <ul className="rows">
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
            <li>
              <span className="k">Amount</span>
              <span className="v">Rs {((reg?.amount || 0) / 100).toFixed(0)}</span>
            </li>
            <li>
              <span className="k">Status</span>
              <span className="v">{paid ? 'Paid' : 'Processing'}</span>
            </li>
          </ul>
        </div>
      </section>

      <Link className="back" href="/">
        ← Register someone else
      </Link>
    </main>
  );
}
