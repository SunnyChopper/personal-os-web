import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';

function throwWithCode(
  res: { error?: { message?: string; code?: string } },
  fallback: string
): never {
  const err = new Error(res.error?.message ?? fallback) as Error & { code?: string };
  if (res.error?.code) err.code = res.error.code;
  throw err;
}

/**
 * Lightweight brand-profile picker: list + selected id only.
 * Prefer this over `usePersonalBrandingBrandIdentity` when the page only needs
 * profile id/name options (Rolodex, Project Labs, etc.) — the full Brand Identity
 * hook also fetches platform rules, catalog, detail, versions, and output-tests.
 */
export function useBrandProfilesList(page = 1, pageSize = 50) {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const profiles = useQuery({
    queryKey: queryKeys.personalBranding.profiles.list(page, pageSize),
    queryFn: async () => {
      const res = await personalBrandingService.listProfiles(page, pageSize);
      if (!res.success || !res.data) {
        throwWithCode(res, 'Failed to load brand profiles');
      }
      return res.data;
    },
  });

  useEffect(() => {
    if (!selectedProfileId && profiles.data?.data?.length) {
      setSelectedProfileId(profiles.data.data[0].id);
    }
  }, [profiles.data, selectedProfileId]);

  const profileOptions = useMemo(
    () => (profiles.data?.data ?? []).map((p) => ({ id: p.id, name: p.name })),
    [profiles.data]
  );

  return {
    profiles,
    selectedProfileId,
    setSelectedProfileId,
    profileOptions,
  };
}
