export interface AgencyArtifact {
  id: string;
  title: string;
  summary: string;
  apiCapitalBurnedUsd?: number | null;
  humanTimeSavedHours?: number | null;
  roiSummary: string;
  stack: string[];
  demoUrl: string;
  repoUrl: string;
  displayOrder: number;
  isPublic: boolean;
  publicSlug?: string | null;
  publicTitle?: string | null;
  publicSummary?: string | null;
  publicContent?: string | null;
  publicFeatureTags: string[];
  publishedAt?: string | null;
  lastPublishSyncedAt?: string | null;
  publishSyncStatus?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
