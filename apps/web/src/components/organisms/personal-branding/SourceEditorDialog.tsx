import { useEffect, useState } from 'react';
import { Eye, EyeOff, FolderGit, Globe, Loader2, Rss } from 'lucide-react';
import Dialog from '@/components/molecules/Dialog';
import Button from '@/components/atoms/Button';
import { FormField } from '@/components/molecules/FormField';
import { FormCheckbox } from '@/components/atoms/FormCheckbox';
import { FormInput } from '@/components/atoms/FormInput';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import {
  RADAR_AUTH_SCHEME_LABELS,
  RADAR_GITHUB_EVENT_TYPE_LABELS,
  RADAR_GITHUB_RELEASE_FILTER_LABELS,
  RADAR_SOURCE_TYPE_LABELS,
  RADAR_SYNC_CADENCE_LABELS,
} from '@/types/api/personal-branding.dto';
import type {
  CreateRadarSourceInput,
  RadarAuthScheme,
  RadarGithubEventType,
  RadarGithubReleaseFilter,
  RadarSource,
  RadarSourceType,
  RadarSyncCadence,
  UpdateRadarSourceInput,
} from '@/types/api/personal-branding.dto';
import { cn } from '@/lib/utils';
import { DialogFooter } from '@/pages/admin/personal-branding/PersonalBrandingPageTemplate';

type WizardStep = 'identify' | 'configure' | 'authenticate';

const WIZARD_STEPS: { id: WizardStep; label: string }[] = [
  { id: 'identify', label: 'Identify' },
  { id: 'configure', label: 'Configure' },
  { id: 'authenticate', label: 'Authenticate' },
];

const SOURCE_TYPE_OPTIONS: {
  value: RadarSourceType;
  icon: typeof Rss;
  description: string;
}[] = [
  {
    value: 'RSS',
    icon: Rss,
    description: 'Poll an RSS or Atom feed for articles and updates.',
  },
  {
    value: 'API',
    icon: Globe,
    description: 'Call a REST endpoint and ingest JSON responses.',
  },
  {
    value: 'GITHUB_REPO',
    icon: FolderGit,
    description: 'Watch a GitHub repo for commits, releases, issues, and pull requests.',
  },
];

const GITHUB_EVENT_TYPES = Object.keys(RADAR_GITHUB_EVENT_TYPE_LABELS) as RadarGithubEventType[];

const HTTP_METHODS = ['GET', 'POST'] as const;

export interface SourceEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initial?: RadarSource | null;
  isSubmitting?: boolean;
  onCreate: (body: CreateRadarSourceInput) => Promise<void>;
  onUpdate: (id: string, body: UpdateRadarSourceInput) => Promise<void>;
}

