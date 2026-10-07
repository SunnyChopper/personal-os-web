import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BrandProfile } from '@/types/api/personal-branding.dto';
import CoreProfileTab from './CoreProfileTab';

const scrollIntoView = vi.fn();
const setSelectedProfileId = vi.fn();

const profile: BrandProfile = {
  id: 'profile-1',
  name: 'Core brand',
  pillars: [],
  targetAudience: null,
  toneMetrics: {},
  bannedPhrases: [],
  status: 'active',
  platforms: [],
  userId: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const brandIdentity = {
  profiles: { data: { data: [profile] }, isPending: false },
  profileDetail: { data: profile },
  profileVersions: { data: [], isPending: false },
  profileOutputTests: { data: [], isPending: false },
  extractionJob: { data: undefined },
  extractionSourceRuns: undefined,
  clientExtractionProgress: null,
  clearExtractionJob: vi.fn(),
  selectedProfileId: 'profile-1',
  setSelectedProfileId,
  pollExtractionJobId: null,
  createProfile: { isPending: false, mutateAsync: vi.fn() },
  updateProfile: { isPending: false, mutateAsync: vi.fn() },
  deleteProfile: { isPending: false, mutateAsync: vi.fn() },
  startExtraction: { mutateAsync: vi.fn() },
  rerunExtraction: { mutateAsync: vi.fn() },
  cancelExtraction: { mutateAsync: vi.fn() },
  activateVersion: { mutateAsync: vi.fn() },
  generateOutputTest: { mutateAsync: vi.fn() },
};

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/hooks/useReconFeed', () => ({
  useReconFeed: () => ({ settings: { data: null } }),
}));

vi.mock('./ProfileLiveOutputTestPanel', () => ({
  default: () => null,
}));

vi.mock('./ProfileVersionHistory', () => ({
  default: () => null,
}));

vi.mock('./ProfileExtractionDialog', () => ({
  default: () => null,
}));

vi.mock('./ProfileExtractionProgressModal', () => ({
  default: () => null,
}));

function renderCoreProfile(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/admin/personal-branding/brand-identity"
          element={<CoreProfileTab brandIdentity={brandIdentity as never} />}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('CoreProfileTab section=pillars hydrate', () => {
  beforeEach(() => {
    scrollIntoView.mockReset();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
  });

  it('scrolls to pillars section and clears section query param', async () => {
    renderCoreProfile(
      '/admin/personal-branding/brand-identity?tab=core-profile&profileId=profile-1&section=pillars'
    );

    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalled();
    });

    expect(document.getElementById('brand-identity-section-pillars')).toBeTruthy();
  });
});
