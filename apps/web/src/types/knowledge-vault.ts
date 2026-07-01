import type { Area } from './growth-system';

export type VaultItemType =
  | 'note'
  | 'document'
  | 'course_lesson'
  | 'flashcard'
  | 'practice_question_set'
  | 'quiz'
  | 'homework_assignment';

export type PracticeArtifactStatus = 'draft' | 'active' | 'completed' | 'archived';
export type PracticeQuestionType = 'multiple_choice' | 'short_answer' | 'coding' | 'yes_no';
export type VaultItemStatus = 'draft' | 'active' | 'archived';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type QuestionType = 'yes_no' | 'multiple_choice';

export interface VaultItem {
  id: string;
  type: VaultItemType;
  title: string;
  content: string | null;
  tags: string[];
  area: Area;
  status: VaultItemStatus;
  searchableText: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string | null;
}

export interface Note extends VaultItem {
  type: 'note';
  linkedItems: string[];
  sourceUrl: string | null;
}

export type DocumentIndexingStatus = 'pending' | 'complete' | 'failed';

export interface Document extends VaultItem {
  type: 'document';
  fileUrl: string | null;
  sourceUrl?: string | null;
  fileType: string | null;
  pageCount: number | null;
  indexingStatus?: DocumentIndexingStatus | null;
  chunkCount?: number | null;
}

export interface VaultDocumentChunk {
  chunkIndex: number;
  content: string;
  tokenCount: number;
  pageFrom: number | null;
  pageTo: number | null;
  embeddingModel: string;
  embeddingVersion: number;
  createdAt: string;
}

export interface VaultDocumentUploadMetadata {
  fileId: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  s3Key: string;
}

export interface VaultDocumentDetail {
  document: Document;
  upload: VaultDocumentUploadMetadata | null;
  downloadUrl: string | null;
  chunks: VaultDocumentChunk[];
  defaultChunkSizeTokens: number;
  defaultChunkOverlapTokens: number;
  defaultMaxChunks: number;
  defaultMaxChars: number;
}

export interface VaultDocumentChunksList {
  chunks: VaultDocumentChunk[];
  total: number;
}

export interface VaultDocumentReingestInput {
  chunkSizeTokens: number;
  chunkOverlapTokens: number;
  maxChunks?: number;
  maxChars?: number;
}

export interface VaultDocumentReingestResult {
  documentId: string;
  indexingStatus: DocumentIndexingStatus;
  chunkCount: number;
}

export interface CourseLesson extends VaultItem {
  type: 'course_lesson';
  courseId: string;
  moduleId: string;
  lessonIndex: number;
  estimatedMinutes: number | null;
  completedAt: string | null;
  aiGenerated: boolean;
}

export interface Flashcard extends VaultItem {
  type: 'flashcard';
  /** Parent deck id (from API vault list) — required for review/update card. */
  deckId?: string;
  front: string;
  back: string;
  sourceItemId: string | null;
  nextReviewDate: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
}

export interface PracticeQuestionSetItem extends VaultItem {
  type: 'practice_question_set';
  questionCount: number;
  completedCount: number;
  difficulty: string | null;
  courseId: string | null;
  moduleId: string | null;
  lessonId: string | null;
  sourceItemIds: string[];
}

export interface QuizVaultItem extends VaultItem {
  type: 'quiz';
  questionCount: number;
  bestScorePercent: number | null;
  attemptCount: number;
  difficulty: string | null;
  courseId: string | null;
  moduleId: string | null;
  lessonId: string | null;
  sourceItemIds: string[];
}

export interface HomeworkVaultItem extends VaultItem {
  type: 'homework_assignment';
  dueDate: string | null;
  linkedTaskId: string | null;
  linkedProjectId: string | null;
  courseId: string | null;
  moduleId: string | null;
  lessonId: string | null;
  sourceItemIds: string[];
}

export interface PracticeSourceScope {
  sourceType: 'course' | 'module' | 'lesson' | 'note' | 'document' | 'vault';
  courseId?: string | null;
  moduleId?: string | null;
  lessonId?: string | null;
  sourceItemIds?: string[];
}

export interface PracticeQuestion {
  id: string;
  questionText: string;
  questionType: PracticeQuestionType;
  options: string[];
  correctAnswer: string | null;
  explanation?: string | null;
  hints?: string[];
}

