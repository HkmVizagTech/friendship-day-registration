'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import Braid from './braid';

const YEARS = ['1st year', '2nd year', '3rd year', '4th year', '5th year', 'Postgraduate'];

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    age: '',
    occupation: '',
    company: '',
    college: '',
    year: '',
  });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: '' }));
  };

  const pick = (v) => () => {
    setForm((f) => ({ ...f, occupation: v, company: '', college: '', year: '' }));
    setErrors((x) => ({ ...x, occupation: '' }));
  };

  async function pay() {
    setNotice('');
    setBusy(true);
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
          setNotice('Check the highlighted fields.');
        } else {
          setNotice(data.message || 'Could not start the payment. Try again.');
        }
        setBusy(false);
        return;
      }

      if (!window.Razorpay) {
        setNotice('Payment window did not load. Refresh and try again.');
        setBusy(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        order_id: data.orderId,
        amount: data.amount,
        currency: data.currency,
        name: 'Friendship Day 2026',
        description: 'Registration for one',
        prefill: { name: data.name, contact: data.phone },
        theme: { color: '#FF3D7F' },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setNotice('Payment cancelled. Your spot is not booked yet.');
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
            // Webhook will still confirm it; the thank-you page polls.
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

  const isStudent = form.occupation === 'student';
  const isWorking = form.occupation === 'working';

  return (
    <main className="shell">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
      />

      <p className="eyebrow">Sunday · 2 August 2026</p>
      <h1>
        Friendship
        <span className="knot">Day</span>
      </h1>
      <p className="standfirst">
        One afternoon, one band on your wrist, and the people you would call at 2am. Bring them along.
      </p>
      <ul className="facts">
        <li>HKM Vizag, Gambheeram</li>
        <li>4:00 PM onwards</li>
        <li>Rs 99 per person</li>
      </ul>

      <section className="card">
        <Braid />
        <div className="card-body">
          <h2>Book your spot</h2>

          {notice && <p className="formerr">{notice}</p>}

          <div className="field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              value={form.name}
              onChange={set('name')}
              className={errors.name ? 'bad' : ''}
              autoComplete="name"
              placeholder="As you would like it on your band"
            />
            {errors.name && <p className="err">{errors.name}</p>}
          </div>

          <div className="field">
            <label htmlFor="phone">Mobile number</label>
            <input
              id="phone"
              value={form.phone}
              onChange={set('phone')}
              className={errors.phone ? 'bad' : ''}
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel"
              placeholder="10 digits"
            />
            {errors.phone && <p className="err">{errors.phone}</p>}
          </div>

          <div className="field">
            <label htmlFor="age">Age</label>
            <input
              id="age"
              value={form.age}
              onChange={set('age')}
              className={errors.age ? 'bad' : ''}
              inputMode="numeric"
              maxLength={3}
              placeholder="Years"
            />
            {errors.age && <p className="err">{errors.age}</p>}
          </div>

          <div className="field">
            <label>I am currently</label>
            <div className="seg">
              <button type="button" aria-pressed={isStudent} onClick={pick('student')}>
                Studying
              </button>
              <button type="button" aria-pressed={isWorking} onClick={pick('working')}>
                Working
              </button>
            </div>
            {errors.occupation && <p className="err">{errors.occupation}</p>}
          </div>

          {isWorking && (
            <div className="field reveal">
              <label htmlFor="company">Company</label>
              <input
                id="company"
                value={form.company}
                onChange={set('company')}
                className={errors.company ? 'bad' : ''}
                autoComplete="organization"
                placeholder="Where you work"
              />
              {errors.company && <p className="err">{errors.company}</p>}
            </div>
          )}

          {isStudent && (
            <>
              <div className="field reveal">
                <label htmlFor="college">College</label>
                <input
                  id="college"
                  value={form.college}
                  onChange={set('college')}
                  className={errors.college ? 'bad' : ''}
                  placeholder="Where you study"
                />
                {errors.college && <p className="err">{errors.college}</p>}
              </div>
              <div className="field reveal">
                <label htmlFor="year">Year of study</label>
                <select
                  id="year"
                  value={form.year}
                  onChange={set('year')}
                  className={errors.year ? 'bad' : ''}
                >
                  <option value="">Choose a year</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                {errors.year && <p className="err">{errors.year}</p>}
              </div>
            </>
          )}

          <button className="pay" onClick={pay} disabled={busy || !sdkReady}>
            <span>{busy ? 'Opening payment…' : 'Pay and register'}</span>
            <span className="amt">Rs 99</span>
          </button>

          <p className="fineprint">Secure payment by Razorpay. Registration fee is non-refundable.</p>
        </div>
      </section>
    </main>
  );
}
