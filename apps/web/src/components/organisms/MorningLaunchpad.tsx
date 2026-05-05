import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  Calendar,
  Target,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Flame,
  Rocket,
  ChevronUp,
  ChevronDown,
  HeartPulse,
} from 'lucide-react';
import { useTasks, useHabits, useGoals } from '@/hooks/useGrowthSystem';
import { useFitnessRecoveryRange, useUpsertRecoveryMutation } from '@/hooks/useFitness';
import { localCalendarDate } from '@/lib/date/local-calendar';
import {
  differenceInCalendarDaysLocal,
  extractDateOnly,
  formatDateString,
  parseDateInput,
} from '@/utils/date-formatters';
import type { Task, Habit, Goal } from '@/types/growth-system';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';

interface MorningLaunchpadProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MorningLaunchpad({ isOpen, onClose }: MorningLaunchpadProps) {
  return (
    <AnimatePresence>
      {isOpen && <MorningLaunchpadContent isOpen={isOpen} onClose={onClose} />}
    </AnimatePresence>
  );
}

interface MorningLaunchpadContentProps {
  isOpen: boolean;
  onClose: () => void;
}

function MorningLaunchpadContent({ isOpen, onClose }: MorningLaunchpadContentProps) {
  const navigate = useNavigate();
  const { tasks, updateTask, completeTask } = useTasks();
  const { habits } = useHabits();
  const { goals } = useGoals();
  const today = localCalendarDate();
  const { data: recoveryRes } = useFitnessRecoveryRange(today, today, { enabled: isOpen });
  const upsertRecovery = useUpsertRecoveryMutation();
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [briefing, setBriefing] = useState<string>('');
  const [orderedTasks, setOrderedTasks] = useState<Task[]>([]);
  const [sleepHours, setSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState('');
  const [energyLevel, setEnergyLevel] = useState('');

  const handleEngage = () => {
    onClose();
    setTimeout(() => {
      navigate(ROUTES.admin.focus, { state: { sessionTasks: orderedTasks } });
    }, 300);
  };

  const filteredAndSortedTasks = useMemo(() => {
    const todayKey = localCalendarDate();

    const activeTasks = tasks.filter((task) => {
      if (task.status === 'Done' || task.status === 'Cancelled') return false;

      const isScheduledForToday =
        !!task.scheduledDate && extractDateOnly(task.scheduledDate) === todayKey;

      const dueDelta = task.dueDate ? differenceInCalendarDaysLocal(task.dueDate) : null;
      const isOverdue = dueDelta !== null && dueDelta < 0;
      const isDueToday = dueDelta === 0;

      return isScheduledForToday || isOverdue || isDueToday;
    });

    const priorityOrder: Record<string, number> = { P1: 4, P2: 3, P3: 2, P4: 1 };

    activeTasks.sort((a: Task, b: Task) => {
      const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;

      if (a.dueDate && b.dueDate) {
        return parseDateInput(a.dueDate).getTime() - parseDateInput(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      return 0;
    });

    return activeTasks;
  }, [tasks]);

  useEffect(() => {
    if (filteredAndSortedTasks.length > 0) {
      setOrderedTasks(filteredAndSortedTasks);
    }
  }, [filteredAndSortedTasks]);

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...orderedTasks];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setOrderedTasks(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index === orderedTasks.length - 1) return;
    const newOrder = [...orderedTasks];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setOrderedTasks(newOrder);
  };

  const handleMarkAsDone = async (task: Task) => {
    setCompletingTaskId(task.id);
    await new Promise((resolve) => setTimeout(resolve, 500));

    await completeTask(task.id);

    setCompletingTaskId(null);
  };

  const handleDefer = async (task: Task) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    await updateTask({
      id: task.id,
      input: {
        scheduledDate: tomorrow.toISOString(),
      },
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1':
        return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'P2':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
      case 'P3':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      case 'P4':
        return 'bg-green-500/20 text-green-300 border-green-500/50';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  };

  const generateBriefing = () => {
    const hour = new Date().getHours();
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 18) greeting = 'Good afternoon';
    else if (hour >= 18) greeting = 'Good evening';

    const taskCount = orderedTasks.length;
    const highPriorityCount = orderedTasks.filter(
      (t) => t.priority === 'P1' || t.priority === 'P2'
    ).length;
    const dailyHabits = habits.filter((h: Habit) => h.frequency === 'Daily');
    const activeGoals = goals.filter((g: Goal) => g.status === 'Active');

    let briefingText = `${greeting}! `;

    if (taskCount === 0) {
      briefingText +=
        'You have no tasks scheduled for today. This is a great opportunity to plan ahead, work on personal projects, or take some well-deserved rest.';
    } else {
      briefingText += `You have ${taskCount} task${taskCount !== 1 ? 's' : ''} scheduled for today`;
      if (highPriorityCount > 0) {
        briefingText += `, with ${highPriorityCount} high-priority item${highPriorityCount !== 1 ? 's' : ''} that need your immediate attention`;
      }
      briefingText += '. ';

      if (hour < 12) {
        briefingText +=
          'Start your day by tackling the most important tasks first. Your fresh morning energy is perfect for challenging work.';
      } else if (hour < 18) {
        briefingText +=
          'Keep your momentum going. Review your progress and adjust your focus as needed.';
      } else {
        briefingText +=
          'As the day winds down, focus on completing key tasks and preparing for tomorrow.';
      }
    }

    if (dailyHabits.length > 0) {
      briefingText += ` Don't forget to maintain your ${dailyHabits.length} daily habit${dailyHabits.length !== 1 ? 's' : ''} to keep your streak alive.`;
    }

    if (activeGoals.length > 0) {
      briefingText += ` Remember, each task brings you closer to your ${activeGoals.length} active goal${activeGoals.length !== 1 ? 's' : ''}.`;
    }

    setBriefing(briefingText);
  };

  const completedToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks.filter(
      (t: Task) => t.status === 'Done' && t.completedDate && new Date(t.completedDate) >= today
    ).length;
  }, [tasks]);

  const completionRate = useMemo(() => {
    const total = orderedTasks.length + completedToday;
    if (total === 0) return 100;
    return Math.round((completedToday / total) * 100);
  }, [orderedTasks, completedToday]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      generateBriefing();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, orderedTasks, habits, goals]);

  const existingRecovery =
    recoveryRes?.success && recoveryRes.data?.data?.length ? recoveryRes.data.data[0] : null;

  useEffect(() => {
    if (!isOpen || !existingRecovery) return;
    setSleepHours(existingRecovery.sleepHours != null ? String(existingRecovery.sleepHours) : '');
    setSleepQuality(
      existingRecovery.sleepQuality != null ? String(existingRecovery.sleepQuality) : ''
    );
    setEnergyLevel(
      existingRecovery.energyLevel != null ? String(existingRecovery.energyLevel) : ''
    );
  }, [isOpen, existingRecovery]);

  const saveMorningRecovery = async () => {
    const body: Record<string, unknown> = {};
    if (sleepHours !== '') body.sleepHours = Number(sleepHours);
    if (sleepQuality !== '') body.sleepQuality = Number(sleepQuality);
    if (energyLevel !== '') body.energyLevel = Number(energyLevel);
    await upsertRecovery.mutateAsync({ date: today, body });
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
      />
      <div className="fixed inset-0 z-50 overflow-hidden flex flex-col">
        <div className="flex-1 flex flex-col overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden"
          >
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex-1 bg-gray-900 dark:bg-gray-950 text-white overflow-y-auto"
            >
              <div className="p-8 lg:p-12">
                <div className="flex items-center gap-3 mb-8">
                  <Target className="w-10 h-10 text-blue-400" />
                  <div>
                    <h2 className="text-4xl font-bold">Mission Control</h2>
                    <p className="text-gray-400 text-lg">Build your session playlist</p>
                  </div>
                </div>

                {orderedTasks.length > 0 ? (
                  <motion.div
                    className="space-y-4"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                        },
                      },
                    }}
                  >
                    {orderedTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        variants={{
                          hidden: { opacity: 0, x: -20 },
                          visible: { opacity: 1, x: 0 },
                        }}
                        className={`bg-gray-800 border border-gray-700 rounded-xl p-6 transition-all ${
                          completingTaskId === task.id
                            ? 'scale-95 opacity-50'
                            : 'hover:border-blue-500/50'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center gap-2 flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center">
                              <span className="text-xl font-bold text-blue-300">{index + 1}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handleMoveUp(index)}
                                disabled={index === 0}
                                className={`p-1 rounded transition-colors ${
                                  index === 0
                                    ? 'text-gray-700 cursor-not-allowed'
                                    : 'text-gray-400 hover:text-blue-400 hover:bg-gray-700'
                                }`}
                              >
                                <ChevronUp className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleMoveDown(index)}
                                disabled={index === orderedTasks.length - 1}
                                className={`p-1 rounded transition-colors ${
                                  index === orderedTasks.length - 1
                                    ? 'text-gray-700 cursor-not-allowed'
                                    : 'text-gray-400 hover:text-blue-400 hover:bg-gray-700'
                                }`}
                              >
                                <ChevronDown className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={() => handleMarkAsDone(task)}
                            disabled={completingTaskId === task.id}
                            className="flex-shrink-0 mt-1 group"
                          >
                            {completingTaskId === task.id ? (
                              <motion.div
                                initial={{ scale: 1 }}
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                              >
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                              </motion.div>
                            ) : (
                              <div className="w-8 h-8 rounded-full border-2 border-gray-600 group-hover:border-green-500 group-hover:bg-green-500/20 transition-all flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-gray-600 group-hover:text-green-500 transition-all" />
                              </div>
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <h3 className="text-xl font-bold text-white leading-tight">
                                {task.title}
                              </h3>
                              <span
                                className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-semibold border ${getPriorityColor(
                                  task.priority
                                )}`}
                              >
                                {task.priority}
                              </span>
                            </div>

                            {task.description && (
                              <p className="text-gray-300 mb-4 line-clamp-2">{task.description}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-4 mb-4">
                              {task.size && (
                                <div className="flex items-center gap-1.5 text-gray-400">
                                  <Clock className="w-4 h-4" />
                                  <span className="text-sm">{task.size}pts</span>
                                </div>
                              )}
                              {task.dueDate && (
                                <div className="flex items-center gap-1.5 text-gray-400">
                                  <Calendar className="w-4 h-4" />
                                  <span className="text-sm">
                                    Due{' '}
                                    {formatDateString(task.dueDate, {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    }) ?? ''}
                                  </span>
                                </div>
                              )}
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-medium">
                                {task.area}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDefer(task)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-medium transition-colors"
                              >
                                Defer to Tomorrow
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-16">
                    <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">All Clear!</h3>
                    <p className="text-gray-400 mb-6">
                      No tasks scheduled for today. Time to plan or relax!
                    </p>
                    <Link
                      to={ROUTES.admin.tasks}
                      onClick={onClose}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Add Tasks
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex-1 bg-gradient-to-br from-blue-900 to-cyan-900 dark:from-blue-950 dark:to-cyan-950 text-white overflow-y-auto"
            >
              <div className="p-8 lg:p-12 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                  <Sparkles className="w-10 h-10 text-cyan-400" />
                  <div>
                    <h2 className="text-4xl font-bold">Mission Briefing</h2>
                    <p className="text-cyan-200 text-lg">Your personalized daily overview</p>
                  </div>
                </div>

                <div className="flex-1 mb-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="p-3 bg-cyan-400/20 rounded-full">
                        <Sparkles className="w-6 h-6 text-cyan-300" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-1">Daily Overview</h3>
                        <p className="text-cyan-200 text-sm">
                          {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <p className="text-lg leading-relaxed text-white/90">{briefing}</p>
                  </div>
                </div>

                <div className="mb-6 rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-cyan-300" />
                    <h3 className="text-lg font-bold text-white">Recovery check-in</h3>
                  </div>
                  <p className="mb-3 text-xs text-cyan-100/90">
                    Logged to DailyRecovery for Aura (not the logbook). Optional — skip if you
                    prefer the full Health & Fitness overview.
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <label className="text-xs text-cyan-50">
                      Sleep (h)
                      <input
                        type="number"
                        step="0.25"
                        className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-sm text-white placeholder:text-cyan-200/50"
                        placeholder="—"
                        value={sleepHours}
                        onChange={(e) => setSleepHours(e.target.value)}
                      />
                    </label>
                    <label className="text-xs text-cyan-50">
                      Sleep Q (1–10)
                      <input
                        type="number"
                        className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-sm text-white placeholder:text-cyan-200/50"
                        placeholder="—"
                        value={sleepQuality}
                        onChange={(e) => setSleepQuality(e.target.value)}
                      />
                    </label>
                    <label className="text-xs text-cyan-50">
                      Energy (1–10)
                      <input
                        type="number"
                        className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-sm text-white placeholder:text-cyan-200/50"
                        placeholder="—"
                        value={energyLevel}
                        onChange={(e) => setEnergyLevel(e.target.value)}
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={saveMorningRecovery}
                    disabled={upsertRecovery.isPending}
                    className="mt-4 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/30 disabled:opacity-50"
                  >
                    {upsertRecovery.isPending ? 'Saving…' : 'Save recovery'}
                  </button>
                  {existingRecovery?.recoveryScore != null && (
                    <p className="mt-2 text-xs text-cyan-100">
                      Score:{' '}
                      <span className="font-mono font-semibold">
                        {existingRecovery.recoveryScore.toFixed(0)}
                      </span>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="w-5 h-5 text-cyan-300" />
                      <h4 className="font-semibold text-cyan-100">Today</h4>
                    </div>
                    <p className="text-3xl font-bold">{new Date().getDate()}</p>
                    <p className="text-sm text-cyan-200 mt-1">
                      {new Date().toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="flex items-center gap-3 mb-3">
                      <Target className="w-5 h-5 text-cyan-300" />
                      <h4 className="font-semibold text-cyan-100">Completion</h4>
                    </div>
                    <p className="text-3xl font-bold">{completionRate}%</p>
                    <p className="text-sm text-cyan-200 mt-1">
                      {completedToday} of {orderedTasks.length + completedToday} tasks
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="flex items-center gap-3 mb-3">
                      <Flame className="w-5 h-5 text-cyan-300" />
                      <h4 className="font-semibold text-cyan-100">Habits</h4>
                    </div>
                    <p className="text-3xl font-bold">
                      {habits.filter((h: Habit) => h.frequency === 'Daily').length}
                    </p>
                    <p className="text-sm text-cyan-200 mt-1">Daily routines</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
          className="flex-shrink-0"
        >
          <button
            onClick={handleEngage}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-xl py-6 px-8 flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-2xl"
          >
            <Rocket className="w-8 h-8" />
            <span>Engage - Enter Focus Mode</span>
            <motion.div
              animate={{
                x: [0, 5, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <ArrowRight className="w-6 h-6" />
            </motion.div>
          </button>
        </motion.div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 text-white hover:text-gray-300 transition-colors bg-black/30 hover:bg-black/50 rounded-full p-2"
        >
          <X size={24} />
        </button>
      </div>
    </>
  );
}
