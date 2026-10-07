import { useEffect, useState } from 'react';
import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import { DialogFooter } from '@/pages/admin/personal-branding/PersonalBrandingPageTemplate';
import type { BrandProjectPostPlatform } from '@/types/api/personal-branding.dto';

const EMPTY_URLS: Record<BrandProjectPostPlatform, string> = {
  x: '',
  youtube: '',
  linkedin: '',
  other: '',
};

const HTTPS_CLIENT_MESSAGE = 'Each link must start with https://';

interface CompleteProjectDialogProps {
  open: boolean;
  title: string;
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (links: Array<{ platform: BrandProjectPostPlatform; url: string }>) => void;
}

const DEFAULT_LINKS: Array<{ platform: BrandProjectPostPlatform; label: string }> = [
  { platform: 'x', label: 'X post URL' },
  { platform: 'youtube', label: 'YouTube URL' },
  { platform: 'linkedin', label: 'LinkedIn URL' },
];

function isHttpsUrl(value: string): boolean {
  return value.trim().toLowerCase().startsWith('https://');
}

export default function CompleteProjectDialog({
  open,
  title,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}: CompleteProjectDialogProps) {
  const [urls, setUrls] = useState<Record<BrandProjectPostPlatform, string>>(EMPTY_URLS);
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setUrls(EMPTY_URLS);
    setClientError(null);
  }, [open]);

  const filledLinks = DEFAULT_LINKS.map((row) => ({
    platform: row.platform,
    url: urls[row.platform].trim(),
  })).filter((row) => row.url.length > 0);

  const hasFilledUrl = filledLinks.length > 0;
  const displayError = error ?? clientError;

  const handleSubmit = () => {
    if (filledLinks.length === 0) return;
    const invalid = filledLinks.some((row) => !isHttpsUrl(row.url));
    if (invalid) {
      setClientError(HTTPS_CLIENT_MESSAGE);
      return;
    }
    setClientError(null);
    onSubmit(filledLinks);
  };

  const handleUrlChange = (platform: BrandProjectPostPlatform, value: string) => {
    setClientError(null);
    setUrls((prev) => ({ ...prev, [platform]: value }));
  };

  return (
    <Dialog isOpen={open} onClose={onClose} title={`Mark “${title}” complete`}>
      <div className="space-y-3">
        {DEFAULT_LINKS.map((row) => (
          <label key={row.platform} className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700 dark:text-gray-200">
              {row.label}
            </span>
            <input
              type="url"
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900"
              placeholder="https://"
              value={urls[row.platform]}
              onChange={(e) => handleUrlChange(row.platform, e.target.value)}
            />
          </label>
        ))}
        {displayError ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {displayError}
          </p>
        ) : null}
      </div>
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!hasFilledUrl || isSubmitting}>
          Save links
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
