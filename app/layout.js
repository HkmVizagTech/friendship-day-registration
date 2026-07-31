import './globals.css';

export const metadata = {
  title: 'Friendship Unlimited 2026 — Hare Krishna Movement, Visakhapatnam',
  description:
    'Friendship Day Special at Chaitanya Bhavan, Gambhiram. Live music, games, a talk on real friendship and a full prasadam feast. Free entry — registration required. Boys only, age up to 30.',
  openGraph: {
    title: 'Friendship Unlimited 2026',
    description: 'Music, games, a talk on real friendship and a feast. Free entry, bring a friend along.',
    type: 'website',
  },
};

export const viewport = { themeColor: '#081C33', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Caveat+Brush&family=Manrope:wght@400;500;700;800&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
