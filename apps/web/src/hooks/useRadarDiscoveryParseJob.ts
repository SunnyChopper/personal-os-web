import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  RadarDiscoveryParseJob,
  RadarDiscoveryParseJobStatus,
} from '@/types/api/personal-branding.dto';

const POLL_STATUSES: RadarDiscoveryParseJobStatus[] = ['queued', 'running'];
const CLIENT_WAIT_BUDGET_MS = 5 * 60 * 1000;

export function radarDiscoveryParseJobPollInterval(
  job?: Pick<RadarDiscoveryParseJob, 'status' | 'pollAfterMs'> | null
) {
  if (!job || !POLL_STATUSES.includes(job.status)) return false;
  return Math.max(1500, Math.min(job.pollAfterMs ?? 3000, 5000));
}

export function useRadarDiscoveryParseJob(
  jobId: string | null,
  onTerminal?: (job: RadarDiscoveryParseJob) => void,
  onClientTimeout?: () => void
) {
  const startedAtRef = useRef<number | null>(null);
  const notifiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (jobId) {
      startedAtRef.current = Date.now();
      notifiedRef.current = null;
      return;
    }
    startedAtRef.current = null;
    notifiedRef.current = null;
  }, [jobId]);

  const query = useQuery({
    queryKey: queryKeys.personalBranding.radarDiscovery.parseJobs.detail(jobId ?? ''),
    queryFn: () => personalBrandingService.getRadarDiscoveryParseJob(jobId!),
    enabled: Boolean(jobId),
    refetchInterval: (q) => {
      const job = q.state.data;
      if (!jobId || !startedAtRef.current) return false;
      if (Date.now() - startedAtRef.current > CLIENT_WAIT_BUDGET_MS) {
        return false;
      }
      return radarDiscoveryParseJobPollInterval(job);
    },
  });

  useEffect(() => {
    if (!jobId || !startedAtRef.current) return;
    if (Date.now() - startedAtRef.current <= CLIENT_WAIT_BUDGET_MS) return;
    if (query.data && POLL_STATUSES.includes(query.data.status)) {
      onClientTimeout?.();
    }
  }, [jobId, query.dataUpdatedAt, query.data, onClientTimeout]);

  useEffect(() => {
    const job = query.data;
    if (!job || !jobId) return;
    if (POLL_STATUSES.includes(job.status)) return;
    const key = `${jobId}:${job.status}`;
    if (notifiedRef.current === key) return;
    notifiedRef.current = key;
    onTerminal?.(job);
  }, [query.data, jobId, onTerminal]);

  return query;
}
