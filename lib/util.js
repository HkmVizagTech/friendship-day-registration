import { PREACHERS } from './event';

export function validate(body) {
  const errors = {};

  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').replace(/\D/g, '').slice(-10);
  const age = parseInt(body.age, 10);
  const occupation = String(body.occupation || '').trim();
  const company = String(body.company || '').trim();
  const college = String(body.college || '').trim();
  const year = String(body.year || '').trim();
  const preacher = String(body.preacher || '').trim();

  if (name.length < 2) errors.name = 'Enter the full name';
  if (!/^[6-9]\d{9}$/.test(phone)) errors.phone = 'Enter a valid 10-digit mobile number';
  if (!Number.isInteger(age) || age < 5 || age > 30) errors.age = 'Enter an age between 5 and 30';
  if (!['student', 'working'].includes(occupation)) errors.occupation = 'Choose studying or working';
  if (occupation === 'working' && company.length < 2) errors.company = 'Enter the company name';
  if (occupation === 'student') {
    if (college.length < 2) errors.college = 'Enter the college name';
    if (!year) errors.year = 'Choose the year of study';
  }
  if (!PREACHERS.includes(preacher)) errors.preacher = 'Choose your preacher';

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: {
      name,
      phone,
      age: Number.isInteger(age) ? age : undefined,
      occupation: ['student', 'working'].includes(occupation) ? occupation : '',
      company: occupation === 'working' ? company : '',
      college: occupation === 'student' ? college : '',
      year: occupation === 'student' ? year : '',
      preacher: PREACHERS.includes(preacher) ? preacher : '',
    },
  };
}

export function ticketCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `FU-${s}`;
}
