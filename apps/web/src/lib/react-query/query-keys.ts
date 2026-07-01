/**
 * Centralized query key factories for React Query
 * Provides type-safe, hierarchical query keys for better cache invalidation
 */

export const queryKeys = {
  // Growth System (module-level data)
  growthSystem: {
    all: ['growth-system'] as const,
    data: (options?: Record<string, unknown>) =>
      options
        ? ([...queryKeys.growthSystem.all, 'data', options] as const)
        : ([...queryKeys.growthSystem.all, 'data'] as const),
    tasks: {
      all: () => [...queryKeys.growthSystem.all, 'tasks'] as const,
      lists: () => [...queryKeys.growthSystem.tasks.all(), 'list'] as const,
      list: (filters?: Record<string, unknown>) =>
        filters
          ? [...queryKeys.growthSystem.tasks.lists(), filters]
          : queryKeys.growthSystem.tasks.lists(),
      details: () => [...queryKeys.growthSystem.tasks.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.growthSystem.tasks.details(), id] as const,
    },
    habits: {
      all: () => [...queryKeys.growthSystem.all, 'habits'] as const,
      lists: () => [...queryKeys.growthSystem.habits.all(), 'list'] as const,
      list: (filters?: Record<string, unknown>) =>
        filters
          ? [...queryKeys.growthSystem.habits.lists(), filters]
          : queryKeys.growthSystem.habits.lists(),
      details: () => [...queryKeys.growthSystem.habits.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.growthSystem.habits.details(), id] as const,
    },
    metrics: {
      all: () => [...queryKeys.growthSystem.all, 'metrics'] as const,
      lists: () => [...queryKeys.growthSystem.metrics.all(), 'list'] as const,
      list: (filters?: Record<string, unknown>) =>
        filters
          ? [...queryKeys.growthSystem.metrics.lists(), filters]
          : queryKeys.growthSystem.metrics.lists(),
      details: () => [...queryKeys.growthSystem.metrics.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.growthSystem.metrics.details(), id] as const,
    },
    goals: {
      all: () => [...queryKeys.growthSystem.all, 'goals'] as const,
      lists: () => [...queryKeys.growthSystem.goals.all(), 'list'] as const,
      list: (filters?: Record<string, unknown>) =>
        filters
          ? [...queryKeys.growthSystem.goals.lists(), filters]
          : queryKeys.growthSystem.goals.lists(),
      details: () => [...queryKeys.growthSystem.goals.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.growthSystem.goals.details(), id] as const,
      linkSuggestions: (goalId: string) =>
        [...queryKeys.growthSystem.goals.all(), 'link-suggestions', goalId] as const,
      dependencies: () => [...queryKeys.growthSystem.goals.all(), 'dependencies'] as const,
      goalDependencies: (goalId: string) =>
        [...queryKeys.growthSystem.goals.all(), 'dependencies', goalId] as const,
    },
    projects: {
      all: () => [...queryKeys.growthSystem.all, 'projects'] as const,
      lists: () => [...queryKeys.growthSystem.projects.all(), 'list'] as const,
      list: (filters?: Record<string, unknown>) =>
        filters
          ? [...queryKeys.growthSystem.projects.lists(), filters]
          : queryKeys.growthSystem.projects.lists(),
      details: () => [...queryKeys.growthSystem.projects.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.growthSystem.projects.details(), id] as const,
      health: () => [...queryKeys.growthSystem.projects.all(), 'health'] as const,
      healthList: (ids: string[]) => [...queryKeys.growthSystem.projects.health(), ids] as const,
      dependencies: () => [...queryKeys.growthSystem.projects.all(), 'dependencies'] as const,
    },
    logbook: {
      all: () => [...queryKeys.growthSystem.all, 'logbook'] as const,
      lists: () => [...queryKeys.growthSystem.logbook.all(), 'list'] as const,
      list: (filters?: Record<string, unknown>) =>
        filters
          ? [...queryKeys.growthSystem.logbook.lists(), filters]
          : queryKeys.growthSystem.logbook.lists(),
      details: () => [...queryKeys.growthSystem.logbook.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.growthSystem.logbook.details(), id] as const,
    },
    weeklyReviews: {
      all: () => [...queryKeys.growthSystem.all, 'weekly-reviews'] as const,
      current: (weeks?: number, rollingWindow?: number) =>
        weeks != null
          ? ([
              ...queryKeys.growthSystem.weeklyReviews.all(),
              'current',
              weeks,
              rollingWindow ?? 4,
            ] as const)
          : ([...queryKeys.growthSystem.weeklyReviews.all(), 'current'] as const),
      list: (page: number, pageSize: number) =>
        [...queryKeys.growthSystem.weeklyReviews.all(), 'list', page, pageSize] as const,
      detail: (weekStart: string) =>
        [...queryKeys.growthSystem.weeklyReviews.all(), weekStart] as const,
      leverageRoi: (days: number, anchorDate?: string | null) =>
        anchorDate != null && anchorDate !== ''
          ? ([
              ...queryKeys.growthSystem.weeklyReviews.all(),
              'leverage-roi',
              days,
              anchorDate,
            ] as const)
          : ([...queryKeys.growthSystem.weeklyReviews.all(), 'leverage-roi', days] as const),
    },
    planner: {
      all: () => [...queryKeys.growthSystem.all, 'planner'] as const,
      week: (weekStart: string) =>
        [...queryKeys.growthSystem.planner.all(), 'week', weekStart] as const,
      day: (calendarDate: string) =>
        [...queryKeys.growthSystem.planner.all(), 'plan-day', calendarDate] as const,
      oneThing: (date: string) =>
        [...queryKeys.growthSystem.planner.all(), 'one-thing', date] as const,
      calendarConnections: () =>
        [...queryKeys.growthSystem.planner.all(), 'calendar-connections'] as const,
    },
  },

  /** Health & Fitness (`/fitness/*`, `/ai/fitness/*`) */
  fitness: {
    all: ['fitness'] as const,
    exercises: {
      all: () => [...queryKeys.fitness.all, 'exercises'] as const,
      list: (page: number, pageSize: number) =>
        [...queryKeys.fitness.exercises.all(), 'list', page, pageSize] as const,
    },
    templates: {
      all: () => [...queryKeys.fitness.all, 'templates'] as const,
      list: (page: number, pageSize: number) =>
        [...queryKeys.fitness.templates.all(), 'list', page, pageSize] as const,
    },
    sessions: {
      all: () => [...queryKeys.fitness.all, 'sessions'] as const,
      list: (filters: Record<string, unknown>) =>
        [...queryKeys.fitness.sessions.all(), 'list', filters] as const,
      sets: (sessionId: string) =>
        [...queryKeys.fitness.sessions.all(), 'sets', sessionId] as const,
    },
    nutrition: {
      all: () => [...queryKeys.fitness.all, 'nutrition'] as const,
      list: (filters: Record<string, unknown>) =>
        [...queryKeys.fitness.nutrition.all(), 'list', filters] as const,
    },
    pantry: {
      all: () => [...queryKeys.fitness.all, 'pantry'] as const,
      list: (page: number, pageSize: number) =>
        [...queryKeys.fitness.pantry.all(), 'list', page, pageSize] as const,
    },
    mealPlans: {
      all: () => [...queryKeys.fitness.all, 'mealPlans'] as const,
      list: (page: number, pageSize: number) =>
        [...queryKeys.fitness.mealPlans.all(), 'list', page, pageSize] as const,
    },
    recovery: {
      all: () => [...queryKeys.fitness.all, 'recovery'] as const,
      day: (date: string) => [...queryKeys.fitness.recovery.all(), 'day', date] as const,
      range: (start: string, end: string) =>
        [...queryKeys.fitness.recovery.all(), 'range', start, end] as const,
      metricLinks: () => [...queryKeys.fitness.recovery.all(), 'metricLinks'] as const,
    },
    overload: (exerciseId: string) => [...queryKeys.fitness.all, 'overload', exerciseId] as const,
    aura: (start: string, end: string, xMetric: string) =>
      [...queryKeys.fitness.all, 'aura', start, end, xMetric] as const,
    rewardRules: {
      all: () => [...queryKeys.fitness.all, 'rewardRules'] as const,
      list: (page: number, pageSize: number, activeOnly?: boolean) =>
        [...queryKeys.fitness.rewardRules.all(), 'list', page, pageSize, activeOnly] as const,
    },
    rewardClaims: {
      all: () => [...queryKeys.fitness.all, 'rewardClaims'] as const,
      list: (filters: Record<string, unknown>) =>
        [...queryKeys.fitness.rewardClaims.all(), 'list', filters] as const,
    },
    workoutSchedule: {
      all: () => [...queryKeys.fitness.all, 'workoutSchedule'] as const,
      baseline: () => [...queryKeys.fitness.workoutSchedule.all(), 'baseline'] as const,
      days: (start: string, end: string) =>
        [...queryKeys.fitness.workoutSchedule.all(), 'days', start, end] as const,
      pendingSkips: () => [...queryKeys.fitness.workoutSchedule.all(), 'pendingSkips'] as const,
    },
  },

  // Markdown Files
  markdownFiles: {
    all: ['markdown-files'] as const,
    lists: () => [...queryKeys.markdownFiles.all, 'list'] as const,
    list: (folder?: string) =>
      folder ? [...queryKeys.markdownFiles.lists(), folder] : queryKeys.markdownFiles.lists(),
    details: () => [...queryKeys.markdownFiles.all, 'detail'] as const,
    detail: (filePath: string) => [...queryKeys.markdownFiles.details(), filePath] as const,
    tree: () => ['markdown-file-tree'] as const,
  },

  // Chatbot
  chatbot: {
    all: ['chatbot'] as const,
    threads: {
      all: () => [...queryKeys.chatbot.all, 'threads'] as const,
      lists: () => [...queryKeys.chatbot.threads.all(), 'list'] as const,
      details: () => [...queryKeys.chatbot.threads.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.chatbot.threads.details(), id] as const,
    },
    messages: {
      all: () => [...queryKeys.chatbot.all, 'messages'] as const,
      lists: () => [...queryKeys.chatbot.messages.all(), 'list'] as const,
      list: (threadId: string) => [...queryKeys.chatbot.messages.lists(), threadId] as const,
      tree: (threadId: string) => [...queryKeys.chatbot.messages.all(), 'tree', threadId] as const,
    },
    memory: {
      all: () => [...queryKeys.chatbot.all, 'memory'] as const,
      shortTerm: (date?: string) =>
        date
          ? ([...queryKeys.chatbot.memory.all(), 'short-term', date] as const)
          : ([...queryKeys.chatbot.memory.all(), 'short-term'] as const),
      history: () => [...queryKeys.chatbot.memory.all(), 'history'] as const,
      longTerm: (search?: string) =>
        search
          ? ([...queryKeys.chatbot.memory.all(), 'long-term', search] as const)
          : ([...queryKeys.chatbot.memory.all(), 'long-term'] as const),
    },
    modelCatalog: () => [...queryKeys.chatbot.all, 'model-catalog'] as const,
    assistantSettings: () => [...queryKeys.chatbot.all, 'assistant-settings'] as const,
    /** Prefix match invalidates all leaf/runConfig variants for a thread. */
    contextUsage: {
      prefix: (threadId: string) => [...queryKeys.chatbot.all, 'context-usage', threadId] as const,
      detail: (threadId: string, leafId: string, runConfigKey: string) =>
        [...queryKeys.chatbot.all, 'context-usage', threadId, leafId, runConfigKey] as const,
    },
  },

  // Assistant LTM audit (/ltm)
  ltm: {
    all: ['ltm'] as const,
    list: (visibility: 'active' | 'all' | 'archivedOnly', search: string) =>
      [...queryKeys.ltm.all, 'list', visibility, search] as const,
  },

  // Usage observability (/observability)
  observability: {
    all: ['observability'] as const,
    burnSummary: (filters?: Record<string, unknown>) =>
      filters
        ? ([...queryKeys.observability.all, 'burn-summary', filters] as const)
        : ([...queryKeys.observability.all, 'burn-summary'] as const),
    burnTimeseries: (filters?: Record<string, unknown>) =>
      filters
        ? ([...queryKeys.observability.all, 'burn-timeseries', filters] as const)
        : ([...queryKeys.observability.all, 'burn-timeseries'] as const),
    burnBreakdown: (filters?: Record<string, unknown>) =>
      filters
        ? ([...queryKeys.observability.all, 'burn-breakdown', filters] as const)
        : ([...queryKeys.observability.all, 'burn-breakdown'] as const),
    healthSummary: (sinceDays?: number) =>
      [...queryKeys.observability.all, 'health-summary', sinceDays ?? 'default'] as const,
    healthMatrix: (sinceDays?: number) =>
      [...queryKeys.observability.all, 'health-matrix', sinceDays ?? 'default'] as const,
    executions: (filters?: Record<string, unknown>) =>
      filters
        ? ([...queryKeys.observability.all, 'executions', filters] as const)
        : ([...queryKeys.observability.all, 'executions'] as const),
    executionDetail: (id: string) => [...queryKeys.observability.all, 'execution', id] as const,
  },

  admin: {
    assistantSandbox: {
      all: ['assistant-sandbox'] as const,
      session: (sessionId: string) =>
        [...queryKeys.admin.assistantSandbox.all, 'session', sessionId] as const,
    },
  },

  // Draft Notes
  draftNotes: {
    all: ['draft-notes'] as const,
    detail: () => [...queryKeys.draftNotes.all, 'detail'] as const,
  },

  // Mode Preference
  modePreference: {
    all: ['mode-preference'] as const,
    detail: () => [...queryKeys.modePreference.all, 'detail'] as const,
  },

  // Feature Configs
  featureConfigs: {
    all: ['feature-configs'] as const,
    detail: () => [...queryKeys.featureConfigs.all, 'detail'] as const,
  },

  // Backend Health
  backendHealth: {
    all: ['backend-health'] as const,
    detail: () => [...queryKeys.backendHealth.all, 'detail'] as const,
    markdown: () => ['markdown-backend-health'] as const,
  },

  // Wallet
  wallet: {
    all: ['wallet'] as const,
    /** Canonical shell fetch: one GET `/wallet` for balance + recent transactions */
    detail: () => [...queryKeys.wallet.all, 'detail'] as const,
    balance: () => [...queryKeys.wallet.all, 'balance'] as const,
    transactions: (limit?: number) =>
      limit
        ? ([...queryKeys.wallet.all, 'transactions', limit] as const)
        : ([...queryKeys.wallet.all, 'transactions'] as const),
  },

  // Knowledge Vault (vault items + courses lists)
  knowledgeVault: {
    all: ['knowledge-vault'] as const,
    vaultItems: () => [...queryKeys.knowledgeVault.all, 'vault-items'] as const,
    courses: () => [...queryKeys.knowledgeVault.all, 'courses'] as const,
    flashcardDecks: () => [...queryKeys.knowledgeVault.all, 'flashcard-decks'] as const,
    documentDetail: (documentId: string) =>
      [...queryKeys.knowledgeVault.all, 'document-detail', documentId] as const,
    documentChunks: (documentId: string) =>
      [...queryKeys.knowledgeVault.all, 'document-chunks', documentId] as const,
    practiceArtifacts: (filters?: Record<string, unknown>) =>
      filters
        ? ([...queryKeys.knowledgeVault.all, 'practice-artifacts', filters] as const)
        : ([...queryKeys.knowledgeVault.all, 'practice-artifacts'] as const),
    skillTree: () => [...queryKeys.knowledgeVault.all, 'skill-tree'] as const,
    inbox: () => [...queryKeys.knowledgeVault.all, 'inbox'] as const,
    cheatSheet: () => [...queryKeys.knowledgeVault.all, 'cheat-sheet'] as const,
    syntopic: () => [...queryKeys.knowledgeVault.all, 'syntopic'] as const,
    agencyArtifacts: () => [...queryKeys.knowledgeVault.all, 'agency-artifacts'] as const,
    vaultTaskLinksUnack: () => [...queryKeys.knowledgeVault.all, 'vault-task-links-unack'] as const,
    vaultTaskLinksUnackCount: () =>
      [...queryKeys.knowledgeVault.all, 'vault-task-links-unack-count'] as const,
  },

  // Daily Learning
  dailyLearning: {
    all: ['daily-learning'] as const,
    settings: () => [...queryKeys.dailyLearning.all, 'settings'] as const,
    sources: () => [...queryKeys.dailyLearning.all, 'sources'] as const,
    context: () => [...queryKeys.dailyLearning.all, 'context'] as const,
    digests: (params?: Record<string, unknown>) =>
      params
        ? ([...queryKeys.dailyLearning.all, 'digests', params] as const)
        : ([...queryKeys.dailyLearning.all, 'digests'] as const),
    discards: (params?: Record<string, unknown>) =>
      params
        ? ([...queryKeys.dailyLearning.all, 'discards', params] as const)
        : ([...queryKeys.dailyLearning.all, 'discards'] as const),
    tracks: () => [...queryKeys.dailyLearning.all, 'lesson-tracks'] as const,
    sourceSuggestions: (params?: { readyOnly?: boolean }) =>
      params
        ? ([...queryKeys.dailyLearning.all, 'source-suggestions', params] as const)
        : ([...queryKeys.dailyLearning.all, 'source-suggestions'] as const),
  },

  // Tools module (admin /tools/*)
  tools: {
    all: ['tools'] as const,
    workflows: {
      list: () => [...queryKeys.tools.all, 'workflows', 'list'] as const,
      detail: (id: string) => [...queryKeys.tools.all, 'workflows', id] as const,
    },
    webhooks: {
      list: () => [...queryKeys.tools.all, 'webhooks', 'list'] as const,
      events: (id: string) => [...queryKeys.tools.all, 'webhooks', id, 'events'] as const,
    },
    whiteboards: {
      list: () => [...queryKeys.tools.all, 'whiteboards', 'list'] as const,
      detail: (id: string) => [...queryKeys.tools.all, 'whiteboards', id] as const,
    },
  },

  // Career Development / Resume Builder (Postgres)
  careerResume: {
    all: ['career-resume'] as const,
    profile: () => [...queryKeys.careerResume.all, 'profile'] as const,
    education: () => [...queryKeys.careerResume.all, 'education'] as const,
    jobs: () => [...queryKeys.careerResume.all, 'jobs'] as const,
    /** Invalidate every suggestions query subtree. */
    suggestionsPrefix: () => [...queryKeys.careerResume.all, 'suggestions'] as const,
    suggestions: (filters?: { jobId?: string | null; status?: string | null }) =>
      [
        ...queryKeys.careerResume.suggestionsPrefix(),
        filters?.jobId ?? 'all',
        filters?.status ?? 'all',
      ] as const,
    generatedPrefix: () => [...queryKeys.careerResume.all, 'generated-list'] as const,
    generated: (filters?: unknown) =>
      [...queryKeys.careerResume.generatedPrefix(), filters ?? {}] as const,
    generatedDetail: (resumeId: string) =>
      [...queryKeys.careerResume.all, 'generated-detail', resumeId] as const,
    applicationsPrefix: () => [...queryKeys.careerResume.all, 'applications'] as const,
    applicationsList: (filters?: Record<string, unknown>) =>
      [...queryKeys.careerResume.applicationsPrefix(), 'list', filters ?? {}] as const,
    applicationDetail: (id: string) =>
      [...queryKeys.careerResume.applicationsPrefix(), 'detail', id] as const,
    applicationsAnalytics: () =>
      [...queryKeys.careerResume.applicationsPrefix(), 'analytics'] as const,
    jobPostingsPrefix: () => [...queryKeys.careerResume.all, 'job-postings'] as const,
    jobPostingsList: (filters?: Record<string, unknown>) =>
      [...queryKeys.careerResume.jobPostingsPrefix(), 'list', filters ?? {}] as const,
    jobPostingDetail: (postingId: string) =>
      [...queryKeys.careerResume.jobPostingsPrefix(), 'detail', postingId] as const,
    jobScrapeRunsPrefix: () => [...queryKeys.careerResume.all, 'job-scrape-runs'] as const,
    jobScrapeRunsList: (filters?: Record<string, unknown>) =>
      [...queryKeys.careerResume.jobScrapeRunsPrefix(), 'list', filters ?? {}] as const,
    jobScrapeRunDetail: (runId: string) =>
      [...queryKeys.careerResume.jobScrapeRunsPrefix(), 'detail', runId] as const,
    templatesPrefix: () => [...queryKeys.careerResume.all, 'templates'] as const,
    templates: () => [...queryKeys.careerResume.templatesPrefix(), 'list'] as const,
    templateDetail: (templateId: string) =>
      [...queryKeys.careerResume.templatesPrefix(), 'detail', templateId] as const,
  },

  // Proactive Assistant (`/proactive/*`) + related preferences keys
  proactive: {
    all: ['proactive'] as const,
    automations: () => [...queryKeys.proactive.all, 'automations'] as const,
    suggestions: () => [...queryKeys.proactive.all, 'suggestions'] as const,
    automationRuns: (automationId: string) =>
      [...queryKeys.proactive.all, 'automation-runs', automationId] as const,
  },

  preferences: {
    all: ['preferences'] as const,
    timeZone: () => [...queryKeys.preferences.all, 'time-zone'] as const,
    notificationWebhook: () => [...queryKeys.preferences.all, 'notification-webhook'] as const,
    recoveryNotifications: () => [...queryKeys.preferences.all, 'recovery-notifications'] as const,
    weeklyDashboard: () => [...queryKeys.preferences.all, 'weekly-dashboard'] as const,
    marginOfSafetyBuffer: () => [...queryKeys.preferences.all, 'margin-of-safety-buffer'] as const,
  },

  personalBranding: {
    all: ['personal-branding'] as const,
    brandConfig: () => [...queryKeys.personalBranding.all, 'brand-config'] as const,
    profiles: {
      all: () => [...queryKeys.personalBranding.all, 'profiles'] as const,
      list: (page = 1, pageSize = 50) =>
        [...queryKeys.personalBranding.profiles.all(), 'list', page, pageSize] as const,
      detail: (profileId: string) =>
        [...queryKeys.personalBranding.profiles.all(), 'detail', profileId] as const,
      versions: (profileId: string) =>
        [...queryKeys.personalBranding.profiles.all(), 'versions', profileId] as const,
    },
    extractions: {
      all: () => [...queryKeys.personalBranding.all, 'extractions'] as const,
      detail: (jobId: string) =>
        [...queryKeys.personalBranding.extractions.all(), 'detail', jobId] as const,
    },
    platformRules: {
      all: () => [...queryKeys.personalBranding.all, 'platform-rules'] as const,
      list: (page = 1, pageSize = 50) =>
        [...queryKeys.personalBranding.platformRules.all(), 'list', page, pageSize] as const,
      detail: (ruleId: string) =>
        [...queryKeys.personalBranding.platformRules.all(), 'detail', ruleId] as const,
      effective: (platform: string, profileId?: string) =>
        [
          ...queryKeys.personalBranding.platformRules.all(),
          'effective',
          platform,
          profileId ?? '',
        ] as const,
    },
    content: {
      all: () => [...queryKeys.personalBranding.all, 'content'] as const,
      list: (page = 1, pageSize = 50, status?: string) =>
        [
          ...queryKeys.personalBranding.content.all(),
          'list',
          page,
          pageSize,
          status ?? 'all',
        ] as const,
      detail: (contentId: string) =>
        [...queryKeys.personalBranding.content.all(), 'detail', contentId] as const,
      variants: (contentId: string) =>
        [...queryKeys.personalBranding.content.all(), 'variants', contentId] as const,
      repurposeJob: (contentId: string, jobId: string) =>
        [...queryKeys.personalBranding.content.all(), 'repurpose-job', contentId, jobId] as const,
    },
    ideas: {
      all: () => [...queryKeys.personalBranding.all, 'content-ideas'] as const,
      list: (page = 1, pageSize = 50, status?: string) =>
        [
          ...queryKeys.personalBranding.ideas.all(),
          'list',
          page,
          pageSize,
          status ?? 'GENERATED',
        ] as const,
    },
    rejectedFeedback: {
      all: () => [...queryKeys.personalBranding.all, 'rejected-ideas-feedback'] as const,
      list: (page = 1, pageSize = 50) =>
        [...queryKeys.personalBranding.rejectedFeedback.all(), 'list', page, pageSize] as const,
    },
    radarSources: {
      all: () => [...queryKeys.personalBranding.all, 'radar-sources'] as const,
      list: (page = 1, pageSize = 50) =>
        [...queryKeys.personalBranding.radarSources.all(), 'list', page, pageSize] as const,
      detail: (sourceId: string) =>
        [...queryKeys.personalBranding.radarSources.all(), 'detail', sourceId] as const,
    },
    radarSettings: () => [...queryKeys.personalBranding.all, 'radar-settings'] as const,
    radarItems: {
      all: () => [...queryKeys.personalBranding.all, 'radar-items'] as const,
      list: (page = 1, pageSize = 50) =>
        [...queryKeys.personalBranding.radarItems.all(), 'list', page, pageSize] as const,
    },
    radarRuns: {
      all: () => [...queryKeys.personalBranding.all, 'radar-runs'] as const,
      list: (page = 1, pageSize = 50) =>
        [...queryKeys.personalBranding.radarRuns.all(), 'list', page, pageSize] as const,
      detail: (runId: string) =>
        [...queryKeys.personalBranding.radarRuns.all(), 'detail', runId] as const,
    },
    radarDiscovery: {
      all: () => [...queryKeys.personalBranding.all, 'radar-discovery'] as const,
      detail: (runId: string) =>
        [...queryKeys.personalBranding.radarDiscovery.all(), 'detail', runId] as const,
    },
    connections: {
      all: () => [...queryKeys.personalBranding.all, 'connections'] as const,
      list: (page = 1, pageSize = 50) =>
        [...queryKeys.personalBranding.connections.all(), 'list', page, pageSize] as const,
      detail: (connectionId: string) =>
        [...queryKeys.personalBranding.connections.all(), 'detail', connectionId] as const,
    },
    interactions: {
      all: () => [...queryKeys.personalBranding.all, 'interactions'] as const,
      board: (page = 1, pageSize = 50) =>
        [...queryKeys.personalBranding.interactions.all(), 'board', page, pageSize] as const,
      byConnection: (connectionId: string, page = 1, pageSize = 50) =>
        [
          ...queryKeys.personalBranding.interactions.all(),
          'connection',
          connectionId,
          page,
          pageSize,
        ] as const,
    },
    trackingMetrics: {
      all: () => [...queryKeys.personalBranding.all, 'tracking-metrics'] as const,
      list: (page = 1, pageSize = 50) =>
        [...queryKeys.personalBranding.trackingMetrics.all(), 'list', page, pageSize] as const,
    },
    rolodexMetricLinks: () => [...queryKeys.personalBranding.all, 'rolodex-metric-links'] as const,
    connectionMetricLinks: (connectionId: string) =>
      [...queryKeys.personalBranding.all, 'connection-metric-links', connectionId] as const,
  },

  // Rewards
  rewards: {
    all: ['rewards'] as const,
    lists: () => [...queryKeys.rewards.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      filters ? [...queryKeys.rewards.lists(), filters] : queryKeys.rewards.lists(),
    details: () => [...queryKeys.rewards.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.rewards.details(), id] as const,
    withRedemptions: () => [...queryKeys.rewards.all, 'with-redemptions'] as const,
  },
};
