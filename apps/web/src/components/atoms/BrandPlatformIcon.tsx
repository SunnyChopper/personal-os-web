import type { ReactNode } from 'react';
import { Mail } from 'lucide-react';
import type { BrandPlatform } from '@/types/api/personal-branding.dto';
import { cn } from '@/lib/utils';

export type BrandPlatformIconProps = {
  platform: BrandPlatform;
  className?: string;
  /** Accessible label when the icon stands alone. Omit when paired with visible text. */
  title?: string;
};

type SvgIconProps = {
  className?: string;
  title?: string;
};

function SvgIconShell({ className, title, children }: SvgIconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('size-4 shrink-0', className)}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      aria-label={title}
    >
      {children}
    </svg>
  );
}

function LinkedInIcon({ className, title }: SvgIconProps) {
  return (
    <SvgIconShell className={className} title={title}>
      <path
        fill="currentColor"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452z"
      />
    </SvgIconShell>
  );
}

function XIcon({ className, title }: SvgIconProps) {
  return (
    <SvgIconShell className={className} title={title}>
      <path
        fill="currentColor"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"
      />
    </SvgIconShell>
  );
}

function MediumIcon({ className, title }: SvgIconProps) {
  return (
    <SvgIconShell className={className} title={title}>
      <path
        fill="currentColor"
        d="M13.54 12a6.8 6.8 0 0 1-.84 3.25l-4.64-11.9A6.8 6.8 0 0 1 12 5.26c.55 0 1.08.07 1.58.2L13.54 12zm1.84 1.04c.62-.3 1.2-.72 1.7-1.24.5-.52.92-1.12 1.24-1.76l-3.66-9.4c1.04.36 1.98.94 2.72 1.68.74.74 1.32 1.68 1.68 2.72l-2.98 7.6zm1.04 1.84c.3-.62.48-1.3.52-2.02.04-.72-.04-1.44-.24-2.12l-2.98-7.6c.64.32 1.24.74 1.76 1.24.52.5.94 1.08 1.24 1.7l-2.3 6.8z"
      />
    </SvgIconShell>
  );
}

function YouTubeIcon({ className, title }: SvgIconProps) {
  return (
    <SvgIconShell className={className} title={title}>
      <path
        fill="currentColor"
        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
      />
    </SvgIconShell>
  );
}

function InstagramIcon({ className, title }: SvgIconProps) {
  return (
    <SvgIconShell className={className} title={title}>
      <path
        fill="currentColor"
        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"
      />
    </SvgIconShell>
  );
}

/** Native brand mark for Personal Branding platform pickers. */
export function BrandPlatformIcon({ platform, className, title }: BrandPlatformIconProps) {
  switch (platform) {
    case 'linkedin':
      return <LinkedInIcon className={className} title={title} />;
    case 'x':
      return <XIcon className={className} title={title} />;
    case 'medium':
      return <MediumIcon className={className} title={title} />;
    case 'youtube':
      return <YouTubeIcon className={className} title={title} />;
    case 'instagram':
      return <InstagramIcon className={className} title={title} />;
    case 'newsletter':
      return (
        <Mail
          className={cn('size-4 shrink-0', className)}
          aria-hidden={title ? undefined : true}
          aria-label={title}
        />
      );
    default: {
      const _exhaustive: never = platform;
      return _exhaustive;
    }
  }
}