export interface PracticeQuestionSet {
  id: string;
  title: string;
  artifactType: 'practice_question_set';
  questions: PracticeQuestion[];
  difficulty: string | null;
  status: PracticeArtifactStatus;
  sourceScope: PracticeSourceScope;
  completedCount: number;
  area: Area;
  tags: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuizArtifact {
  id: string;
  title: string;
  artifactType: 'quiz';
  questions: PracticeQuestion[];
  difficulty: string;
  adaptiveContextSummary: string | null;
  status: PracticeArtifactStatus;
  sourceScope: PracticeSourceScope;
  bestScorePercent: number | null;
  attemptCount: number;
  timeLimitMinutes: number | null;
  area: Area;
  tags: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  responses: Record<string, string>;
  scorePercent: number;
  correctCount: number;
  totalCount: number;
  completedAt: string;
  userId: string;
}

export interface HomeworkAssignment {
  id: string;
  title: string;
  artifactType: 'homework_assignment';
  prompt: string;
  deliverables: string[];
  rubric: string | null;
  dueDate: string | null;
  status: PracticeArtifactStatus;
  sourceScope: PracticeSourceScope;
  linkedTaskId: string | null;
  linkedProjectId: string | null;
  estimatedMinutes: number | null;
  completedAt: string | null;
  area: Area;
  tags: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type PracticeArtifact = PracticeQuestionSet | QuizArtifact | HomeworkAssignment;

/** Module + lesson outline from API (camelCase). */
export interface BackendCourseModule {
  id: string;
  title: string;
  description?: string | null;
  moduleIndex: number;
  lessons: Array<{
    id: string;
    title: string;
    description?: string | null;
    content?: string | null;
    order: number;
    estimatedMinutes?: number | null;
    isCompleted: boolean;
    completedAt?: string | null;
  }>;
}

/** Raw course from GET /knowledge/courses/:id (camelCase). */
export interface BackendCourse {
  id: string;
  title: string;
  description: string | null;
  topic: string | null;
  status: string;
  estimatedHours: number | null;
  difficulty?: DifficultyLevel | null;
  isAiGenerated?: boolean;
  knowledgeSource?: 'global' | 'vault' | null;
  aiGenerationContext?: string | null;
  preAssessment?: PreAssessmentStored | null;
  modules?: BackendCourseModule[] | null;
  lessons: Array<{
    id: string;
    title: string;
    description?: string | null;
    content?: string | null;
    order: number;
    estimatedMinutes?: number | null;
    isCompleted: boolean;
    completedAt?: string | null;
  }>;
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  startedAt?: string | null;
  completedAt?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  topic: string;
  difficulty: DifficultyLevel;
  estimatedHours: number | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isAiGenerated: boolean;
  knowledgeSource?: 'global' | 'vault' | null;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  moduleIndex: number;
  userId: string;
  createdAt: string;
}

export interface PreAssessmentQuestion {
  id: string;
  questionText: string;
  questionType: QuestionType;
  options: string[];
  correctAnswer?: string;
}

/** Snapshot persisted on the course (GET /knowledge/courses/:id). */
export interface PreAssessmentStored {
  questions: PreAssessmentQuestion[];
  userResponses: Record<string, string>;
  completedAt?: string | null;
}

export interface PreAssessment {
  id: string;
  courseId: string;
  questions: PreAssessmentQuestion[];
  userResponses: Record<string, string>;
  completedAt: string | null;
}

export interface ConceptConnection {
  id: string;
  sourceItemId: string;
  targetItemId: string;
  synthesisInsight: string;
  connectionStrength: number;
  userId: string;
  createdAt: string;
}

export interface CreateNoteInput {
  title: string;
  content?: string;
  tags?: string[];
  area: Area;
  linkedItems?: string[];
  sourceUrl?: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
  area?: Area;
  status?: VaultItemStatus;
  linkedItems?: string[];
  sourceUrl?: string;
}

export interface CreateDocumentInput {
  title: string;
  content?: string;
  tags?: string[];
  area: Area;
  fileUrl?: string;
  fileType?: string;
  pageCount?: number;
}

/** POST /knowledge/documents/from-file (camelCase body). */
export interface CreateDocumentFromFileInput {
  fileId: string;
  title: string;
  area: Area;
  tags?: string[];
  content?: string;
  fileType?: string;
}

export interface UpdateDocumentInput {
  title?: string;
  content?: string;
  tags?: string[];
  area?: Area;
  status?: VaultItemStatus;
  fileUrl?: string;
  fileType?: string;
  pageCount?: number;
}

/** Deck summary from GET/POST `/knowledge/flashcards` (wire = camelCase). */
export interface FlashcardDeck {
  id: string;
  name: string;
  description: string | null;
  topic: string | null;
  area?: Area | null;
  tags?: string[];
  sourceItemIds?: string[];
  totalCards: number;
  cardsDue: number;
  cardsNew: number;
  cardsMastered: number;
  lastStudiedAt: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeckFlashcardInput {
  front: string;
  back: string;
  sourceItemId?: string | null;
}

/** UI + service input for creating a deck. */
export interface CreateFlashcardDeckInput {
  name: string;
  description?: string;
  area?: Area;
  tags?: string[];
  sourceItemIds?: string[];
  flashcards: DeckFlashcardInput[];
}

export interface CreateFlashcardInput {
  title: string;
  front: string;
  back: string;
  tags?: string[];
  area: Area;
  sourceItemId?: string;
}

export interface UpdateFlashcardInput {
  title?: string;
  front?: string;
  back?: string;
  tags?: string[];
  area?: Area;
  status?: VaultItemStatus;
  sourceItemId?: string;
  nextReviewDate?: string;
  interval?: number;
  easeFactor?: number;
  repetitions?: number;
  /** Required for PATCH /knowledge/flashcards/:deckId/cards/:id */
  deckId?: string;
}

/** Embedded lesson for POST/PATCH /knowledge/courses (camelCase). */
export interface EmbeddedCourseLessonInput {
  id: string;
  title: string;
  description?: string | null;
  content?: string | null;
  order: number;
  estimatedMinutes?: number | null;
  isCompleted?: boolean;
  completedAt?: string | null;
}

/** Module tree for POST /knowledge/courses (camelCase). */
export interface CreateCourseModuleInput {
  id: string;
  title: string;
  description?: string | null;
  moduleIndex: number;
  lessons: EmbeddedCourseLessonInput[];
}

export interface CreateCourseInput {
  title: string;
  description?: string;
  topic: string;
  estimatedHours?: number | null;
  difficulty?: DifficultyLevel;
  isAiGenerated?: boolean;
  knowledgeSource?: 'global' | 'vault';
  aiGenerationContext?: string | null;
  preAssessment?: PreAssessmentStored;
  /** When set, backend flattens to `lessons`; omit `lessons` when using modules. */
  modules?: CreateCourseModuleInput[];
  /** When set, creates course with embedded lessons (backend shape). */
  lessons?: EmbeddedCourseLessonInput[];
}

export interface UpdateCourseInput {
  title?: string;
  description?: string;
  topic?: string;
  difficulty?: DifficultyLevel;
  lessons?: EmbeddedCourseLessonInput[];
}

/** POST/PATCH /knowledge/skills body (camelCase, matches backend BaseApiModel). */
export type SkillLevelApi = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master';

export interface CreateSkillInput {
  name: string;
  description?: string | null;
  category?: string | null;
  level?: SkillLevelApi;
  parentSkillIds?: string[];
  resources?: Array<Record<string, string>>;
}

export interface UpdateSkillInput {
  name?: string;
  description?: string | null;
  category?: string | null;
  level?: SkillLevelApi;
  progressPercentage?: number;
  parentSkillIds?: string[];
  resources?: Array<Record<string, string>>;
  knowledgeHalfLifeDays?: number | null;
  lastVerifiedAt?: string | null;
  verificationStatus?: string | null;
  decayRate?: number | null;
  linkedFlashcardDeckIds?: string[];
}

/** Backend GET /knowledge/skills (skill tree node). */
export interface SkillTreeSkill {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  level: string;
  progressPercentage: number;
  parentSkillIds: string[];
  childSkillIds: string[];
  resources: Array<Record<string, string>>;
  isUnlocked: boolean;
  isCompleted: boolean;
  completedAt: string | null;
  knowledgeHalfLifeDays: number | null;
  lastVerifiedAt: string | null;
  verificationStatus: string | null;
  decayRate: number | null;
  linkedFlashcardDeckIds: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/** Dark matter / ghost-node bridge suggestion from vault AI */
export interface GhostNodeSuggestion {
  name: string;
  bridgesFrom: string;
  bridgesTo: string;
  reason: string;
  suggestedDifficulty: string;
}

export interface SkillTreeApiResponse {
  skills: SkillTreeSkill[];
  totalSkills: number;
  unlockedSkills: number;
  completedSkills: number;
  categories: string[];
}

export interface GenerateCourseSkeletonInput {
  topic: string;
  preAssessment: PreAssessmentStored;
  targetDifficulty: DifficultyLevel;
  knowledgeSource?: 'global' | 'vault';
  /** Catalog model id when manual; omit for server vault defaults. */
  model?: string;
}

export interface GenerateLessonContentInput {
  courseId: string;
  lessonId: string;
  /** Catalog model id when manual; omit for server vault defaults. */
  model?: string;
}

export interface CreateConnectionInput {
  sourceItemId: string;
  targetItemId: string;
  synthesisInsight: string;
  connectionStrength: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface VaultItemFilters {
  type?: VaultItemType;
  search?: string;
  area?: Area;
  tags?: string[];
  status?: VaultItemStatus;
  /** Backend list pagination (default 50) */
  page?: number;
  pageSize?: number;
}
