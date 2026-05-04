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

export interface CareerJobPosting {
  id: string;
  sourceUrl?: string | null;
  rawText: string;
  fetchedText?: string | null;
  companyGuess?: string | null;
  roleGuess?: string | null;
  jobBoard?: string | null;
  jobBoardCompanyId?: string | null;
  requirements: {
    mustHaveSkills?: string[];
    niceToHaveSkills?: string[];
    responsibilitiesSummary?: string;
  };
  atsKeywords: string[];
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
  atsScore?: number | null;
  humanScore?: number | null;
  resumeTemplate?: string | null;
  provider?: string | null;
  model?: string | null;
  bulletRationales?: CareerResumeBulletRationale[];
  createdAt: string;
  updatedAt: string;
}

export interface CareerResumeBulletRationale {
  bulletText: string;
  achievementId?: string | null;
  keywords: string[];
  reason: string;
}
