'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const rupees = (paise) => `₹${((paise || 0) / 100).toLocaleString('en-IN')}`;
const ist = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : '';

function Bars({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  if (!rows.length) return <p className="empty" style={{ padding: '8px 0' }}>Nothing yet</p>;
  return (
    <div className="bars">
      {rows.map((r) => (
        <div className="bar" key={r.name}>
          <span className="lbl">{r.name}</span>
          <span className="n">{r.n}</span>
          <span className="track">
            <span className="fill" style={{ width: `${(r.n / max) * 100}%` }} />
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [data, setData] = useState({ rows: [], total: 0, pages: 1, page: 1 });
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('paid');
  const [tier, setTier] = useState('all');
  const [occupation, setOccupation] = useState('all');
  const [arrived, setArrived] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const params = useCallback(() => {
    const p = new URLSearchParams({ status, tier, occupation, arrived, page: String(page), limit: '25' });
    if (q.trim()) p.set('q', q.trim());
    return p;
  }, [status, tier, occupation, arrived, page, q]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([
        fetch('/api/admin/stats', { cache: 'no-store' }),
        fetch(`/api/admin/list?${params()}`, { cache: 'no-store' }),
      ]);
      if (s.status === 401 || l.status === 401) return router.replace('/admin/login');
      setStats(await s.json());
      setData(await l.json());
    } finally {
      setLoading(false);
    }
  }, [params, router]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  useEffect(() => setPage(1), [q, status, tier, occupation, arrived]);

  async function signOut() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
  }

  const pending = stats?.byStatus?.created || 0;
  const failed = stats?.byStatus?.failed || 0;

  return (
    <div className="adm-wrap">
      <div className="adm">
        <header className="adm-bar">
          <h1>Friendship Unlimited</h1>
          <span className="tag">Registrations</span>
          <span className="spacer" />
          <Link className="btn" href="/admin/gate">
            Gate check-in
          </Link>
          <a className="btn" href={`/api/admin/export?${params()}`}>
            Export CSV
          </a>
          <button className="btn" onClick={load}>
            Refresh
          </button>
          <button className="btn" onClick={signOut}>
            Sign out
          </button>
        </header>

        <dl className="stat-grid">
          <div className="stat accent">
            <dt>Coming to the feast</dt>
            <dd>
              {stats?.heads ?? '—'}
              <em>people</em>
            </dd>
          </div>
          <div className="stat">
            <dt>Paid bookings</dt>
            <dd>{stats?.bookings ?? '—'}</dd>
          </div>
          <div className="stat">
            <dt>Collected</dt>
            <dd style={{ fontSize: 25 }}>{stats ? rupees(stats.revenue) : '—'}</dd>
          </div>
          <div className="stat">
            <dt>Arrived</dt>
            <dd>
              {stats?.arrived ?? '—'}
              <em>of {stats?.heads ?? 0}</em>
            </dd>
          </div>
          <div className="stat">
            <dt>Started, not paid</dt>
            <dd>{pending}</dd>
          </div>
          <div className="stat">
            <dt>Failed</dt>
            <dd>{failed}</dd>
          </div>
        </dl>

        <div className="panels">
          <div className="panel">
            <h3>Ticket type</h3>
            <Bars
              rows={[
                { name: 'Single (₹99)', n: stats?.byTier?.single || 0 },
                { name: 'Duo (₹149)', n: stats?.byTier?.duo || 0 },
              ]}
            />
          </div>
          <div className="panel">
            <h3>Studying or working</h3>
            <Bars
              rows={[
                { name: 'Studying', n: stats?.byOccupation?.student || 0 },
                { name: 'Working', n: stats?.byOccupation?.working || 0 },
              ]}
            />
          </div>
          <div className="panel">
            <h3>Top colleges</h3>
            <Bars rows={(stats?.colleges || []).map((c) => ({ name: c.name, n: c.n }))} />
          </div>
          <div className="panel">
            <h3>Registrations by day</h3>
            <Bars rows={(stats?.daily || []).map((d) => ({ name: d.day, n: d.heads }))} />
          </div>
        </div>

        <div className="filters">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, mobile, college, ticket code, payment ID"
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="paid">Paid</option>
            <option value="created">Not paid</option>
            <option value="failed">Failed</option>
            <option value="all">All statuses</option>
          </select>
          <select value={tier} onChange={(e) => setTier(e.target.value)}>
            <option value="all">Any ticket</option>
            <option value="single">Single</option>
            <option value="duo">Duo</option>
          </select>
          <select value={occupation} onChange={(e) => setOccupation(e.target.value)}>
            <option value="all">Anyone</option>
            <option value="student">Studying</option>
            <option value="working">Working</option>
          </select>
          <select value={arrived} onChange={(e) => setArrived(e.target.value)}>
            <option value="all">Arrived or not</option>
            <option value="yes">Arrived</option>
            <option value="no">Not arrived</option>
          </select>
        </div>

        <div className="tbl-wrap">
          {loading && !data.rows.length ? (
            <p className="empty">Loading…</p>
          ) : !data.rows.length ? (
            <p className="empty">No registrations match these filters.</p>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Who</th>
                  <th>Mobile</th>
                  <th>Age</th>
                  <th>College / Company</th>
                  <th>Ticket</th>
                  <th>Code</th>
                  <th>Paid</th>
                  <th>Booked</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="nm">{r.name}</span>
                      {r.friend?.name && <span className="sm">+ {r.friend.name}</span>}
                      {r.checkedInAt && (
                        <span className="sm">
                          <span className="pill here">Arrived {ist(r.checkedInAt)}</span>
                        </span>
                      )}
                    </td>
                    <td>
                      {r.phone}
                      {r.friend?.phone && <span className="sm">{r.friend.phone}</span>}
                    </td>
                    <td>
                      {r.age}
                      {r.friend?.age && <span className="sm">{r.friend.age}</span>}
                    </td>
                    <td>
                      {r.occupation === 'student' ? r.college : r.company}
                      <span className="sm">
                        {r.occupation === 'student' ? r.year : 'Working'}
                      </span>
                    </td>
                    <td>
                      <span className={`pill ${r.ticketType}`}>
                        {r.ticketType === 'duo' ? 'Duo · 2' : 'Single · 1'}
                      </span>
                    </td>
                    <td className="code">{r.ticketCode || '—'}</td>
                    <td>
                      <span className={`pill ${r.status}`}>{r.status}</span>
                      <span className="sm">{rupees(r.amount)}{r.method ? ` · ${r.method}` : ''}</span>
                    </td>
                    <td>
                      <span className="sm" style={{ marginTop: 0 }}>{ist(r.createdAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="pager">
          <span>
            {data.total} {data.total === 1 ? 'booking' : 'bookings'} · page {data.page} of {data.pages}
          </span>
          <span style={{ display: 'flex', gap: 8 }}>
            <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button className="btn" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
