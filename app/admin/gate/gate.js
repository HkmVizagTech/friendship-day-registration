'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';

const ist = (d) =>
  d ? new Date(d).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }) : '';

export default function Gate() {
  const inputRef = useRef(null);
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState([]);

  async function submit(undo = false) {
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: clean, undo }),
      });
      const d = await res.json();

      if (!res.ok) {
        setResult({ kind: 'bad', title: 'Not found', line: d.message });
      } else if (d.undone) {
        setResult({ kind: 'warn', title: 'Undone', line: `${d.pass.code} is marked not arrived.` });
      } else if (d.already) {
        setResult({
          kind: 'warn',
          title: 'Already in',
          line: `${d.pass.name} came in at ${ist(d.pass.checkedInAt)}.`,
          meta: `${d.pass.code} · admits ${d.pass.heads}`,
          code: d.pass.code,
        });
      } else {
        setResult({
          kind: 'ok',
          title: `Let ${d.pass.heads} in`,
          line: d.pass.friendName ? `${d.pass.name} + ${d.pass.friendName}` : d.pass.name,
          meta: `${d.pass.code} · checked in ${ist(d.pass.checkedInAt)}`,
          code: d.pass.code,
        });
        setRecent((r) => [{ code: d.pass.code, name: d.pass.name, heads: d.pass.heads, at: d.pass.checkedInAt }, ...r].slice(0, 12));
      }
      setCode('');
      inputRef.current?.focus();
    } catch {
      setResult({ kind: 'bad', title: 'No connection', line: 'Check the network and try again.' });
    } finally {
      setBusy(false);
    }
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

        <label htmlFor="code">Entry code from the guest&rsquo;s screen</label>
        <input
          id="code"
          ref={inputRef}
          className="gate-in"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && submit(false)}
          placeholder="FU-XXXXX"
          autoComplete="off"
          autoCapitalize="characters"
          autoFocus
        />

        <button
          className="btn ember"
          style={{ width: '100%', marginTop: 12, padding: '14px' }}
          onClick={() => submit(false)}
          disabled={busy || !code.trim()}
        >
          {busy ? 'Checking…' : 'Check in'}
        </button>

        {result && (
          <div className={`result ${result.kind}`}>
            <p className="big">{result.title}</p>
            <p className="who">{result.line}</p>
            {result.meta && <p className="meta">{result.meta}</p>}
            {result.kind === 'warn' && result.code && (
              <button
                className="btn"
                style={{ marginTop: 12 }}
                onClick={() => {
                  setCode(result.code);
                  setTimeout(() => submit(true), 0);
                }}
              >
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
