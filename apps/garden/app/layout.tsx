import type { Metadata } from 'next';
import Link from 'next/link';
import { Montserrat, Playfair_Display } from 'next/font/google';

import { GardenHeaderNav } from '@/components/GardenHeaderNav';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';

import './globals.css';

// Avoid DB connections during `next build` / OpenNext packaging (no Neon at build time).
// Per-page `revalidate` may be ignored while this is set; pages still SSR correctly on Lambda.
export const dynamic = 'force-dynamic';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3040').replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Sunny Singh',
  description: 'Full stack developer — portfolio, public proof-of-work, and curated notes.',
  metadataBase: new URL(base),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${playfair.variable}`}>
      <body className={`${montserrat.className} min-h-screen bg-gray-50`}>
        <GoogleAnalytics />
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
            <Link href="/" className="font-serif text-xl font-semibold text-primary">
              Sunny Singh
            </Link>
            <GardenHeaderNav />
          </div>
        </header>
        <main className="min-h-screen w-full">{children}</main>
      </body>
    </html>
  );
}
