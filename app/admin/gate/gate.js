'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';

const ist = (d) =>
  d ? new Date(d).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }) : '';

export default function Gate() {
  const inputRef = useRef(null);
  const [value, setValue] = useState('');
  const [result, setResult] = useState(null);
  const [choices, setChoices] = useState(null);
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState([]);

  function showResult(d) {
    if (!d.ok) {
      setResult({ kind: 'bad', title: 'Not found', line: d.message });
    } else if (d.undone) {
      setResult({ kind: 'warn', title: 'Undone', line: `${d.pass.code} is marked not arrived.` });
    } else if (d.already) {
      setResult({
        kind: 'warn',
        title: 'Already in',
        line: `${d.pass.name} came in at ${ist(d.pass.checkedInAt)}.`,
        meta: `${d.pass.code} · admits ${d.pass.heads}`,
        id: d.pass.id,
      });
    } else {
      setResult({
        kind: 'ok',
        title: `Let ${d.pass.heads} in`,
        line: d.pass.friendName ? `${d.pass.name} + ${d.pass.friendName}` : d.pass.name,
        meta: `${d.pass.code} · checked in ${ist(d.pass.checkedInAt)}`,
        id: d.pass.id,
      });
      setRecent((r) => [{ code: d.pass.code, name: d.pass.name, heads: d.pass.heads, at: d.pass.checkedInAt }, ...r].slice(0, 12));
    }
  }

  async function submit(payload) {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await res.json();

      if (d.multiple) {
        setChoices(d.choices);
        setResult(null);
        return;
      }

      setChoices(null);
      showResult({ ok: res.ok, ...d, message: d.message });
      setValue('');
      inputRef.current?.focus();
    } catch {
      setResult({ kind: 'bad', title: 'No connection', line: 'Check the network and try again.' });
    } finally {
      setBusy(false);
    }
  }

  function go() {
    const v = value.trim();
    if (!v) return;
    submit({ query: v });
  }

  function pick(choice, undo = false) {
    submit({ id: choice.id, undo });
  }

  return (
    <div className="adm-wrap">
      <div className="gate">
        <header className="adm-bar">
          <h1>Gate</h1>
          <span className="spacer" />
          <Link className="btn" href="/admin">
            Dashboard
          </Link>
        </header>

        <label htmlFor="q">Entry code or the guest&rsquo;s mobile number</label>
        <input
          id="q"
          ref={inputRef}
          className="gate-in"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && go()}
          placeholder="FU-XXXXX or 98XXXXXXXX"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          autoFocus
        />

        <button
          className="btn ember"
          style={{ width: '100%', marginTop: 12, padding: '14px' }}
          onClick={go}
          disabled={busy || !value.trim()}
        >
          {busy ? 'Checking…' : 'Check in'}
        </button>

        {choices && (
          <div className="result warn">
            <p className="big" style={{ fontSize: 20 }}>
              Multiple bookings on this number
            </p>
            <p className="meta" style={{ marginBottom: 10 }}>Pick the right one</p>
            {choices.map((c) => (
              <button
                key={c.id}
                className="btn"
                style={{ width: '100%', marginBottom: 8, textAlign: 'left' }}
                onClick={() => pick(c)}
              >
                <strong>{c.name}</strong>{c.friendName ? ` + ${c.friendName}` : ''} — {c.code} · admits {c.heads}
                {c.checkedInAt ? ` · already in ${ist(c.checkedInAt)}` : ''}
              </button>
            ))}
          </div>
        )}

        {!choices && result && (
          <div className={`result ${result.kind}`}>
            <p className="big">{result.title}</p>
            <p className="who">{result.line}</p>
            {result.meta && <p className="meta">{result.meta}</p>}
            {result.kind === 'warn' && result.id && (
              <button className="btn" style={{ marginTop: 12 }} onClick={() => pick({ id: result.id }, true)}>
                Undo this check-in
              </button>
            )}
          </div>
        )}

        {recent.length > 0 && (
          <div className="recent">
            <h3>Just let in</h3>
            <ul>
              {recent.map((r, i) => (
                <li key={`${r.code}-${i}`}>
                  <span>
                    {r.name} <span style={{ opacity: 0.55 }}>· {r.heads}</span>
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{ist(r.at)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
