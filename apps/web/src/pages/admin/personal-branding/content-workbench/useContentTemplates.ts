import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  ApproveContentTemplateCandidateInput,
  ContentTemplate,
  ContentTemplateCandidate,
  ContentTemplateExtractionContextStats,
  CreateContentTemplateInput,
  TemplateSourceKind,
  UpdateContentTemplateInput,
} from '@/types/api/personal-branding.dto';

export function useContentTemplates() {
  const queryClient = useQueryClient();
  const [sourceKind, setSourceKind] = useState<TemplateSourceKind>('GENERIC_URL');
  const [sourceUrl, setSourceUrl] = useState('');
  const [mediumApiKey, setMediumApiKey] = useState('');
  const [extractError, setExtractError] = useState<string | null>(null);
  const [lastExtractionStats, setLastExtractionStats] =
    useState<ContentTemplateExtractionContextStats | null>(null);
  const [rejectingCandidate, setRejectingCandidate] = useState<ContentTemplateCandidate | null>(
    null
  );
  const [retryingCandidate, setRetryingCandidate] = useState<ContentTemplateCandidate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ContentTemplate | null>(null);
  const [templateFormOpen, setTemplateFormOpen] = useState(false);

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
    onSuccess: async (result) => {
      setLastExtractionStats(result.contextStats);
      await invalidateTemplates();
    },
    onError: (err: Error) => setExtractError(err.message),
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
    onSuccess: async () => {
      setRetryingCandidate(null);
      await invalidateTemplates();
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (key: string) =>
      personalBrandingService.updateContentTemplateSettings({
        mediumApiKey: key.trim() || null,
      }),
    onSuccess: async () => {
      setMediumApiKey('');
      await queryClient.invalidateQueries({
        queryKey: queryKeys.personalBranding.contentTemplateSettings(),
      });
    },
  });

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
    mediumApiKey,
    setMediumApiKey,
    extractError,
    lastExtractionStats,
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
    approveCandidateMutation,
    rejectCandidateMutation,
    retryCandidateMutation,
    saveSettingsMutation,
  };
}
