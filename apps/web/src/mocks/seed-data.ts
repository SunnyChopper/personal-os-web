import { MockStorage, generateId } from './storage';
import { generateSeedData } from './data-generator';
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
} from '@/types/growth-system';
import type { Reward } from '@/types/rewards';

const SEED_FLAG_KEY = 'gs_seeded';
const USER_ID = 'user-1';

function generateRewardsSeedData(): Reward[] {
  const now = new Date().toISOString();

  return [
    {
      id: generateId(),
      title: '15-Minute Social Media Break',
      description: 'Guilt-free scrolling time',
      category: 'Quick Treat' as const,
      pointCost: 50,
      icon: '📱',
      imageUrl: null,
      isAutomated: false,
      automationInstructions: null,
      cooldownHours: 2,
      maxRedemptionsPerDay: 4,
      status: 'Active' as const,
      userId: USER_ID,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'Coffee Shop Visit',
      description: 'Treat yourself to your favorite drink',
      category: 'Quick Treat' as const,
      pointCost: 150,
      icon: '☕',
      imageUrl: null,
      isAutomated: false,
      automationInstructions: null,
      cooldownHours: null,
      maxRedemptionsPerDay: 2,
      status: 'Active' as const,
      userId: USER_ID,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'YouTube Video Break',
      description: '30 minutes of entertainment',
      category: 'Quick Treat' as const,
      pointCost: 75,
      icon: '📺',
      imageUrl: null,
      isAutomated: false,
      automationInstructions: null,
      cooldownHours: 3,
      maxRedemptionsPerDay: 3,
      status: 'Active' as const,
      userId: USER_ID,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'Favorite Snack',
      description: 'Indulge in your go-to treat',
      category: 'Quick Treat' as const,
      pointCost: 100,
      icon: '🍿',
      imageUrl: null,
      isAutomated: false,
      automationInstructions: null,
      cooldownHours: null,
      maxRedemptionsPerDay: 2,
      status: 'Active' as const,
      userId: USER_ID,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'Gaming Session',
      description: '1 hour of gaming time',
      category: 'Daily Delight' as const,
      pointCost: 300,
      icon: '🎮',
      imageUrl: null,
      isAutomated: false,
      automationInstructions: null,
      cooldownHours: null,
      maxRedemptionsPerDay: 1,
      status: 'Active' as const,
      userId: USER_ID,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'Movie Night',
      description: 'Watch a full movie or binge episodes',
      category: 'Daily Delight' as const,
      pointCost: 400,
      icon: '🎬',
      imageUrl: null,
      isAutomated: false,
      automationInstructions: null,
      cooldownHours: null,
      maxRedemptionsPerDay: 1,
      status: 'Active' as const,
      userId: USER_ID,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'Takeout Dinner',
      description: 'Order from your favorite restaurant',
      category: 'Daily Delight' as const,
      pointCost: 500,
      icon: '🍕',
      imageUrl: null,
      isAutomated: false,
      automationInstructions: null,
      cooldownHours: null,
      maxRedemptionsPerDay: 1,
      status: 'Active' as const,
      userId: USER_ID,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'Spa Day at Home',
      description: 'Face mask, bath, and relaxation',
      category: 'Daily Delight' as const,
      pointCost: 350,
      icon: '🧖',
      imageUrl: null,
      isAutomated: false,
      automationInstructions: null,
      cooldownHours: null,
      maxRedemptionsPerDay: 1,
      status: 'Active' as const,
      userId: USER_ID,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'New Book Purchase',
      description: 'Buy that book on your wishlist',
      category: 'Big Unlock' as const,
      pointCost: 1000,
      icon: '📚',
      imageUrl: null,
      isAutomated: false,
      automationInstructions: null,
      cooldownHours: null,
      maxRedemptionsPerDay: null,
      status: 'Active' as const,
      userId: USER_ID,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'Concert or Event Ticket',
      description: 'Attend a live show or event',
      category: 'Big Unlock' as const,
      pointCost: 2500,
      icon: '🎫',
      imageUrl: null,
      isAutomated: false,
      automationInstructions: null,
      cooldownHours: null,
      maxRedemptionsPerDay: null,
      status: 'Active' as const,
      userId: USER_ID,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'Weekend Getaway',
      description: 'Plan a short trip or staycation',
      category: 'Big Unlock' as const,
      pointCost: 5000,
      icon: '✈️',
      imageUrl: null,
      isAutomated: false,
      automationInstructions: null,
      cooldownHours: null,
      maxRedemptionsPerDay: null,
      status: 'Active' as const,
      userId: USER_ID,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'New Tech Gadget',
      description: 'Upgrade your gear or buy that accessory',
      category: 'Big Unlock' as const,
      pointCost: 3000,
      icon: '💻',
      imageUrl: null,
      isAutomated: false,
      automationInstructions: null,
      cooldownHours: null,
      maxRedemptionsPerDay: null,
      status: 'Active' as const,
      userId: USER_ID,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'Massage or Spa Treatment',
      description: 'Professional relaxation session',
      category: 'Big Unlock' as const,
      pointCost: 1500,
      icon: '💆',
      imageUrl: null,
      isAutomated: false,
      automationInstructions: null,
      cooldownHours: null,
      maxRedemptionsPerDay: null,
      status: 'Active' as const,
      userId: USER_ID,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function initializeMockData(): void {
  const isSeeded = localStorage.getItem(SEED_FLAG_KEY);

  if (isSeeded) {
    return;
  }

  const data = generateSeedData();
  const rewards = generateRewardsSeedData();

  const taskStorage = new MockStorage<Task>('tasks');
  const projectStorage = new MockStorage<Project>('projects');
  const goalStorage = new MockStorage<Goal>('goals');
  const metricStorage = new MockStorage<Metric>('metrics');
  const metricLogStorage = new MockStorage<MetricLog>('metricLogs');
  const habitStorage = new MockStorage<Habit>('habits');
  const habitLogStorage = new MockStorage<HabitLog>('habitLogs');
  const logbookStorage = new MockStorage<LogbookEntry>('logbookEntries');

  const taskDependencyStorage = new MockStorage<TaskDependency>('taskDependencies');
  const taskProjectStorage = new MockStorage<TaskProject>('taskProjects');
  const taskGoalStorage = new MockStorage<TaskGoal>('taskGoals');
  const projectGoalStorage = new MockStorage<ProjectGoal>('projectGoals');
  const goalMetricStorage = new MockStorage<GoalMetric>('goalMetrics');
  const habitGoalStorage = new MockStorage<HabitGoal>('habitGoals');
  const logbookTaskStorage = new MockStorage<LogbookTask>('logbookTasks');
  const logbookProjectStorage = new MockStorage<LogbookProject>('logbookProjects');
  const logbookGoalStorage = new MockStorage<LogbookGoal>('logbookGoals');
  const logbookHabitStorage = new MockStorage<LogbookHabit>('logbookHabits');

  const rewardsStorage = new MockStorage<Reward>('rewards');

  taskStorage.seed(data.tasks);
  projectStorage.seed(data.projects);
  goalStorage.seed(data.goals);
  metricStorage.seed(data.metrics);
  metricLogStorage.seed(data.metricLogs);
  habitStorage.seed(data.habits);
  habitLogStorage.seed(data.habitLogs);
  logbookStorage.seed(data.logbookEntries);

  rewardsStorage.seed(rewards);

  taskDependencyStorage.seed(data.taskDependencies);
  taskProjectStorage.seed(data.taskProjects);
  taskGoalStorage.seed(data.taskGoals);
  projectGoalStorage.seed(data.projectGoals);
  goalMetricStorage.seed(data.goalMetrics);
  habitGoalStorage.seed(data.habitGoals);
  logbookTaskStorage.seed(data.logbookTasks);
  logbookProjectStorage.seed(data.logbookProjects);
  logbookGoalStorage.seed(data.logbookGoals);
  logbookHabitStorage.seed(data.logbookHabits);

  localStorage.setItem(SEED_FLAG_KEY, 'true');

  console.log('Mock data seeded successfully!');
  console.log('Tasks:', data.tasks.length);
  console.log('Projects:', data.projects.length);
  console.log('Goals:', data.goals.length);
  console.log('Metrics:', data.metrics.length);
  console.log('Habits:', data.habits.length);
  console.log('Rewards:', rewards.length);
}

export function clearMockData(): void {
  const entities = [
    'tasks',
    'projects',
    'goals',
    'metrics',
    'metricLogs',
    'habits',
    'habitLogs',
    'logbookEntries',
    'taskDependencies',
    'taskProjects',
    'taskGoals',
    'projectGoals',
    'goalMetrics',
    'habitGoals',
    'logbookTasks',
    'logbookProjects',
    'logbookGoals',
    'logbookHabits',
    'rewards',
    'reward_redemptions',
    'wallet_balance',
    'wallet_transactions',
  ];

  entities.forEach((entity) => {
    const storage = new MockStorage(entity);
    storage.clear();
  });

  localStorage.removeItem(SEED_FLAG_KEY);

  console.log('Mock data cleared!');
}

export function reseedMockData(): void {
  clearMockData();
  initializeMockData();
}
