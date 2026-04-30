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
      current: () => [...queryKeys.growthSystem.weeklyReviews.all(), 'current'] as const,
      list: (page: number, pageSize: number) =>
        [...queryKeys.growthSystem.weeklyReviews.all(), 'list', page, pageSize] as const,
      detail: (weekStart: string) =>
        [...queryKeys.growthSystem.weeklyReviews.all(), weekStart] as const,
    },
    planner: {
      all: () => [...queryKeys.growthSystem.all, 'planner'] as const,
      week: (weekStart: string) =>
        [...queryKeys.growthSystem.planner.all(), 'week', weekStart] as const,
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
    recovery: {
      all: () => [...queryKeys.fitness.all, 'recovery'] as const,
      day: (date: string) => [...queryKeys.fitness.recovery.all(), 'day', date] as const,
      range: (start: string, end: string) =>
        [...queryKeys.fitness.recovery.all(), 'range', start, end] as const,
    },
    overload: (exerciseId: string) => [...queryKeys.fitness.all, 'overload', exerciseId] as const,
    aura: (start: string, end: string, xMetric: string) =>
      [...queryKeys.fitness.all, 'aura', start, end, xMetric] as const,
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
