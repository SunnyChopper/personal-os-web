/** Career / Resume Builder API DTOs (camelCase — matches backend BaseApiModel). */

export interface CareerProfile {
  userId: string;
  fullName: string;
  headline: string;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  linkedinUrl?: string | null;
  summary?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CareerEducation {
  id: string;
  userId: string;
  institution: string;
  degree?: string | null;
  field?: string | null;
  location?: string | null;
  gpa?: string | null;
  courses?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CareerAchievement {
  id: string;
  userId: string;
  jobId: string;
  text: string;
  metrics: Record<string, unknown>;
  tags: string[];
  source: string;
  displayOrder: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CareerJob {
  id: string;
  userId: string;
  company: string;
  title: string;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent: boolean;
  summary?: string | null;
  tags: string[];
  displayOrder: number;
  achievements: CareerAchievement[];
  createdAt: string;
  updatedAt: string;
}

export interface CareerAiSuggestion {
  id: string;
  jobId?: string | null;
  kind: string;
  status: string;
  suggestedTags: string[];
  suggestedText?: string | null;
  rationale?: string | null;
  feedback?: string | null;
  jobCompany?: string | null;
  jobTitle?: string | null;
  jobLocation?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CareerJobBoardDetection {
  provider?: string | null;
  companySlug?: string | null;
  boardId?: string | null;
  externalJobId?: string | null;
  normalizedSourceUrl?: string | null;
  confidence: number;
  warnings: string[];
  label: string;
}

export interface CareerJobPostingExtractedStructure {
  title?: string | null;
  company?: string | null;
  location?: string | null;
  compensationText?: string | null;
  seniority?: string | null;
  requiredYearsMin?: number | null;
  requiredYearsMax?: number | null;
  roleGuess?: string | null;
  companyGuess?: string | null;
  mustHaveSkills?: string[];
  niceToHaveSkills?: string[];
  responsibilitiesSummary?: string;
  mandatoryKeywords?: string[];
  atsKeywords?: string[];
  confidence?: number;
  fieldConfidences?: Record<string, number>;
}

export interface CareerJobPostingPreview {
  status: string;
  detection: CareerJobBoardDetection;
  extractedStructure: CareerJobPostingExtractedStructure;
  lowConfidenceFields: string[];
  extractionFlags: string[];
  fetchError?: string | null;
  needsUserInput: boolean;
  rawTextPreview: string;
}

export interface CareerJobPostingIngestResult {
  posting: CareerJobPosting;
  source?: CareerJobSource | null;
  duplicate: boolean;
  duplicateReason?: string | null;
  mergeAction: string;
  snapshotId?: string | null;
}

export interface CareerJobPostingPatchRequest {
  title?: string | null;
  company?: string | null;
  location?: string | null;
  provider?: string | null;
  companySlug?: string | null;
  boardId?: string | null;
  externalJobId?: string | null;
  seniority?: string | null;
  compensationText?: string | null;
  fitStatus?: string | null;
}

export interface CareerJobSource {
  id: string;
  provider: string;
  companySlug?: string | null;
  boardId?: string | null;
  displayName?: string | null;
  sourceHomeUrl?: string | null;
  crawlEnabled: boolean;
  lastCrawledAt?: string | null;
  lastCrawlStatus?: string | null;
  lastCrawlError?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CareerJobRelevanceAssessment {
  frameworkVersion?: string;
  verdict?: 'relevant' | 'irrelevant';
  score?: number;
  confidence?: number;
  hardPassReasons?: string[];
  dimensionScores?: {
    location?: number;
    techStack?: number;
    seniority?: number;
    domain?: number;
  };
  evidence?: string[];
  rationale?: string;
  provider?: string;
  model?: string;
  inputFingerprint?: string;
  locationUnknown?: boolean;
}

export interface CareerJobScrapeRunSummary {
  id: string;
  status: string;
  trigger: string;
  sourcesTotal: number;
  sourcesSucceeded: number;
  sourcesFailed: number;
  postingsDiscovered: number;
  postingsIngested: number;
  postingsAssessed: number;
  relevantCount: number;
  irrelevantCount: number;
  errorSummary?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CareerJobScrapeRunSourceRun {
  id: string;
  sourceId: string;
  status: string;
  postingsDiscovered: number;
  postingsIngested: number;
  postingsAssessed: number;
  relevantCount: number;
  irrelevantCount: number;
  errorMessage?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
}

export interface CareerJobScrapeRunDetail extends CareerJobScrapeRunSummary {
  sourceRuns: CareerJobScrapeRunSourceRun[];
}

export interface CareerJobScrapeRunListResult {
  items: CareerJobScrapeRunSummary[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CareerJobScrapeRunStartResult {
  runId: string;
  status: string;
  trigger: string;
}

export interface CareerJobPostingListResult {
  items: CareerJobPosting[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CareerJobPosting {
  id: string;
  sourceUrl?: string | null;
  normalizedSourceUrl?: string | null;
  rawText: string;
  fetchedText?: string | null;
  companyGuess?: string | null;
  roleGuess?: string | null;
  jobBoard?: string | null;
  jobBoardCompanyId?: string | null;
  provider?: string | null;
  companySlug?: string | null;
  boardId?: string | null;
  externalJobId?: string | null;
  sourceId?: string | null;
  title?: string | null;
  company?: string | null;
  location?: string | null;
  compensationText?: string | null;
  seniority?: string | null;
  requiredYearsMin?: number | null;
  requiredYearsMax?: number | null;
  extractionConfidence?: number | null;
  lowConfidenceFields?: string[];
  extractionFlags?: string[];
  extractedStructure?: Record<string, unknown>;
  fitStatus?: string;
  relevanceAssessment?: CareerJobRelevanceAssessment;
  scrapeOrigin?: string | null;
  lastSeenAt?: string | null;
  latestSnapshotId?: string | null;
  requirements: {
    mustHaveSkills?: string[];
    niceToHaveSkills?: string[];
    responsibilitiesSummary?: string;
  };
  atsKeywords: string[];
  mandatoryKeywords?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CareerResumeSectionAddress {
  sectionId: string;
  sectionType: string;
  itemType?: string | null;
  jobId?: string | null;
  achievementId?: string | null;
  itemId?: string | null;
  index?: number | null;
}

export interface CareerResumeDraftSection {
  sectionId: string;
  sectionType: string;
  title: string;
  contentMarkdown: string;
  contentPlainText: string;
  sourceAchievementIds: string[];
  jobId?: string | null;
  achievementId?: string | null;
  index?: number | null;
  manuallyEdited: boolean;
  provenanceOk: boolean;
  provenanceMessage?: string | null;
}

export interface CareerResumeProvenanceItem {
  sectionId: string;
  bulletText: string;
  sourceAchievementIds: string[];
  supported: boolean;
  message: string;
}

export interface CareerResumeQualityWarning {
  code: string;
  message: string;
  sectionId?: string | null;
}

export interface CareerResumeAtsScoreComponent {
  componentId: string;
  label: string;
  weight: number;
  maxPoints: number;
  earnedPoints: number;
  matched: string[];
  missing: string[];
  detail: string;
}

export interface CareerResumeAtsScoreBreakdown {
  totalScore: number;
  components: CareerResumeAtsScoreComponent[];
  suggestions: string[];
}

export interface CareerResumeAtsScorePreview {
  atsScore: number;
  atsScoreBreakdown: CareerResumeAtsScoreBreakdown;
  mandatoryKeywords: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  cached?: boolean;
}

export type CareerGeneratedResumeSortBy =
  | 'createdAt'
  | 'companyName'
  | 'jobTitle'
  | 'atsScore'
  | 'resumeTemplate'
  | 'provider';

export interface CareerGeneratedResumeListParams {
  page?: number;
  pageSize?: number;
  search?: string | null;
  sortBy?: CareerGeneratedResumeSortBy;
  sortOrder?: 'asc' | 'desc';
}

export interface CareerGeneratedResumeLinkedApplication {
  id: string;
  company: string;
  role: string;
  status: string;
  appliedAt?: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CareerGeneratedResume {
  id: string;
  jobPostingId?: string | null;
  achievementIds: string[];
  resumeMarkdown: string;
  resumePlainText: string;
  atsKeywordsUsed: string[];
  biasStrategyNotes?: string | null;
  /** Deterministic ATS score (canonical for display and export gating). */
  atsScore?: number | null;
  humanScore?: number | null;
  resumeTemplate?: string | null;
  provider?: string | null;
  model?: string | null;
  bulletRationales?: CareerResumeBulletRationale[];
  companyName?: string | null;
  jobTitle?: string | null;
  mandatoryKeywords?: string[];
  matchedKeywords?: string[];
  missingKeywords?: string[];
  resumeSections?: CareerResumeDraftSection[];
  provenance?: CareerResumeProvenanceItem[];
  qualityWarnings?: CareerResumeQualityWarning[];
  qualityStatus?: string;
  exportReady?: boolean;
  atsScoreBreakdown?: CareerResumeAtsScoreBreakdown | null;
  atsScoreBefore?: number | null;
  atsScoreDelta?: number | null;
  llmAtsScore?: number | null;
  draftRevision?: number;
  cached?: boolean;
  confidence?: number | null;
  jobPosting?: CareerJobPosting | null;
  application?: CareerGeneratedResumeLinkedApplication | null;
  createdAt: string;
  updatedAt: string;
}

export interface CareerGeneratedResumeListResult {
  items: CareerGeneratedResume[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CareerResumeBulletRationale {
  bulletText: string;
  achievementId?: string | null;
  sourceAchievementIds?: string[];
  keywords: string[];
  reason: string;
}

export type CareerResumeExportFormat = 'pdf' | 'docx' | 'markdown' | 'plainText';

export interface CareerResumeTemplate {
  templateId: string;
  name: string;
  description?: string | null;
  isBuiltIn: boolean;
  thumbnailSvg?: string | null;
  supportedFormats: CareerResumeExportFormat[];
  sourceFormat?: string | null;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CareerResumeTemplateImportResult {
  template: CareerResumeTemplate;
  parseWarnings: string[];
}

export interface CareerResumeExportResult {
  exportId: string;
  format: CareerResumeExportFormat;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  downloadUrl: string;
  expiresAt: string;
}

/** Job application tracker (Resume Builder companion). */

export type CareerApplicationStatusApi =
  | 'applied'
  | 'rejected'
  | 'firstInterview'
  | 'nthInterview'
  | 'finalInterview'
  | 'offerReceived'
  | 'acceptedOffer';

export type CareerFitRecommendationApi = 'apply' | 'maybe' | 'skip';

export type CareerApplicationEventTypeApi = 'statusChange' | 'interview' | 'note' | 'rejection';

export type CareerRejectionTriageBucketApi = 'AUTOMATED_FAST' | 'HUMAN_REVIEW' | 'UNKNOWN';

export type CareerReachClassificationApi = 'strongFit' | 'stretch' | 'outOfReach';

export type CareerSubScoreStatusApi = 'strong' | 'partial' | 'weak' | 'gap';

export type CareerGapSeverityApi = 'low' | 'medium' | 'high' | 'critical';

export type CareerGapActionKindApi =
  | 'add_bullet'
  | 'add_skill_evidence'
  | 'training'
  | 'networking'
  | 'other';

export type CareerNudgePriorityApi = 'high' | 'medium' | 'low';

export type CareerKeywordRequirementLevelApi = 'mandatory' | 'niceToHave';

export type CareerKeywordCoverageStatusApi = 'matched' | 'partial' | 'missing';

export interface CareerFitSubScoreItem {
  score: number;
  status: CareerSubScoreStatusApi;
  reason: string;
  evidence: string[];
}

export interface CareerFitSubScores {
  skillsMatch: CareerFitSubScoreItem;
  seniorityMatch: CareerFitSubScoreItem;
  yearsExperienceGap: CareerFitSubScoreItem;
  domainMatch: CareerFitSubScoreItem;
  locationCompFit: CareerFitSubScoreItem;
}

export interface CareerFitGap {
  id: string;
  category: string;
  description: string;
  severity: CareerGapSeverityApi;
  actionable: boolean;
  actionKind: CareerGapActionKindApi;
  evidence: string;
  linkedKeyword?: string | null;
  linkedAchievementIds: string[];
}

export interface CareerKeywordCoverageItem {
  keyword: string;
  requirementLevel: CareerKeywordRequirementLevelApi;
  status: CareerKeywordCoverageStatusApi;
  matchedAchievementIds: string[];
  evidenceSnippets: string[];
  rationale: string;
}

export interface CareerFitNudge {
  id: string;
  priority: CareerNudgePriorityApi;
  category: string;
  action: string;
  why: string;
  linkedGapId?: string | null;
  linkedKeyword?: string | null;
  linkedAchievementIds: string[];
  suggestedAchievementDraft?: string | null;
  timeHorizon?: string | null;
}

export interface CareerCalibrationSignal {
  signalType: string;
  theme?: string | null;
  count: number;
  explanation: string;
}

export interface CareerApplicationRecommendation {
  id: string;
  userId: string;
  jobPostingId?: string | null;
  applicationId?: string | null;
  generatedResumeId?: string | null;
  recommendation: string;
  fitScore?: number | null;
  confidence?: number | null;
  reachClassification?: CareerReachClassificationApi;
  reachReasons?: string[];
  subScores?: CareerFitSubScores;
  gaps?: CareerFitGap[];
  keywordCoverage?: CareerKeywordCoverageItem[];
  nudges?: CareerFitNudge[];
  calibrationSignals?: CareerCalibrationSignal[];
  matchedSignals: string[];
  gapSignals: string[];
  rejectionRiskSignals: string[];
  resumeAdjustments: string[];
  rationale: string;
  provider?: string | null;
  model?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CareerRecommendApplicationsResult {
  jobPosting: CareerJobPosting;
  recommendation: CareerApplicationRecommendation;
  result: CareerApplicationRecommendation;
  confidence?: number | null;
  provider?: string | null;
  model?: string | null;
  cached?: boolean;
}

export interface CareerApplicationSummary {
  id: string;
  userId: string;
  company: string;
  role: string;
  location?: string | null;
  sourceUrl?: string | null;
  status: string;
  appliedAt?: string | null;
  archived: boolean;
  jobPostingId?: string | null;
  generatedResumeId?: string | null;
  recommendationId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CareerApplicationsListResult {
  items: CareerApplicationSummary[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CareerApplication {
  id: string;
  userId: string;
  jobPostingId?: string | null;
  generatedResumeId?: string | null;
  recommendationId?: string | null;
  resumeSnapshotName?: string | null;
  resumeSnapshotText?: string | null;
  company: string;
  role: string;
  location?: string | null;
  sourceUrl?: string | null;
  status: string;
  appliedAt?: string | null;
  statusUpdatedAt: string;
  notes?: string | null;
  archived: boolean;
  rejectionReceivedAt?: string | null;
  rejectionRawText?: string | null;
  rejectionTriageBucket?: CareerRejectionTriageBucketApi | null;
  createdAt: string;
  updatedAt: string;
}

export interface CareerApplicationAnalytics {
  totalApplications: number;
  rejectedCount: number;
  rejectionRate: number;
  triageBuckets: {
    automatedFast: number;
    humanReview: number;
    unknown: number;
  };
  sampleThemes: string[];
  statusCounts?: Record<string, number>;
  outcomes?: CareerApplicationOutcomeCounts;
  atsScoreBands?: CareerApplicationOutcomeBucket[];
  resumeTemplates?: CareerApplicationOutcomeBucket[];
  providers?: CareerApplicationOutcomeBucket[];
  fitTiers?: CareerApplicationOutcomeBucket[];
}

export interface CareerApplicationOutcomeCounts {
  applicationCount: number;
  interviewCount: number;
  offerCount: number;
  acceptedOfferCount: number;
  rejectedCount: number;
  interviewRate: number;
  offerRate: number;
  acceptedOfferRate: number;
}

export interface CareerApplicationOutcomeBucket extends CareerApplicationOutcomeCounts {
  bucket: string;
  label: string;
}

export interface CareerApplicationGeneratedResumeSummary {
  id: string;
  jobPostingId?: string | null;
  companyName?: string | null;
  jobTitle?: string | null;
  atsScore?: number | null;
  humanScore?: number | null;
  resumeTemplate?: string | null;
  provider?: string | null;
  model?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CareerApplicationEvent {
  id: string;
  userId: string;
  applicationId: string;
  eventType: string;
  status?: string | null;
  eventAt: string;
  interviewRound?: number | null;
  title?: string | null;
  notes?: string | null;
  rejectionReasonCategory?: string | null;
  rejectionEmailText?: string | null;
  rejectionTriageBucket?: CareerRejectionTriageBucketApi | null;
  rejectionThemes: string[];
  actionableLesson?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CareerApplicationDetail {
  application: CareerApplication;
  events: CareerApplicationEvent[];
  recommendation?: CareerApplicationRecommendation | null;
  jobPosting?: CareerJobPosting | null;
  generatedResume?: CareerApplicationGeneratedResumeSummary | null;
}
