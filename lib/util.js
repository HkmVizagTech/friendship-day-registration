import Razorpay from 'razorpay';
import { TIERS } from './event';

export function razorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw new Error('Razorpay keys are not set');
  return new Razorpay({ key_id, key_secret });
}

function person(src, prefix, errors, required) {
  const name = String(src.name || '').trim();
  const phone = String(src.phone || '').replace(/\D/g, '').slice(-10);
  const age = parseInt(src.age, 10);
  const occupation = String(src.occupation || '').trim();
  const company = String(src.company || '').trim();
  const college = String(src.college || '').trim();
  const year = String(src.year || '').trim();

  if (required) {
    if (name.length < 2) errors[`${prefix}name`] = 'Enter the full name';
    if (!/^[6-9]\d{9}$/.test(phone)) errors[`${prefix}phone`] = 'Enter a valid 10-digit mobile number';
    if (!Number.isInteger(age) || age < 5 || age > 100) errors[`${prefix}age`] = 'Enter an age between 5 and 100';
    if (!['student', 'working'].includes(occupation)) errors[`${prefix}occupation`] = 'Choose studying or working';
    if (occupation === 'working' && company.length < 2) errors[`${prefix}company`] = 'Enter the company name';
    if (occupation === 'student') {
      if (college.length < 2) errors[`${prefix}college`] = 'Enter the college name';
      if (!year) errors[`${prefix}year`] = 'Choose the year of study';
    }
  }

  return {
    name,
    phone,
    age: Number.isInteger(age) ? age : undefined,
    occupation: ['student', 'working'].includes(occupation) ? occupation : '',
    company: occupation === 'working' ? company : '',
    college: occupation === 'student' ? college : '',
    year: occupation === 'student' ? year : '',
  };
}

export function validate(body) {
  const errors = {};

  const ticketType = String(body.ticketType || '').trim();
  const tier = TIERS[ticketType];
  if (!tier) errors.ticketType = 'Choose a ticket';

  const me = person(body, '', errors, true);
  const isDuo = ticketType === 'duo';
  const friend = isDuo ? person(body.friend || {}, 'friend.', errors, true) : null;

  if (isDuo && friend && me.phone && friend.phone && me.phone === friend.phone) {
    errors['friend.phone'] = 'Use a different number from yours';
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    tier,
    data: {
      ...me,
      ticketType,
      heads: tier ? tier.heads : 1,
      friend: isDuo ? friend : undefined,
      amount: tier ? tier.amount : 0,
    },
  };
}

export function ticketCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `FU-${s}`;
}
