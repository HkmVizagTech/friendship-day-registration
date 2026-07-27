import Razorpay from 'razorpay';

export const FEE_PAISE = 9900; // Rs 99

export function razorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw new Error('Razorpay keys are not set');
  return new Razorpay({ key_id, key_secret });
}

export function validate(body) {
  const errors = {};
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').replace(/\D/g, '').slice(-10);
  const age = parseInt(body.age, 10);
  const occupation = String(body.occupation || '').trim();
  const company = String(body.company || '').trim();
  const college = String(body.college || '').trim();
  const year = String(body.year || '').trim();

  if (name.length < 2) errors.name = 'Enter your full name';
  if (!/^[6-9]\d{9}$/.test(phone)) errors.phone = 'Enter a valid 10-digit mobile number';
  if (!Number.isInteger(age) || age < 5 || age > 100) errors.age = 'Enter an age between 5 and 100';
  if (!['student', 'working'].includes(occupation)) errors.occupation = 'Choose student or working';
  if (occupation === 'working' && company.length < 2) errors.company = 'Enter your company name';
  if (occupation === 'student') {
    if (college.length < 2) errors.college = 'Enter your college name';
    if (!year) errors.year = 'Choose your year of study';
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: {
      name,
      phone,
      age,
      occupation,
      company: occupation === 'working' ? company : '',
      college: occupation === 'student' ? college : '',
      year: occupation === 'student' ? year : '',
    },
  };
}

export function ticketCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `FD-${s}`;
}
