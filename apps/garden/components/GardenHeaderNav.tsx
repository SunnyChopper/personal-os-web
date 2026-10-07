'use client';

import Link from 'next/link';

import { trackGardenCtaClick, type GardenCtaId } from '@/lib/analytics';

const NAV_LINKS: { href: string; label: string; ctaId: GardenCtaId; className?: string }[] = [
  { href: '/#home', label: 'Home', ctaId: 'nav_home' },
  { href: '/#skills', label: 'Skills', ctaId: 'nav_skills' },
  { href: '/#portfolio', label: 'Portfolio', ctaId: 'nav_portfolio' },
  { href: '/#blog', label: 'Blog', ctaId: 'nav_blog' },
  { href: '/#contact', label: 'Contact', ctaId: 'nav_contact' },
  {
    href: '/insights',
    label: 'Insights',
    ctaId: 'nav_insights',
    className: 'text-primary transition-colors hover:text-primary-dark',
  },
  { href: '/products', label: 'Products', ctaId: 'nav_products' },
];

export function GardenHeaderNav() {
  return (
    <nav className="flex flex-wrap items-center gap-6 text-sm font-medium text-gray-600">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.ctaId}
          href={link.href}
          className={link.className ?? 'transition-colors hover:text-primary'}
          onClick={() => trackGardenCtaClick(link.ctaId)}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
