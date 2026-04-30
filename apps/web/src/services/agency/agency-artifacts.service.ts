import { apiClient } from '@/lib/api-client';
import type { AgencyArtifact } from '@/types/agency-artifacts';

export async function listAgencyArtifacts(): Promise<AgencyArtifact[]> {
  const res = await apiClient.get<{ artifacts: AgencyArtifact[]; total: number }>(
    '/agency-artifacts',
  );
  if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed');
  return res.data.artifacts;
}

export async function createAgencyArtifact(
  body: Partial<AgencyArtifact> & { title: string },
): Promise<AgencyArtifact> {
  const res = await apiClient.post<AgencyArtifact>('/agency-artifacts', body);
  if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed');
  return res.data;
}
