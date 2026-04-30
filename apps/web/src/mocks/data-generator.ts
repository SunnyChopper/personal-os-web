import type {
  Task,
  Project,
  Goal,
  Metric,
  MetricLog,
  Habit,
  HabitLog,
  LogbookEntry,
  TaskDependency,
  TaskProject,
  TaskGoal,
  ProjectGoal,
  GoalMetric,
  HabitGoal,
  LogbookTask,
  LogbookProject,
  LogbookGoal,
  LogbookHabit,
  SuccessCriterion,
} from '@/types/growth-system';
import { generateId } from './storage';

const USER_ID = 'user-1';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function createSuccessCriteria(texts: string[]): SuccessCriterion[] {
  return texts.map((text, index) => ({
    id: generateId(),
    description: text.replace(/^✓\s*/, ''),
    isCompleted: text.includes('✓'),
    completedAt: text.includes('✓') ? new Date().toISOString() : null,
    linkedMetricId: null,
    linkedTaskId: null,
    targetDate: null,
    order: index,
  }));
}

export function generateSeedData() {
  const now = new Date();
  const tasks: Task[] = [];
  const projects: Project[] = [];
  const goals: Goal[] = [];
  const metrics: Metric[] = [];
  const metricLogs: MetricLog[] = [];
  const habits: Habit[] = [];
  const habitLogs: HabitLog[] = [];
  const logbookEntries: LogbookEntry[] = [];

  const taskDependencies: TaskDependency[] = [];
  const taskProjects: TaskProject[] = [];
  const taskGoals: TaskGoal[] = [];
  const projectGoals: ProjectGoal[] = [];
  const goalMetrics: GoalMetric[] = [];
  const habitGoals: HabitGoal[] = [];
  const logbookTasks: LogbookTask[] = [];
  const logbookProjects: LogbookProject[] = [];
  const logbookGoals: LogbookGoal[] = [];
  const logbookHabits: LogbookHabit[] = [];

  const goal1: Goal = {
    id: generateId(),
    title: 'Launch Side Project',
    description: 'Build and launch a SaaS product to generate passive income',
    area: 'Wealth',
    subCategory: 'Income',
    timeHorizon: 'Yearly',
    priority: 'P1',
    status: 'Active',
    targetDate: formatDate(addDays(now, 180)),
    completedDate: null,
    successCriteria: createSuccessCriteria([
      'Complete MVP with core features',
      'Acquire 100 paying customers',
      'Generate $5,000 MRR',
    ]),
    progressConfig: null,
    parentGoalId: null,
    lastActivityAt: formatDate(now),
    notes: null,
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -90)),
    updatedAt: formatDate(now),
  };
  goals.push(goal1);

  const goal2: Goal = {
    id: generateId(),
    title: 'Run First Marathon',
    description: 'Train for and complete a full marathon',
    area: 'Health',
    subCategory: 'Exercise',
    timeHorizon: 'Yearly',
    priority: 'P2',
    status: 'On Track',
    targetDate: formatDate(addDays(now, 120)),
    completedDate: null,
    successCriteria: createSuccessCriteria([
      'Build up to 40 miles per week',
      'Complete a half marathon',
      'Finish marathon in under 4 hours',
    ]),
    notes: null,
    progressConfig: null,
    parentGoalId: null,
    lastActivityAt: formatDate(now),
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -60)),
    updatedAt: formatDate(now),
  };
  goals.push(goal2);

  const goal3: Goal = {
    id: generateId(),
    title: 'Q1 Revenue Target',
    description: 'Hit quarterly revenue goals for the business',
    area: 'Day Job',
    subCategory: 'Performance',
    timeHorizon: 'Quarterly',
    priority: 'P1',
    status: 'Active',
    targetDate: formatDate(addDays(now, 30)),
    completedDate: null,
    successCriteria: createSuccessCriteria([
      'Close 15 new deals',
      'Achieve $150K in revenue',
      'Maintain 95% customer retention',
    ]),
    notes: null,
    progressConfig: null,
    parentGoalId: null,
    lastActivityAt: formatDate(now),
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -60)),
    updatedAt: formatDate(now),
  };
  goals.push(goal3);

  const goal4: Goal = {
    id: generateId(),
    title: 'Strengthen Family Relationships',
    description: 'Spend quality time with family and improve communication',
    area: 'Love',
    subCategory: 'Family',
    timeHorizon: 'Monthly',
    priority: 'P2',
    status: 'On Track',
    targetDate: formatDate(addDays(now, 30)),
    completedDate: null,
    successCriteria: createSuccessCriteria([
      'Have weekly family dinners',
      'Plan and execute one family outing',
      'Call parents twice per week',
      '✓ Start monthly family game night',
    ]),
    notes: 'Focus on being present and engaged during family time',
    progressConfig: null,
    parentGoalId: null,
    lastActivityAt: formatDate(now),
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -15)),
    updatedAt: formatDate(now),
  };
  goals.push(goal4);

  const goal5: Goal = {
    id: generateId(),
    title: 'This Week: Complete Sprint Tasks',
    description: 'Finish all committed sprint work items',
    area: 'Day Job',
    subCategory: 'Projects',
    timeHorizon: 'Weekly',
    priority: 'P1',
    status: 'Active',
    targetDate: formatDate(addDays(now, 5)),
    completedDate: null,
    successCriteria: createSuccessCriteria([
      '✓ Complete user authentication feature',
      '✓ Write unit tests for API endpoints',
      'Deploy to staging environment',
      'Code review for team members',
    ]),
    notes: null,
    progressConfig: null,
    parentGoalId: null,
    lastActivityAt: formatDate(now),
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -2)),
    updatedAt: formatDate(now),
  };
  goals.push(goal5);

  const goal6: Goal = {
    id: generateId(),
    title: 'Daily Meditation Practice',
    description: 'Build a consistent meditation habit',
    area: 'Health',
    subCategory: 'Mental',
    timeHorizon: 'Daily',
    priority: 'P2',
    status: 'Active',
    targetDate: null,
    completedDate: null,
    successCriteria: createSuccessCriteria([
      '✓ Meditate for 10 minutes',
      '✓ Practice mindful breathing',
      'Journal after meditation',
    ]),
    notes: 'Best time is early morning before work',
    progressConfig: null,
    parentGoalId: null,
    lastActivityAt: formatDate(now),
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -30)),
    updatedAt: formatDate(now),
  };
  goals.push(goal6);

  const goal7: Goal = {
    id: generateId(),
    title: 'Learn Spanish',
    description: 'Achieve conversational fluency in Spanish',
    area: 'Happiness',
    subCategory: 'Purpose',
    timeHorizon: 'Yearly',
    priority: 'P3',
    status: 'Planning',
    targetDate: formatDate(addDays(now, 365)),
    completedDate: null,
    successCriteria: createSuccessCriteria([
      'Complete Duolingo Spanish course',
      'Have 50 conversation sessions with native speakers',
      'Watch 10 Spanish movies without subtitles',
      'Pass DELE A2 exam',
    ]),
    notes: 'Planning to start after Q1 work commitments ease up',
    progressConfig: null,
    parentGoalId: null,
    lastActivityAt: formatDate(now),
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -5)),
    updatedAt: formatDate(now),
  };
  goals.push(goal7);

  const goal8: Goal = {
    id: generateId(),
    title: 'Reduce Credit Card Debt',
    description: 'Pay off high-interest credit card balance',
    area: 'Wealth',
    subCategory: 'Debt',
    timeHorizon: 'Quarterly',
    priority: 'P1',
    status: 'At Risk',
    targetDate: formatDate(addDays(now, 90)),
    completedDate: null,
    successCriteria: createSuccessCriteria([
      '✓ Create debt payoff plan',
      'Pay $2,000 per month toward balance',
      'Reduce total debt by 50%',
      'Avoid new credit card purchases',
    ]),
    notes: 'Behind schedule due to unexpected expenses. Need to cut discretionary spending.',
    progressConfig: null,
    parentGoalId: null,
    lastActivityAt: formatDate(now),
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -45)),
    updatedAt: formatDate(now),
  };
  goals.push(goal8);

  const goal9: Goal = {
    id: generateId(),
    title: 'Organize Home Office',
    description: 'Create an efficient and inspiring workspace',
    area: 'Operations',
    subCategory: 'Organization',
    timeHorizon: 'Monthly',
    priority: 'P3',
    status: 'Active',
    targetDate: formatDate(addDays(now, 20)),
    completedDate: null,
    successCriteria: createSuccessCriteria([
      '✓ Declutter desk and shelves',
      '✓ Install better lighting',
      'Set up ergonomic monitor stand',
      'Create filing system for documents',
    ]),
    notes: null,
    progressConfig: null,
    parentGoalId: null,
    lastActivityAt: formatDate(now),
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -10)),
    updatedAt: formatDate(now),
  };
  goals.push(goal9);

  const goal10: Goal = {
    id: generateId(),
    title: 'Achieve Work-Life Balance',
    description: 'Establish boundaries and maintain healthy work habits',
    area: 'Happiness',
    subCategory: 'Peace',
    timeHorizon: 'Quarterly',
    priority: 'P2',
    status: 'Achieved',
    targetDate: formatDate(addDays(now, -15)),
    completedDate: formatDate(addDays(now, -15)),
    successCriteria: createSuccessCriteria([
      '✓ No work emails after 6 PM',
      '✓ Take all vacation days',
      '✓ Exercise 3x per week',
      '✓ Have one hobby activity per week',
    ]),
    progressConfig: null,
    parentGoalId: null,
    lastActivityAt: formatDate(addDays(now, -15)),
    notes: 'Successfully implemented boundaries. Feeling much better!',
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -90)),
    updatedAt: formatDate(addDays(now, -15)),
  };
  goals.push(goal10);

  const project1: Project = {
    id: generateId(),
    name: 'SaaS MVP Development',
    description: 'Build minimum viable product with core features',
    area: 'Wealth',
    subCategory: 'Projects',
    priority: 'P1',
    status: 'Active',
    impact: 9,
    startDate: formatDate(addDays(now, -30)),
    targetEndDate: formatDate(addDays(now, 90)),
    actualEndDate: null,
    notes: null,
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -30)),
    updatedAt: formatDate(now),
  };
  projects.push(project1);
  projectGoals.push({ projectId: project1.id, goalId: goal1.id, createdAt: formatDate(now) });

  const project2: Project = {
    id: generateId(),
    name: 'Marathon Training Program',
    description: '16-week marathon training plan',
    area: 'Health',
    subCategory: 'Exercise',
    priority: 'P2',
    status: 'Active',
    impact: 8,
    startDate: formatDate(addDays(now, -45)),
    targetEndDate: formatDate(addDays(now, 75)),
    actualEndDate: null,
    notes: null,
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -45)),
    updatedAt: formatDate(now),
  };
  projects.push(project2);
  projectGoals.push({ projectId: project2.id, goalId: goal2.id, createdAt: formatDate(now) });

  const task1: Task = {
    id: generateId(),
    title: 'Design database schema',
    description: 'Create PostgreSQL schema for user data',
    extendedDescription: 'Include users, subscriptions, and usage tables. Consider multi-tenancy.',
    area: 'Wealth',
    subCategory: 'Projects',
    priority: 'P1',
    status: 'Done',
    size: 5,
    dueDate: formatDate(addDays(now, -5)),
    scheduledDate: formatDate(addDays(now, -7)),
    completedDate: formatDate(addDays(now, -3)),
    notes: null,
    isRecurring: false,
    recurrenceRule: null,
    pointValue: null,
    pointsAwarded: null,
    projectIds: [project1.id],
    goalIds: [goal1.id],
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -20)),
    updatedAt: formatDate(addDays(now, -3)),
  };
  tasks.push(task1);
  taskProjects.push({ taskId: task1.id, projectId: project1.id, createdAt: formatDate(now) });
  taskGoals.push({ taskId: task1.id, goalId: goal1.id, createdAt: formatDate(now) });

  const task2: Task = {
    id: generateId(),
    title: 'Build authentication system',
    description: 'Implement user auth with JWT',
    extendedDescription: null,
    area: 'Wealth',
    subCategory: 'Projects',
    priority: 'P1',
    status: 'In Progress',
    size: 8,
    dueDate: formatDate(addDays(now, 3)),
    scheduledDate: formatDate(now),
    completedDate: null,
    notes: 'Consider using OAuth for social login',
    isRecurring: false,
    recurrenceRule: null,
    pointValue: null,
    pointsAwarded: null,
    projectIds: [project1.id],
    goalIds: [goal1.id],
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -15)),
    updatedAt: formatDate(now),
  };
  tasks.push(task2);
  taskProjects.push({ taskId: task2.id, projectId: project1.id, createdAt: formatDate(now) });
  taskGoals.push({ taskId: task2.id, goalId: goal1.id, createdAt: formatDate(now) });
  taskDependencies.push({
    id: generateId(),
    taskId: task2.id,
    dependsOnTaskId: task1.id,
    createdAt: formatDate(now),
  });

  const task3: Task = {
    id: generateId(),
    title: 'Create API endpoints',
    description: 'Build RESTful API for core features',
    extendedDescription: null,
    area: 'Wealth',
    subCategory: 'Projects',
    priority: 'P1',
    status: 'Blocked',
    size: 13,
    dueDate: formatDate(addDays(now, 7)),
    scheduledDate: formatDate(addDays(now, 3)),
    completedDate: null,
    notes: 'Blocked by authentication system',
    isRecurring: false,
    recurrenceRule: null,
    pointValue: null,
    pointsAwarded: null,
    projectIds: [project1.id],
    goalIds: [],
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -15)),
    updatedAt: formatDate(now),
  };
  tasks.push(task3);
  taskProjects.push({ taskId: task3.id, projectId: project1.id, createdAt: formatDate(now) });
  taskDependencies.push({
    id: generateId(),
    taskId: task3.id,
    dependsOnTaskId: task2.id,
    createdAt: formatDate(now),
  });

  const task4: Task = {
    id: generateId(),
    title: 'Long run: 10 miles',
    description: 'Build endurance with long slow distance run',
    extendedDescription: null,
    area: 'Health',
    subCategory: 'Exercise',
    priority: 'P2',
    status: 'Not Started',
    size: 3,
    dueDate: formatDate(addDays(now, 2)),
    scheduledDate: formatDate(addDays(now, 2)),
    completedDate: null,
    notes: 'Easy pace, focus on completing distance',
    projectIds: [],
    goalIds: [],
    isRecurring: true,
    recurrenceRule: { frequency: 'Weekly', interval: 1, endDate: formatDate(addDays(now, 75)) },
    pointValue: null,
    pointsAwarded: null,
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -30)),
    updatedAt: formatDate(now),
  };
  tasks.push(task4);
  taskProjects.push({ taskId: task4.id, projectId: project2.id, createdAt: formatDate(now) });
  taskGoals.push({ taskId: task4.id, goalId: goal2.id, createdAt: formatDate(now) });

  const metric1: Metric = {
    id: generateId(),
    name: 'Weekly Running Miles',
    description: 'Total miles run per week',
    area: 'Health',
    subCategory: 'Exercise',
    unit: 'count',
    customUnit: 'miles',
    direction: 'Higher',
    targetValue: 40,
    thresholdLow: 20,
    thresholdHigh: 50,
    source: 'Manual',
    status: 'Active',
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -45)),
    updatedAt: formatDate(now),
  };
  metrics.push(metric1);
  goalMetrics.push({ goalId: goal2.id, metricId: metric1.id, createdAt: formatDate(now) });

  for (let i = 0; i < 6; i++) {
    metricLogs.push({
      id: generateId(),
      metricId: metric1.id,
      value: 15 + i * 3,
      notes: null,
      loggedAt: formatDate(addDays(now, -35 + i * 7)),
      userId: USER_ID,
      createdAt: formatDate(addDays(now, -35 + i * 7)),
    });
  }

  const metric2: Metric = {
    id: generateId(),
    name: 'MRR',
    description: 'Monthly Recurring Revenue',
    area: 'Wealth',
    subCategory: 'Income',
    unit: 'dollars',
    customUnit: null,
    direction: 'Higher',
    targetValue: 5000,
    thresholdLow: 1000,
    thresholdHigh: 10000,
    source: 'App',
    status: 'Active',
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -90)),
    updatedAt: formatDate(now),
  };
  metrics.push(metric2);
  goalMetrics.push({ goalId: goal1.id, metricId: metric2.id, createdAt: formatDate(now) });

  metricLogs.push({
    id: generateId(),
    metricId: metric2.id,
    value: 0,
    notes: 'Pre-launch',
    loggedAt: formatDate(addDays(now, -30)),
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -30)),
  });

  const metric3: Metric = {
    id: generateId(),
    name: 'Body Weight',
    description: 'Track body weight to monitor health',
    area: 'Health',
    subCategory: 'Physical',
    unit: 'pounds',
    customUnit: null,
    direction: 'Lower',
    targetValue: 175,
    thresholdLow: 170,
    thresholdHigh: 180,
    source: 'Device',
    status: 'Active',
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -60)),
    updatedAt: formatDate(now),
  };
  metrics.push(metric3);

  for (let i = 0; i < 8; i++) {
    metricLogs.push({
      id: generateId(),
      metricId: metric3.id,
      value: 183 - i * 0.5,
      notes: null,
      loggedAt: formatDate(addDays(now, -56 + i * 7)),
      userId: USER_ID,
      createdAt: formatDate(addDays(now, -56 + i * 7)),
    });
  }

  const metric4: Metric = {
    id: generateId(),
    name: 'Daily Meditation',
    description: 'Minutes of meditation practice',
    area: 'Health',
    subCategory: 'Mental',
    unit: 'minutes',
    customUnit: null,
    direction: 'Higher',
    targetValue: 20,
    thresholdLow: 10,
    thresholdHigh: 30,
    source: 'Manual',
    status: 'Active',
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -30)),
    updatedAt: formatDate(now),
  };
  metrics.push(metric4);

  for (let i = 0; i < 5; i++) {
    metricLogs.push({
      id: generateId(),
      metricId: metric4.id,
      value: 8 + i * 2,
      notes: i === 4 ? 'Starting to feel the benefits' : null,
      loggedAt: formatDate(addDays(now, -4 + i)),
      userId: USER_ID,
      createdAt: formatDate(addDays(now, -4 + i)),
    });
  }

  const metric5: Metric = {
    id: generateId(),
    name: 'Time with Family',
    description: 'Quality hours spent with family per week',
    area: 'Love',
    subCategory: 'Family',
    unit: 'hours',
    customUnit: null,
    direction: 'Higher',
    targetValue: 15,
    thresholdLow: 10,
    thresholdHigh: 20,
    source: 'Manual',
    status: 'Active',
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -20)),
    updatedAt: formatDate(now),
  };
  metrics.push(metric5);

  for (let i = 0; i < 3; i++) {
    metricLogs.push({
      id: generateId(),
      metricId: metric5.id,
      value: 12 + i * 1.5,
      notes: null,
      loggedAt: formatDate(addDays(now, -14 + i * 7)),
      userId: USER_ID,
      createdAt: formatDate(addDays(now, -14 + i * 7)),
    });
  }

  const metric6: Metric = {
    id: generateId(),
    name: 'Sleep Quality',
    description: 'Subjective sleep quality rating',
    area: 'Health',
    subCategory: 'Sleep',
    unit: 'rating',
    customUnit: null,
    direction: 'Higher',
    targetValue: 8,
    thresholdLow: 6,
    thresholdHigh: 10,
    source: 'Manual',
    status: 'Active',
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -45)),
    updatedAt: formatDate(now),
  };
  metrics.push(metric6);

  for (let i = 0; i < 7; i++) {
    metricLogs.push({
      id: generateId(),
      metricId: metric6.id,
      value: 5 + Math.floor(Math.random() * 3),
      notes: null,
      loggedAt: formatDate(addDays(now, -6 + i)),
      userId: USER_ID,
      createdAt: formatDate(addDays(now, -6 + i)),
    });
  }

  const metric7: Metric = {
    id: generateId(),
    name: 'Emergency Fund',
    description: 'Savings reserved for emergencies',
    area: 'Wealth',
    subCategory: 'Net Worth',
    unit: 'dollars',
    customUnit: null,
    direction: 'Higher',
    targetValue: 10000,
    thresholdLow: 5000,
    thresholdHigh: 15000,
    source: 'App',
    status: 'Active',
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -120)),
    updatedAt: formatDate(now),
  };
  metrics.push(metric7);

  for (let i = 0; i < 4; i++) {
    metricLogs.push({
      id: generateId(),
      metricId: metric7.id,
      value: 6000 + i * 800,
      notes: i === 3 ? 'On track to hit goal!' : null,
      loggedAt: formatDate(addDays(now, -90 + i * 30)),
      userId: USER_ID,
      createdAt: formatDate(addDays(now, -90 + i * 30)),
    });
  }

  const metric8: Metric = {
    id: generateId(),
    name: 'Focus Score',
    description: 'Daily productivity and focus rating',
    area: 'Operations',
    subCategory: 'Productivity',
    unit: 'rating',
    customUnit: null,
    direction: 'Higher',
    targetValue: 8,
    thresholdLow: 5,
    thresholdHigh: 10,
    source: 'Manual',
    status: 'Paused',
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -100)),
    updatedAt: formatDate(now),
  };
  metrics.push(metric8);

  metricLogs.push({
    id: generateId(),
    metricId: metric8.id,
    value: 6,
    notes: 'Pausing this metric to focus on others',
    loggedAt: formatDate(addDays(now, -30)),
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -30)),
  });

  const habit1: Habit = {
    id: generateId(),
    name: 'Morning Run',
    description: 'Run 3-5 miles in the morning',
    area: 'Health',
    subCategory: 'Exercise',
    habitType: 'Build',
    frequency: 'Daily',
    dailyTarget: 1,
    weeklyTarget: 5,
    intent: 'Build cardiovascular fitness and mental clarity',
    trigger: 'After waking up and having water',
    action: 'Put on running clothes and run 3-5 miles',
    reward: 'Feel energized and track progress',
    frictionUp: null,
    frictionDown: 'Lay out running clothes the night before, prep water bottle',
    notes: null,
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -30)),
    updatedAt: formatDate(now),
  };
  habits.push(habit1);
  habitGoals.push({ habitId: habit1.id, goalId: goal2.id, createdAt: formatDate(now) });

  for (let i = 0; i < 20; i++) {
    if (i % 7 !== 6) {
      habitLogs.push({
        id: generateId(),
        habitId: habit1.id,
        completedAt: formatDate(addDays(now, -20 + i)),
        amount: 1,
        notes: null,
        userId: USER_ID,
        createdAt: formatDate(addDays(now, -20 + i)),
      });
    }
  }

  const habit2: Habit = {
    id: generateId(),
    name: 'Daily Coding',
    description: 'Work on side project for at least 1 hour',
    area: 'Wealth',
    subCategory: 'Projects',
    habitType: 'Build',
    frequency: 'Daily',
    dailyTarget: 1,
    weeklyTarget: 5,
    intent: 'Make consistent progress on SaaS product',
    trigger: 'After dinner when laptop is open',
    action: 'Code for 1 hour on side project',
    reward: 'Update progress tracker and celebrate small wins',
    frictionUp: null,
    frictionDown: 'Have development environment ready, clear task list prepared',
    notes: null,
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -30)),
    updatedAt: formatDate(now),
  };
  habits.push(habit2);
  habitGoals.push({ habitId: habit2.id, goalId: goal1.id, createdAt: formatDate(now) });

  for (let i = 0; i < 15; i++) {
    habitLogs.push({
      id: generateId(),
      habitId: habit2.id,
      completedAt: formatDate(addDays(now, -15 + i)),
      amount: 1,
      notes: null,
      userId: USER_ID,
      createdAt: formatDate(addDays(now, -15 + i)),
    });
  }

  const habit3: Habit = {
    id: generateId(),
    name: 'Reduce Social Media',
    description: 'Limit social media to 30 minutes per day',
    area: 'Operations',
    subCategory: 'Productivity',
    habitType: 'Reduce',
    frequency: 'Daily',
    dailyTarget: 30,
    weeklyTarget: null,
    intent: 'Reclaim time for more productive activities',
    trigger: 'When feeling bored or procrastinating',
    action: 'Check screen time limit before opening apps',
    reward: 'More time for meaningful work',
    frictionUp: 'Delete apps from phone, use browser only with blocker extensions',
    frictionDown: null,
    notes: null,
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -20)),
    updatedAt: formatDate(now),
  };
  habits.push(habit3);

  const habit4: Habit = {
    id: generateId(),
    name: 'Drink 8 Glasses of Water',
    description: 'Stay hydrated throughout the day',
    area: 'Health',
    subCategory: 'Nutrition',
    habitType: 'Maintain',
    frequency: 'Daily',
    dailyTarget: 8,
    weeklyTarget: null,
    intent: 'Maintain proper hydration for health and energy',
    trigger: 'Every time I finish a task',
    action: 'Drink one glass of water',
    reward: 'Feel refreshed and energized',
    frictionUp: null,
    frictionDown: 'Keep water bottle on desk at all times',
    notes: null,
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -25)),
    updatedAt: formatDate(now),
  };
  habits.push(habit4);

  for (let i = 0; i < 10; i++) {
    habitLogs.push({
      id: generateId(),
      habitId: habit4.id,
      completedAt: formatDate(addDays(now, -10 + i)),
      amount: 6 + Math.floor(Math.random() * 3),
      notes: null,
      userId: USER_ID,
      createdAt: formatDate(addDays(now, -10 + i)),
    });
  }

  const habit5: Habit = {
    id: generateId(),
    name: 'Evening Screen-Free Time',
    description: 'No screens 1 hour before bed',
    area: 'Health',
    subCategory: 'Sleep',
    habitType: 'Quit',
    frequency: 'Daily',
    dailyTarget: 1,
    weeklyTarget: 7,
    intent: 'Improve sleep quality by reducing blue light exposure',
    trigger: '9 PM alarm',
    action: 'Put all devices in another room',
    reward: 'Better sleep and more time for reading',
    frictionUp: 'Use app blockers, set devices to grayscale mode',
    frictionDown: null,
    notes: null,
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -14)),
    updatedAt: formatDate(now),
  };
  habits.push(habit5);

  for (let i = 0; i < 8; i++) {
    if (i % 3 !== 0) {
      habitLogs.push({
        id: generateId(),
        habitId: habit5.id,
        completedAt: formatDate(addDays(now, -8 + i)),
        amount: 1,
        notes: null,
        userId: USER_ID,
        createdAt: formatDate(addDays(now, -8 + i)),
      });
    }
  }

  const logbook1: LogbookEntry = {
    id: generateId(),
    date: formatDate(addDays(now, -1)),
    title: 'Productive Day on MVP',
    notes:
      'Made great progress on authentication system. Feeling good about the architecture decisions. Energy was high in the morning after my run.',
    mood: 'High',
    energy: 8,
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -1)),
    updatedAt: formatDate(addDays(now, -1)),
  };
  logbookEntries.push(logbook1);
  logbookTasks.push({ logbookEntryId: logbook1.id, taskId: task2.id, createdAt: formatDate(now) });
  logbookProjects.push({
    logbookEntryId: logbook1.id,
    projectId: project1.id,
    createdAt: formatDate(now),
  });
  logbookHabits.push({
    logbookEntryId: logbook1.id,
    habitId: habit1.id,
    createdAt: formatDate(now),
  });
  logbookHabits.push({
    logbookEntryId: logbook1.id,
    habitId: habit2.id,
    createdAt: formatDate(now),
  });

  const logbook2: LogbookEntry = {
    id: generateId(),
    date: formatDate(now),
    title: null,
    notes: 'Rest day from running. Focused on planning the API architecture.',
    mood: 'Steady',
    energy: 7,
    userId: USER_ID,
    createdAt: formatDate(now),
    updatedAt: formatDate(now),
  };
  logbookEntries.push(logbook2);
  logbookHabits.push({
    logbookEntryId: logbook2.id,
    habitId: habit2.id,
    createdAt: formatDate(now),
  });

  const logbook3: LogbookEntry = {
    id: generateId(),
    date: formatDate(addDays(now, -3)),
    title: 'Challenges with API Design',
    notes:
      'Struggled with the authentication flow today. Spent too much time debugging. Need to ask for help sooner. Did complete my morning run which helped clear my head.',
    mood: 'Low',
    energy: 5,
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -3)),
    updatedAt: formatDate(addDays(now, -3)),
  };
  logbookEntries.push(logbook3);
  logbookTasks.push({ logbookEntryId: logbook3.id, taskId: task2.id, createdAt: formatDate(now) });
  logbookHabits.push({
    logbookEntryId: logbook3.id,
    habitId: habit1.id,
    createdAt: formatDate(now),
  });

  const logbook4: LogbookEntry = {
    id: generateId(),
    date: formatDate(addDays(now, -5)),
    title: 'Great Family Weekend',
    notes:
      'Spent quality time with family. Went hiking and had a picnic. Feeling grateful for these moments. Work can wait - balance is important.',
    mood: 'High',
    energy: 9,
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -5)),
    updatedAt: formatDate(addDays(now, -5)),
  };
  logbookEntries.push(logbook4);

  const logbook5: LogbookEntry = {
    id: generateId(),
    date: formatDate(addDays(now, -7)),
    title: 'Week in Review',
    notes:
      'Solid week of progress. Completed database schema design, made good progress on auth system. Running streak at 12 days! Feeling strong and energized. Ready to tackle the API endpoints next week.',
    mood: 'High',
    energy: 8,
    userId: USER_ID,
    createdAt: formatDate(addDays(now, -7)),
    updatedAt: formatDate(addDays(now, -7)),
  };
  logbookEntries.push(logbook5);
  logbookTasks.push({ logbookEntryId: logbook5.id, taskId: task1.id, createdAt: formatDate(now) });
  logbookProjects.push({
    logbookEntryId: logbook5.id,
    projectId: project1.id,
    createdAt: formatDate(now),
  });
  logbookHabits.push({
    logbookEntryId: logbook5.id,
    habitId: habit1.id,
    createdAt: formatDate(now),
  });
  logbookHabits.push({
    logbookEntryId: logbook5.id,
    habitId: habit2.id,
    createdAt: formatDate(now),
  });

  return {
    tasks,
    projects,
    goals,
    metrics,
    metricLogs,
    habits,
    habitLogs,
    logbookEntries,
    taskDependencies,
    taskProjects,
    taskGoals,
    projectGoals,
    goalMetrics,
    habitGoals,
    logbookTasks,
    logbookProjects,
    logbookGoals,
    logbookHabits,
  };
}
