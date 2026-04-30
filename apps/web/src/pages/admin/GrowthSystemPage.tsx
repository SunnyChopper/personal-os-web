import {
  Target,
  TrendingUp,
  CheckSquare,
  Calendar,
  FolderKanban,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
}

const FeatureCard = ({ title, description, icon, link }: FeatureCardProps) => {
  return (
    <Link
      to={link}
      className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition group"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </Link>
  );
};

export default function GrowthSystemPage() {
  const features = [
    {
      title: 'Goals',
      description: 'Set and track long-term objectives with measurable outcomes and deadlines.',
      icon: <Target size={24} />,
      link: '/admin/goals',
    },
    {
      title: 'Projects',
      description: 'Manage complex initiatives with milestones, tasks, and progress tracking.',
      icon: <FolderKanban size={24} />,
      link: '/admin/projects',
    },
    {
      title: 'Tasks',
      description: 'Organize daily work with priorities, deadlines, and project associations.',
      icon: <CheckSquare size={24} />,
      link: '/admin/tasks',
    },
    {
      title: 'Habits',
      description: 'Build consistent routines with streak tracking and daily logging.',
      icon: <Calendar size={24} />,
      link: '/admin/habits',
    },
    {
      title: 'Metrics',
      description: 'Monitor key performance indicators with historical data and trends.',
      icon: <TrendingUp size={24} />,
      link: '/admin/metrics',
    },
    {
      title: 'Logbook',
      description: 'Maintain daily journal entries linked to your tasks, habits, and achievements.',
      icon: <BookOpen size={24} />,
      link: '/admin/logbook',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Growth System</h1>
        <p className="text-gray-600 dark:text-gray-400">
          The core productivity system inside Personal OS
        </p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-8 mb-8 border border-blue-100 dark:border-blue-900/50">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          <p>
            The Growth System is a holistic approach to personal development that integrates
            multiple productivity methodologies into a cohesive framework.
          </p>
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Strategic Layer</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Goals and Projects provide the big picture vision, defining what you want to achieve
                and how you'll get there.
              </p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Tactical Layer</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tasks and Habits handle day-to-day execution, turning strategy into consistent
                action.
              </p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Measurement Layer</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Metrics track progress with quantifiable data, providing objective feedback on
                performance.
              </p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Reflection Layer</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Logbook captures daily insights and learning, connecting activities to outcomes.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 mb-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
          How Layers Integrate
        </h2>
        <div className="space-y-8">
          <div className="relative pl-20">
            <div className="absolute left-0 top-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              1
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border-l-4 border-blue-500 dark:border-blue-400">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">
                Goals Drive Projects
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Start with long-term goals in the Strategic Layer. Break them down into Projects
                with clear milestones and deliverables.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <ArrowRight className="text-blue-500 dark:text-blue-400" size={32} strokeWidth={2.5} />
          </div>

          <div className="relative pl-20">
            <div className="absolute left-0 top-0 w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              2
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-5 border-l-4 border-green-500 dark:border-green-400">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">
                Projects Create Tasks
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Projects in the Strategic Layer generate Tasks in the Tactical Layer. Each task is a
                concrete action step toward project completion.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <ArrowRight
              className="text-green-500 dark:text-green-400"
              size={32}
              strokeWidth={2.5}
            />
          </div>

          <div className="relative pl-20">
            <div className="absolute left-0 top-0 w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              3
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-5 border-l-4 border-orange-500 dark:border-orange-400">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">
                Metrics Measure Progress
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                The Measurement Layer tracks key performance indicators tied to your goals and
                projects, providing data-driven insights on what's working.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <ArrowRight
              className="text-orange-500 dark:text-orange-400"
              size={32}
              strokeWidth={2.5}
            />
          </div>

          <div className="relative pl-20">
            <div className="absolute left-0 top-0 w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              4
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-5 border-l-4 border-purple-500 dark:border-purple-400">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">
                Reflection Informs Strategy
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Daily Logbook entries in the Reflection Layer capture insights about what works,
                what doesn't, and what adjustments are needed—feeding back into your strategic
                planning.
              </p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-sm">
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
              <strong className="text-blue-700 dark:text-blue-300">The Result:</strong> A continuous
              cycle where strategic vision guides daily actions, metrics validate progress, and
              reflection drives continuous improvement. Each layer reinforces the others, creating a
              compound effect on your growth.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">System Components</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </div>
  );
}
