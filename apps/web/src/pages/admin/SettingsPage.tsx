import { useState, useEffect } from 'react';
import { Activity, Monitor, Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import { AISettingsPanel } from '@/components/settings/AISettingsPanel';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { apiClient } from '@/lib/api-client';

type Theme = 'light' | 'dark' | 'system';

const WEEKLY_REVIEW_DAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export default function SettingsPage() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme;
    return stored || 'system';
  });

  const { enabled: soundEnabled, setEnabled: setSoundEnabled, play } = useSoundEffects();

  const [weeklyReviewDay, setWeeklyReviewDay] = useState<number>(0);
  const [weeklyReviewLoading, setWeeklyReviewLoading] = useState(true);
  const [weeklyReviewSaving, setWeeklyReviewSaving] = useState(false);
  const [weeklyReviewError, setWeeklyReviewError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setWeeklyReviewLoading(true);
      setWeeklyReviewError(null);
      const res = await apiClient.getPreferencesWeeklyReviewDay();
      if (cancelled) return;
      if (res.success && res.data) {
        setWeeklyReviewDay(res.data.weeklyReviewDay);
      } else {
        setWeeklyReviewError(res.error?.message ?? 'Could not load weekly review day');
      }
      setWeeklyReviewLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyTheme = (selectedTheme: Theme) => {
    let effectiveTheme = selectedTheme;

    if (selectedTheme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    localStorage.setItem('theme', theme);
    applyTheme(theme);
  }, [theme]);

  const themeOptions: {
    value: Theme;
    label: string;
    icon: React.ReactNode;
    description: string;
  }[] = [
    {
      value: 'light',
      label: 'Light',
      icon: <Sun size={20} />,
      description: 'Use light theme',
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: <Moon size={20} />,
      description: 'Use dark theme',
    },
    {
      value: 'system',
      label: 'System',
      icon: <Monitor size={20} />,
      description: 'Follow system preference',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your Personal OS preferences</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Appearance</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Customize how Personal OS looks on your device
        </p>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Color Theme
          </label>
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition ${
                theme === option.value
                  ? 'border-blue-500 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-700/50'
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                  theme === option.value
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}
              >
                {option.icon}
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-900 dark:text-gray-100">{option.label}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{option.description}</div>
              </div>
              {theme === option.value && (
                <div className="w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Sound Effects</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Enable satisfying sound effects for button clicks and actions
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                soundEnabled
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
              }`}
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {soundEnabled ? 'Sound Effects On' : 'Sound Effects Off'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {soundEnabled
                  ? 'Enjoy satisfying sounds when you interact'
                  : 'Silent mode - no sound effects'}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              const newValue = !soundEnabled;
              setSoundEnabled(newValue);
              // Play a test sound when enabling
              if (newValue) {
                setTimeout(() => play('pop'), 100);
              }
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              soundEnabled ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            aria-label={soundEnabled ? 'Disable sound effects' : 'Enable sound effects'}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                soundEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Growth System</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Weekly Review runs in the background on your chosen day (first hour after midnight in your{' '}
          <span className="font-medium">time zone</span> from Proactive Assistant settings).
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400">
              <Activity size={20} />
            </div>
            <div>
              <label
                htmlFor="weekly-review-day"
                className="block text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                Weekly review day
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                AI synthesis and email run on this day
              </p>
            </div>
          </div>
          <select
            id="weekly-review-day"
            disabled={weeklyReviewLoading || weeklyReviewSaving}
            value={weeklyReviewDay}
            onChange={async (e) => {
              const next = Number(e.target.value);
              setWeeklyReviewDay(next);
              setWeeklyReviewSaving(true);
              setWeeklyReviewError(null);
              const res = await apiClient.setPreferencesWeeklyReviewDay({
                weeklyReviewDay: next,
              });
              if (!res.success || !res.data) {
                setWeeklyReviewError(res.error?.message ?? 'Save failed');
              } else {
                setWeeklyReviewDay(res.data.weeklyReviewDay);
              }
              setWeeklyReviewSaving(false);
            }}
            className="sm:ml-auto px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm min-w-[200px] disabled:opacity-50"
          >
            {WEEKLY_REVIEW_DAY_LABELS.map((label, i) => (
              <option key={label} value={i}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {weeklyReviewError && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{weeklyReviewError}</p>
        )}
      </div>

      <div className="mt-6">
        <AISettingsPanel />
      </div>
    </div>
  );
}
