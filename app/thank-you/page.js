import { Suspense } from 'react';
import ThankYouClient from './client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'You are registered — Friendship Day 2026',
};

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <main className="shell">
          <p className="standfirst">Checking your payment…</p>
        </main>
      }
    >
      <ThankYouClient />
    </Suspense>
  );
}
