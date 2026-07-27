import { redirect } from 'next/navigation';
import { isAuthed } from '@/lib/auth';
import Dashboard from './dash';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Registrations — Friendship Unlimited' };

export default function AdminPage() {
  if (!isAuthed()) redirect('/admin/login');
  return <Dashboard />;
}
