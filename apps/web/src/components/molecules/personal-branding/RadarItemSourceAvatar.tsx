import { useMemo, useState } from 'react';
import {
  getFaviconUrl,
  getSourceHostname,
  getSourceLetterAvatar,
} from '@/lib/personal-branding/source-favicon';

export interface RadarItemSourceAvatarProps {
  url?: string | null;
  repositoryUrl?: string | null;
  sourceName?: string | null;
  className?: string;
}

export default function RadarItemSourceAvatar({
  url,
  repositoryUrl,
  sourceName,
  className = 'size-5',
}: RadarItemSourceAvatarProps) {
  const link = url ?? repositoryUrl;
  const hostname = useMemo(() => getSourceHostname(link), [link]);
  const label = sourceName?.trim() || hostname || 'Source';
  const letterAvatar = useMemo(() => getSourceLetterAvatar(label), [label]);
  const [faviconFailed, setFaviconFailed] = useState(false);

  if (hostname && !faviconFailed) {
    return (
      <img
        src={getFaviconUrl(hostname)}
        alt=""
        aria-hidden
        className={`${className} shrink-0 rounded-sm object-cover`}
        onError={() => setFaviconFailed(true)}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`${className} inline-flex shrink-0 items-center justify-center rounded-sm text-[10px] font-semibold text-white`}
      style={{ backgroundColor: letterAvatar.backgroundColor }}
    >
      {letterAvatar.letter}
    </span>
  );
}
