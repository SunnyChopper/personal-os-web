declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
  }
}

export const GA_TRACKING_ID = 'G-XN1LQN7MER';

export const pageview = (url: string) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

export const event = (action: string, params?: Record<string, unknown>) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', action, params);
  }
};

export const trackAdminAction = (action: string, category: string, label?: string) => {
  event(action, {
    event_category: category,
    event_label: label,
  });
};

export const trackTaskAction = (
  action: 'created' | 'updated' | 'deleted' | 'completed',
  taskId: string
) => {
  trackAdminAction(`task_${action}`, 'Tasks', taskId);
};

export const trackHabitAction = (
  action: 'created' | 'updated' | 'deleted' | 'completed',
  habitId: string
) => {
  trackAdminAction(`habit_${action}`, 'Habits', habitId);
};

export const trackMetricAction = (action: 'created' | 'updated' | 'deleted', metricId: string) => {
  trackAdminAction(`metric_${action}`, 'Metrics', metricId);
};

export const trackGoalAction = (
  action: 'created' | 'updated' | 'deleted' | 'achieved',
  goalId: string
) => {
  trackAdminAction(`goal_${action}`, 'Goals', goalId);
};

export const trackProjectAction = (
  action: 'created' | 'updated' | 'deleted' | 'completed',
  projectId: string
) => {
  trackAdminAction(`project_${action}`, 'Projects', projectId);
};

export const trackLogbookAction = (action: 'created' | 'updated' | 'deleted', entryId: string) => {
  trackAdminAction(`logbook_${action}`, 'Logbook', entryId);
};