function WizardStepProgress({ currentStep }: { currentStep: WizardStep }) {
  const currentIndex = WIZARD_STEPS.findIndex((step) => step.id === currentStep);

  return (
    <nav aria-label="Wizard progress" className="mb-6">
      <ol className="flex items-center gap-2">
        {WIZARD_STEPS.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = step.id === currentStep;
          return (
            <li key={step.id} className="flex flex-1 items-center gap-2">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <span
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                    isComplete && 'bg-blue-600 text-white',
                    isCurrent &&
                      'bg-blue-600/15 text-blue-700 ring-2 ring-blue-500 dark:text-blue-200',
                    !isComplete &&
                      !isCurrent &&
                      'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {index + 1}
                </span>
                <span
                  className={cn(
                    'truncate text-xs font-medium',
                    isCurrent
                      ? 'text-blue-700 dark:text-blue-200'
                      : 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < WIZARD_STEPS.length - 1 ? (
                <div
                  className={cn(
                    'mb-5 h-0.5 flex-1 rounded-full',
                    index < currentIndex ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  )}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function SecretTokenField({
  id,
  value,
  onChange,
  placeholder,
  hasStoredSecret,
  clearSecret,
  onClearSecretChange,
  showClearOption,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  hasStoredSecret?: boolean;
  clearSecret?: boolean;
  onClearSecretChange?: (checked: boolean) => void;
  showClearOption?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Secret token
        </label>
        {hasStoredSecret ? (
          <span className="text-xs text-gray-500">
            {clearSecret ? 'Will be cleared' : 'Configured'}
          </span>
        ) : null}
      </div>
      <div className="relative">
        <FormInput
          id={id}
          type={revealed ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full pr-10"
        />
        <button
          type="button"
          onClick={() => setRevealed((prev) => !prev)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          aria-label={revealed ? 'Hide secret token' : 'Show secret token'}
        >
          {revealed ? (
            <EyeOff className="size-4" aria-hidden />
          ) : (
            <Eye className="size-4" aria-hidden />
          )}
        </button>
      </div>
      {showClearOption && hasStoredSecret ? (
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <FormCheckbox
            checked={clearSecret ?? false}
            onChange={(e) => onClearSecretChange?.(e.target.checked)}
          />
          Clear stored secret
        </label>
      ) : null}
    </div>
  );
}

export default function SourceEditorDialog({
  isOpen,
  onClose,
  initial,
  isSubmitting = false,
  onCreate,
  onUpdate,
}: SourceEditorDialogProps) {
  const [step, setStep] = useState<WizardStep>('identify');
  const [name, setName] = useState('');
  const [sourceType, setSourceType] = useState<RadarSourceType>('RSS');
  const [endpoint, setEndpoint] = useState('');
  const [httpMethod, setHttpMethod] = useState<(typeof HTTP_METHODS)[number]>('GET');
  const [authScheme, setAuthScheme] = useState<RadarAuthScheme>('BEARER');
  const [authHeaderName, setAuthHeaderName] = useState('');
  const [authQueryParamName, setAuthQueryParamName] = useState('');
  const [secretToken, setSecretToken] = useState('');
  const [clearSecret, setClearSecret] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [cadence, setCadence] = useState<RadarSyncCadence | ''>('');
  const [githubOwner, setGithubOwner] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [githubEventTypes, setGithubEventTypes] = useState<RadarGithubEventType[]>(['COMMITS']);
  const [githubReleaseFilter, setGithubReleaseFilter] = useState<RadarGithubReleaseFilter>('ALL');
  const [githubAiFilterEnabled, setGithubAiFilterEnabled] = useState(true);
  const [githubAiFilterInstructions, setGithubAiFilterInstructions] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setStep('identify');
    if (initial) {
      setName(initial.name);
      setSourceType(initial.sourceType);
      setEndpoint(initial.endpoint);
      setHttpMethod(initial.httpMethod?.toUpperCase() === 'POST' ? 'POST' : 'GET');
      setAuthScheme(initial.authScheme ?? 'BEARER');
      setAuthHeaderName(initial.authHeaderName ?? '');
      setAuthQueryParamName(initial.authQueryParamName ?? '');
      setSecretToken('');
      setClearSecret(false);
      setEnabled(initial.enabled);
      setCadence((initial.cadence as RadarSyncCadence | null) ?? '');
      setGithubOwner(initial.githubConfig?.owner ?? '');
      setGithubRepo(initial.githubConfig?.repo ?? '');
      setGithubEventTypes(initial.githubConfig?.eventTypes ?? ['COMMITS']);
      setGithubReleaseFilter(initial.githubConfig?.releaseFilter ?? 'ALL');
      setGithubAiFilterEnabled(initial.githubConfig?.aiFilterEnabled ?? true);
      setGithubAiFilterInstructions(initial.githubConfig?.aiFilterInstructions ?? '');
    } else {
      setName('');
      setSourceType('RSS');
      setEndpoint('');
      setHttpMethod('GET');
      setAuthScheme('BEARER');
      setAuthHeaderName('');
      setAuthQueryParamName('');
      setSecretToken('');
      setClearSecret(false);
      setEnabled(true);
      setCadence('');
      setGithubOwner('');
      setGithubRepo('');
      setGithubEventTypes(['COMMITS']);
      setGithubReleaseFilter('ALL');
      setGithubAiFilterEnabled(true);
      setGithubAiFilterInstructions('');
    }
  }, [isOpen, initial]);

  const handleSourceTypeChange = (nextType: RadarSourceType) => {
    setSourceType(nextType);
    if (nextType === 'RSS') {
      setHttpMethod('GET');
      setAuthScheme('BEARER');
      setAuthHeaderName('');
      setAuthQueryParamName('');
    } else if (nextType === 'GITHUB_REPO') {
      setHttpMethod('GET');
      setAuthScheme('BEARER');
      setAuthHeaderName('');
      setAuthQueryParamName('');
    }
  };

  const toggleGithubEventType = (eventType: RadarGithubEventType) => {
    setGithubEventTypes((current) =>
      current.includes(eventType)
        ? current.filter((value) => value !== eventType)
        : [...current, eventType]
    );
  };

  const buildPayload = () => {
    if (sourceType === 'GITHUB_REPO') {
      const owner = githubOwner.trim();
      const repo = githubRepo.trim();
      return {
        name: name.trim(),
        sourceType,
        endpoint: `https://github.com/${owner}/${repo}`,
        httpMethod: 'GET' as const,
        authScheme: 'BEARER' as const,
        authHeaderName: null,
        authQueryParamName: null,
        enabled,
        cadence: cadence || null,
        githubConfig: {
          owner,
          repo,
          eventTypes: githubEventTypes,
          releaseFilter: githubReleaseFilter,
          aiFilterEnabled: githubAiFilterEnabled,
          aiFilterInstructions: githubAiFilterInstructions.trim() || null,
        },
      };
    }

    return {
      name: name.trim(),
      sourceType,
      endpoint: endpoint.trim(),
      httpMethod: sourceType === 'API' ? httpMethod : 'GET',
      authScheme: sourceType === 'API' ? authScheme : 'NONE',
      authHeaderName: authHeaderName.trim() || null,
      authQueryParamName: authQueryParamName.trim() || null,
      enabled,
      cadence: cadence || null,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const base = buildPayload();

    if (initial) {
      const body: UpdateRadarSourceInput = { ...base };
      if (clearSecret) {
        body.secretToken = null;
      } else if (secretToken.trim()) {
        body.secretToken = secretToken.trim();
      }
      await onUpdate(initial.id, body);
    } else {
      await onCreate({
        ...base,
        secretToken: secretToken.trim() || undefined,
      });
    }
    onClose();
  };

  const canAdvanceFromIdentify = name.trim().length > 0;
  const canAdvanceFromConfigure =
    sourceType === 'GITHUB_REPO'
      ? githubOwner.trim().length > 0 && githubRepo.trim().length > 0 && githubEventTypes.length > 0
      : endpoint.trim().length > 0;
  const showApiAuthFields = sourceType === 'API' && authScheme !== 'NONE';

  const dialogTitle = initial ? 'Edit radar source' : 'New radar source';

  return (
    <Dialog
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title={dialogTitle}
      size="lg"
    >
      <WizardStepProgress currentStep={step} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset disabled={isSubmitting} className="space-y-4">
          {step === 'identify' ? (
            <div className="space-y-4">
              <FormField
                label="Name"
                htmlFor="radar-source-name"
                required
                hint="A short label so you can recognize this source in Trend Stream."
              >
                <FormInput
                  id="radar-source-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Hacker News front page"
                  required
                />
              </FormField>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Source type<span className="ml-0.5 text-red-500">*</span>
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {SOURCE_TYPE_OPTIONS.map(({ value, icon: Icon, description }) => (
                    <button
                      key={value}
                      type="button"
                      aria-label={RADAR_SOURCE_TYPE_LABELS[value]}
                      onClick={() => handleSourceTypeChange(value)}
                      className={cn(
                        'rounded-xl border p-4 text-left transition',
                        sourceType === value
                          ? 'border-blue-500/60 bg-blue-600/10 ring-1 ring-blue-500/40'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800/60'
                      )}
                      aria-pressed={sourceType === value}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            'flex size-10 shrink-0 items-center justify-center rounded-lg',
                            sourceType === value
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                          )}
                        >
                          <Icon className="size-5" aria-hidden />
                        </span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {RADAR_SOURCE_TYPE_LABELS[value]}
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === 'configure' ? (
            <div className="space-y-4">
              {sourceType === 'GITHUB_REPO' ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Repository owner" htmlFor="github-owner" required>
                      <FormInput
                        id="github-owner"
                        value={githubOwner}
                        onChange={(e) => setGithubOwner(e.target.value)}
                        placeholder="langchain-ai"
                        required
                      />
                    </FormField>
                    <FormField label="Repository name" htmlFor="github-repo" required>
                      <FormInput
                        id="github-repo"
                        value={githubRepo}
                        onChange={(e) => setGithubRepo(e.target.value)}
                        placeholder="langgraph"
                        required
                      />
                    </FormField>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Poll for updates<span className="ml-0.5 text-red-500">*</span>
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {GITHUB_EVENT_TYPES.map((eventType) => (
                        <label
                          key={eventType}
                          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700"
                        >
                          <FormCheckbox
                            checked={githubEventTypes.includes(eventType)}
                            onChange={() => toggleGithubEventType(eventType)}
                          />
                          {RADAR_GITHUB_EVENT_TYPE_LABELS[eventType]}
                        </label>
                      ))}
                    </div>
                  </div>

                  {githubEventTypes.includes('RELEASES') ? (
                    <FormField label="Release filter" htmlFor="github-release-filter">
                      <Select
                        id="github-release-filter"
                        value={githubReleaseFilter}
                        onChange={(e) =>
                          setGithubReleaseFilter(e.target.value as RadarGithubReleaseFilter)
                        }
                        className="w-full"
                      >
                        {(
                          Object.keys(
                            RADAR_GITHUB_RELEASE_FILTER_LABELS
                          ) as RadarGithubReleaseFilter[]
                        ).map((key) => (
                          <option key={key} value={key}>
                            {RADAR_GITHUB_RELEASE_FILTER_LABELS[key]}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  ) : null}

                  <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <FormCheckbox
                        checked={githubAiFilterEnabled}
                        onChange={(e) => setGithubAiFilterEnabled(e.target.checked)}
                      />
                      Filter out noise with AI
                    </label>
                    {githubAiFilterEnabled ? (
                      <FormField
                        label="Filtering instructions"
                        htmlFor="github-ai-instructions"
                        hint="Optional guidance for what should surface vs. be treated as noise."
                      >
                        <Textarea
                          id="github-ai-instructions"
                          value={githubAiFilterInstructions}
                          onChange={(e) => setGithubAiFilterInstructions(e.target.value)}
                          placeholder="Only surface major feature releases; skip dependency bumps and typo-fix commits."
                          rows={3}
                        />
                      </FormField>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <FormField
                    label={sourceType === 'RSS' ? 'Feed URL' : 'Endpoint URL'}
                    htmlFor="radar-source-endpoint"
                    required
                    hint={
                      sourceType === 'RSS'
                        ? 'Public RSS or Atom feed URL.'
                        : 'Full URL including path for the API endpoint.'
                    }
                  >
                    <FormInput
                      id="radar-source-endpoint"
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                      placeholder={
                        sourceType === 'RSS'
                          ? 'https://example.com/feed.xml'
                          : 'https://api.example.com/v1/trends'
                      }
                      required
                    />
                  </FormField>

                  {sourceType === 'API' ? (
                    <FormField
                      label="HTTP method"
                      hint="Most trend APIs use GET; choose POST only when required."
                    >
                      <div className="inline-flex rounded-lg border border-gray-300 p-0.5 dark:border-gray-600">
                        {HTTP_METHODS.map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setHttpMethod(method)}
                            className={cn(
                              'rounded-md px-4 py-1.5 text-sm font-medium transition',
                              httpMethod === method
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                            )}
                            aria-pressed={httpMethod === method}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </FormField>
                  ) : null}
                </>
              )}

              <FormField
                label="Per-source cadence"
                htmlFor="radar-source-cadence"
                hint="Leave on global cadence unless this source needs a different poll schedule."
              >
                <Select
                  id="radar-source-cadence"
                  value={cadence}
                  onChange={(e) => setCadence(e.target.value as RadarSyncCadence | '')}
                  className="w-full"
                >
                  <option value="">Use global cadence</option>
                  {(Object.keys(RADAR_SYNC_CADENCE_LABELS) as RadarSyncCadence[]).map((key) => (
                    <option key={key} value={key}>
                      {RADAR_SYNC_CADENCE_LABELS[key]}
                    </option>
                  ))}
                </Select>
              </FormField>

              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <FormCheckbox checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
                Enabled — include this source in scheduled ingestion
              </label>
            </div>
          ) : null}

          {step === 'authenticate' ? (
            <div className="space-y-4">
              {sourceType === 'RSS' ? (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Add a token only if the feed requires authentication.
                  </p>
                  <SecretTokenField
                    id="radar-secret-token"
                    value={secretToken}
                    onChange={setSecretToken}
                    placeholder={
                      initial?.hasSecret ? 'Enter new token to replace' : 'Optional auth token'
                    }
                    hasStoredSecret={initial?.hasSecret}
                    clearSecret={clearSecret}
                    onClearSecretChange={setClearSecret}
                    showClearOption={Boolean(initial?.hasSecret)}
                  />
                </>
              ) : sourceType === 'GITHUB_REPO' ? (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    A GitHub personal access token is optional for public repos, but recommended to
                    raise the API rate limit from 60 to 5,000 requests per hour.
                  </p>
                  <SecretTokenField
                    id="radar-github-token"
                    value={secretToken}
                    onChange={setSecretToken}
                    placeholder={
                      initial?.hasSecret
                        ? 'Enter new token to replace'
                        : 'Optional GitHub personal access token'
                    }
                    hasStoredSecret={initial?.hasSecret}
                    clearSecret={clearSecret}
                    onClearSecretChange={setClearSecret}
                    showClearOption={Boolean(initial?.hasSecret)}
                  />
                </>
              ) : (
                <>
                  <FormField label="Auth scheme" htmlFor="radar-auth-scheme">
                    <Select
                      id="radar-auth-scheme"
                      value={authScheme}
                      onChange={(e) => setAuthScheme(e.target.value as RadarAuthScheme)}
                      className="w-full"
                    >
                      {(Object.keys(RADAR_AUTH_SCHEME_LABELS) as RadarAuthScheme[]).map((key) => (
                        <option key={key} value={key}>
                          {RADAR_AUTH_SCHEME_LABELS[key]}
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  {authScheme === 'NONE' ? (
                    <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-600 dark:bg-gray-900/40 dark:text-gray-400">
                      No authentication required for this endpoint.
                    </p>
                  ) : null}

                  {showApiAuthFields && authScheme === 'HEADER' ? (
                    <FormField label="Auth header name" htmlFor="radar-auth-header" required>
                      <FormInput
                        id="radar-auth-header"
                        value={authHeaderName}
                        onChange={(e) => setAuthHeaderName(e.target.value)}
                        placeholder="X-API-Key"
                        required
                      />
                    </FormField>
                  ) : null}

                  {showApiAuthFields && authScheme === 'QUERY' ? (
                    <FormField label="Auth query param name" htmlFor="radar-auth-query" required>
                      <FormInput
                        id="radar-auth-query"
                        value={authQueryParamName}
                        onChange={(e) => setAuthQueryParamName(e.target.value)}
                        placeholder="api_key"
                        required
                      />
                    </FormField>
                  ) : null}

                  {showApiAuthFields ? (
                    <SecretTokenField
                      id="radar-secret-token"
                      value={secretToken}
                      onChange={setSecretToken}
                      placeholder={
                        initial?.hasSecret ? 'Enter new token to replace' : 'Optional auth token'
                      }
                      hasStoredSecret={initial?.hasSecret}
                      clearSecret={clearSecret}
                      onClearSecretChange={setClearSecret}
                      showClearOption={Boolean(initial?.hasSecret)}
                    />
                  ) : null}
                </>
              )}
            </div>
          ) : null}

          <DialogFooter className="justify-between">
            <div>
              {step !== 'identify' ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setStep(step === 'authenticate' ? 'configure' : 'identify')}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {step === 'identify' ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setStep('configure')}
                  disabled={!canAdvanceFromIdentify || isSubmitting}
                >
                  Next
                </Button>
              ) : null}

              {step === 'configure' ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setStep('authenticate')}
                  disabled={!canAdvanceFromConfigure || isSubmitting}
                >
                  Next
                </Button>
              ) : null}

              {step === 'authenticate' ? (
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !canAdvanceFromIdentify || !canAdvanceFromConfigure}
                  className="inline-flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  {initial ? 'Save changes' : 'Create source'}
                </Button>
              ) : null}
            </div>
          </DialogFooter>
        </fieldset>
      </form>
    </Dialog>
  );
}
