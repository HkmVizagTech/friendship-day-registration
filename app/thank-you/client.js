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
    let stop = false;

    // Registration is saved synchronously in /api/register, so this is a
    // single fetch, not a poll. A couple of quick retries only guard
    // against a genuine transient network blip.
    async function load(attempt = 0) {
      try {
        const res = await fetch(`/api/registration/${rid}`, { cache: 'no-store' });
        if (!res.ok) {
          if (attempt < 2) return setTimeout(() => load(attempt + 1), 900);
          if (!stop) setState('missing');
          return;
        }
        const data = await res.json();
        if (stop) return;
        setReg(data);
        setState('ok');
      } catch {
        if (attempt < 2) return setTimeout(() => load(attempt + 1), 900);
        if (!stop) setState('missing');
      }
    }

    load();
    return () => {
      stop = true;
    };
  }, [rid]);

  if (state === 'loading') {
    return (
      <main className="shell">
        <section className="section">
          <p className="eyebrow">One moment</p>
          <p>Fetching your pass…</p>
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
            We could not find this registration. Call{' '}
            <a href={`tel:${EVENT.phone}`} style={{ color: '#FFDE95' }}>
              {EVENT.phone}
            </a>{' '}
            and we will sort it out.
          </p>
          <Link className="back" href="/">
            ← Back to the form
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="hero">
        <p className="lockup">
          You&rsquo;re registered
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
          {reg?.ticketCode && (
            <>
              <label>Show this at the gate</label>
              <p className="tick">{reg.ticketCode}</p>
            </>
          )}

          <ul className="rows">
            <li className="head">
              <span className="k">Attendee</span>
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
            <li>
              <span className="k">Preacher</span>
              <span className="v">{reg?.preacher}</span>
            </li>
          </ul>

          <p className="fineprint">
            Entry is free. Take a screenshot of your code. Reach a little before {EVENT.time} so you do not miss the kirtan.
          </p>
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
