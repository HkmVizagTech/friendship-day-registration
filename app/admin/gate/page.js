import { redirect } from 'next/navigation';
import { isAuthed } from '@/lib/auth';
import Gate from './gate';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Gate — Friendship Unlimited' };

export default async function GatePage() {
  if (!(await isAuthed())) redirect('/admin/login');
  return <Gate />;
}
