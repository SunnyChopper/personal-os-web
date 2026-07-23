import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import { useContentTemplateAiJob } from '@/hooks/useContentTemplateAiJob';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  ApproveContentTemplateCandidateInput,
  BrandPlatform,
  BrainstormContentTemplatesResult,
  ContentTemplate,
  ContentTemplateAiJob,
  ContentTemplateAiJobKind,
  ContentTemplateBrainstormContextStats,
  ContentTemplateCandidate,
  ContentTemplateExtractionContextStats,
  ContentType,
  CreateContentTemplateInput,
  ExtractContentTemplatesResult,
  TemplateSourceKind,
  UpdateContentTemplateInput,
} from '@/types/api/personal-branding.dto';

export function useContentTemplates() {
  const queryClient = useQueryClient();
  const [sourceKind, setSourceKind] = useState<TemplateSourceKind>('GENERIC_URL');
  const [sourceUrl, setSourceUrl] = useState('');
  const [brainstormBrief, setBrainstormBrief] = useState('');
  const [brainstormContentType, setBrainstormContentType] = useState<ContentType | ''>('');
  const [brainstormPlatform, setBrainstormPlatform] = useState<BrandPlatform | ''>('');
  const [extractError, setExtractError] = useState<string | null>(null);
  const [brainstormError, setBrainstormError] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [lastExtractionStats, setLastExtractionStats] =
    useState<ContentTemplateExtractionContextStats | null>(null);
  const [lastBrainstormStats, setLastBrainstormStats] =
    useState<ContentTemplateBrainstormContextStats | null>(null);
  const [rejectingCandidate, setRejectingCandidate] = useState<ContentTemplateCandidate | null>(
    null
  );
  const [retryingCandidate, setRetryingCandidate] = useState<ContentTemplateCandidate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ContentTemplate | null>(null);
  const [templateFormOpen, setTemplateFormOpen] = useState(false);
  const [templateAiJobId, setTemplateAiJobId] = useState<string | null>(null);
  const [templateAiJobKind, setTemplateAiJobKind] = useState<ContentTemplateAiJobKind | null>(null);

  const templatesQ = useQuery({
    queryKey: queryKeys.personalBranding.contentTemplates.list(1, 100),
    queryFn: () => personalBrandingService.listContentTemplates(1, 100),
  });

  const candidatesQ = useQuery({
    queryKey: queryKeys.personalBranding.templateCandidates.list(1, 50, 'GENERATED'),
    queryFn: () => personalBrandingService.listContentTemplateCandidates(1, 50, 'GENERATED'),
  });

  const settingsQ = useQuery({
    queryKey: queryKeys.personalBranding.contentTemplateSettings(),
    queryFn: () => personalBrandingService.getContentTemplateSettings(),
  });

  const templates = templatesQ.data?.data ?? [];
  const candidates = candidatesQ.data?.data ?? [];

  const invalidateTemplates = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.personalBranding.contentTemplates.all(),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.personalBranding.templateCandidates.all(),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.personalBranding.rejectedTemplateFeedback.all(),
      }),
    ]);
  }, [queryClient]);

  const clearTemplateAiJob = useCallback(() => {
    setTemplateAiJobId(null);
    setTemplateAiJobKind(null);
  }, []);

  const handleTemplateAiTerminal = useCallback(
    async (job: ContentTemplateAiJob) => {
      const kind = job.kind;
      if (job.status === 'succeeded') {
        if (kind === 'brainstorm' && job.result && 'contextStats' in job.result) {
          setLastBrainstormStats((job.result as BrainstormContentTemplatesResult).contextStats);
        }
        if (kind === 'extract' && job.result && 'contextStats' in job.result) {
          setLastExtractionStats((job.result as ExtractContentTemplatesResult).contextStats);
        }
        await invalidateTemplates();
        if (kind === 'retry') {
          setRetryingCandidate(null);
        }
        clearTemplateAiJob();
        return;
      }
      if (job.status === 'failed') {
        const message = job.error ?? job.message ?? 'Content template AI failed';
        if (kind === 'brainstorm') setBrainstormError(message);
        if (kind === 'extract') setExtractError(message);
        if (kind === 'retry') setRetryError(message);
        clearTemplateAiJob();
      }
    },
    [clearTemplateAiJob, invalidateTemplates]
  );

  const handleTemplateAiClientTimeout = useCallback(() => {
    const message =
      'Template AI is still running but took longer than expected. Check candidates shortly or retry.';
    if (templateAiJobKind === 'brainstorm') setBrainstormError(message);
    if (templateAiJobKind === 'extract') setExtractError(message);
    if (templateAiJobKind === 'retry') setRetryError(message);
    clearTemplateAiJob();
  }, [clearTemplateAiJob, templateAiJobKind]);

  const templateAiJob = useContentTemplateAiJob(
    templateAiJobId,
    handleTemplateAiTerminal,
    handleTemplateAiClientTimeout
  );

  const templateAiJobActive =
    Boolean(templateAiJobId) &&
    (!templateAiJob.data ||
      templateAiJob.data.status === 'queued' ||
      templateAiJob.data.status === 'running');

  const templateAiProgressMessage =
    templateAiJob.data?.message ?? (templateAiJob.data?.status === 'queued' ? 'Queued…' : null);

  const createTemplateMutation = useMutation({
    mutationFn: (body: CreateContentTemplateInput) =>
      personalBrandingService.createContentTemplate(body),
    onSuccess: async () => {
      await invalidateTemplates();
      setTemplateFormOpen(false);
      setEditingTemplate(null);
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateContentTemplateInput }) =>
      personalBrandingService.updateContentTemplate(id, body),
    onSuccess: async () => {
      await invalidateTemplates();
      setTemplateFormOpen(false);
      setEditingTemplate(null);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) => personalBrandingService.deleteContentTemplate(templateId),
    onSuccess: invalidateTemplates,
  });

  const extractMutation = useMutation({
    mutationFn: () =>
      personalBrandingService.extractContentTemplates({
        sourceKind,
        sourceUrl: sourceUrl.trim(),
        count: 3,
      }),
    onMutate: () => setExtractError(null),
    onSuccess: (start) => {
      setTemplateAiJobKind('extract');
      setTemplateAiJobId(start.jobId);
    },
    onError: (err: Error) => setExtractError(err.message),
  });

  const brainstormMutation = useMutation({
    mutationFn: (brandProfileId: string) =>
      personalBrandingService.brainstormContentTemplates({
        brandProfileId,
        brief: brainstormBrief.trim() || null,
        contentType: brainstormContentType || null,
        platform: brainstormPlatform || null,
        count: 3,
      }),
    onMutate: () => setBrainstormError(null),
    onSuccess: (start) => {
      setTemplateAiJobKind('brainstorm');
      setTemplateAiJobId(start.jobId);
    },
    onError: (err: Error) => setBrainstormError(err.message),
  });

  const approveCandidateMutation = useMutation({
    mutationFn: ({
      candidateId,
      body,
    }: {
      candidateId: string;
      body?: ApproveContentTemplateCandidateInput;
    }) => personalBrandingService.approveContentTemplateCandidate(candidateId, body ?? {}),
    onSuccess: invalidateTemplates,
  });

  const rejectCandidateMutation = useMutation({
    mutationFn: ({
      candidateId,
      feedbackText,
    }: {
      candidateId: string;
      feedbackText: string | null;
    }) =>
      personalBrandingService.rejectContentTemplateCandidate(candidateId, {
        feedbackText: feedbackText ?? undefined,
      }),
    onSuccess: async () => {
      setRejectingCandidate(null);
      await invalidateTemplates();
    },
  });

  const retryCandidateMutation = useMutation({
    mutationFn: ({ candidateId, feedbackText }: { candidateId: string; feedbackText: string }) =>
      personalBrandingService.retryContentTemplateCandidate(candidateId, { feedbackText }),
    onMutate: () => setRetryError(null),
    onSuccess: (start) => {
      setTemplateAiJobKind('retry');
      setTemplateAiJobId(start.jobId);
    },
    onError: (err: Error) => setRetryError(err.message),
  });

  const isBrainstorming =
    brainstormMutation.isPending || (templateAiJobActive && templateAiJobKind === 'brainstorm');
  const isExtracting =
    extractMutation.isPending || (templateAiJobActive && templateAiJobKind === 'extract');
  const isRetrying =
    retryCandidateMutation.isPending || (templateAiJobActive && templateAiJobKind === 'retry');

  return {
    templatesQ,
    candidatesQ,
    settingsQ,
    templates,
    candidates,
    sourceKind,
    setSourceKind,
    sourceUrl,
    setSourceUrl,
    brainstormBrief,
    setBrainstormBrief,
    brainstormContentType,
    setBrainstormContentType,
    brainstormPlatform,
    setBrainstormPlatform,
    extractError,
    brainstormError,
    retryError,
    lastExtractionStats,
    lastBrainstormStats,
    brainstormProgressMessage:
      templateAiJobKind === 'brainstorm' ? templateAiProgressMessage : null,
    extractProgressMessage: templateAiJobKind === 'extract' ? templateAiProgressMessage : null,
    retryProgressMessage: templateAiJobKind === 'retry' ? templateAiProgressMessage : null,
    rejectingCandidate,
    setRejectingCandidate,
    retryingCandidate,
    setRetryingCandidate,
    editingTemplate,
    setEditingTemplate,
    templateFormOpen,
    setTemplateFormOpen,
    createTemplateMutation,
    updateTemplateMutation,
    deleteTemplateMutation,
    extractMutation,
    brainstormMutation,
    approveCandidateMutation,
    rejectCandidateMutation,
    retryCandidateMutation,
    isBrainstorming,
    isExtracting,
    isRetrying,
  };
}
