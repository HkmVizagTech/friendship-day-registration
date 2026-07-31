'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sunset from './sunset';
import PersonFields from './fields';
import { EVENT } from '@/lib/event';

const blank = { name: '', phone: '', age: '', occupation: '', company: '', college: '', year: '', preacher: '' };

export default function Register() {
  const router = useRouter();
  const cardRef = useRef(null);
  const [me, setMe] = useState(blank);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [barHidden, setBarHidden] = useState(false);

  // The floating bar is only useful while the form is off screen.
  useEffect(() => {
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => setBarHidden(entries[0].isIntersecting), {
      rootMargin: '-90px 0px 0px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

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

  function jumpToForm() {
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function register() {
    setNotice('');
    setBusy(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(me),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
          setNotice('A few things need fixing below.');
        } else {
          setNotice(data.message || 'Could not complete registration. Try again.');
        }
        setBusy(false);
        return;
      }

      router.push(`/thank-you?rid=${data.registrationId}`);
    } catch {
      setNotice('Network problem. Check your connection and try again.');
      setBusy(false);
    }
  }

  return (
    <main className="shell">
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
        <p className="restriction">{EVENT.restriction}</p>
        <Sunset />
      </header>

      <section className="facts">
        <dl className="facts-grid">
          <div>
            <dt>When</dt>
            <dd>
              {EVENT.date.split(' ')[0]} Aug
              <small>{EVENT.weekday}</small>
            </dd>
          </div>
          <div>
            <dt>Starts</dt>
            <dd>
              {EVENT.time}
              <small>Come early</small>
            </dd>
          </div>
          <div>
            <dt>Where</dt>
            <dd>
              {EVENT.venue}
              <small>{EVENT.address}</small>
            </dd>
          </div>
        </dl>
        <ul className="chips">
          {EVENT.highlights.map(([h]) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </section>

      <section className="card" ref={cardRef}>
        <div className="card-top" />
        <div className="card-body">
          <h2>Reserve your seat</h2>
          <p className="sub">Entry is free, but the feast is cooked to headcount — everyone must register to attend.</p>

          {notice && <p className="formerr">{notice}</p>}

          <PersonFields idPrefix="me" keyPrefix="" values={me} errors={errors} onSet={setMine} onPick={pickMine} />

          <p className="restriction-note">{EVENT.restriction} — please confirm before registering.</p>

          <button className="pay" onClick={register} disabled={busy}>
            <span>{busy ? 'Registering…' : 'Register — it\u2019s free'}</span>
          </button>

          <p className="fineprint">No payment needed. Your pass appears the moment you register.</p>
        </div>
      </section>

      <section className="verse">
        <p className="sanskrit">suhṛdaṁ sarva-bhūtānām</p>
        <p className="gloss">Krishna, the well-wishing friend of every living being.</p>
        <span className="ref">Bhagavad-gītā 5.29</span>
      </section>

      <section className="section">
        <p className="eyebrow">How the evening runs</p>
        <ul className="hl">
          {EVENT.highlights.map(([h, s], i) => (
            <li key={h}>
              <span className="n">0{i + 1}</span>
              <span>
                <b>{h}</b>
                <small>{s}</small>
              </span>
            </li>
          ))}
        </ul>
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

      <div className={`bookbar${barHidden ? ' hide' : ''}`}>
        <span className="lead">
          <b>{EVENT.entry}</b>
          {EVENT.weekday} {EVENT.date.split(' ')[0]} Aug, {EVENT.time}
        </span>
        <button type="button" onClick={jumpToForm}>
          Register
        </button>
      </div>
    </main>
  );
}
