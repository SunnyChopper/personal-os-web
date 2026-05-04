import { Link } from 'react-router-dom';
import {
  Briefcase,
  ClipboardList,
  FileText,
  MessageSquare,
  PiggyBank,
  Sparkles,
  Target,
} from 'lucide-react';
import { ROUTES } from '@/routes';

const futureIdeas = [
  {
    title: 'Application & job tracker',
    description: 'Pipeline stages, follow-ups, and source-of-truth links for every role.',
    icon: Target,
  },
  {
    title: 'Interview prep',
    description: 'Company research, story bank, and practice prompts tied to your profile.',
    icon: MessageSquare,
  },
  {
    title: 'Recruiter & networking notes',
    description: 'Context for intros, referrals, and recurring conversations.',
    icon: ClipboardList,
  },
  {
    title: 'Compensation research',
    description: 'Bands, offers, and negotiation notes in one place.',
    icon: PiggyBank,
  },
  {
    title: 'Portfolio proof bank',
    description: 'Artifacts, metrics, and links ready to drop into tailored materials.',
    icon: Sparkles,
  },
  {
    title: 'Application history',
    description: 'What you submitted, when, and which résumé variant you used.',
    icon: FileText,
  },
];

export default function CareerDevelopmentOverviewPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-gray-200/80 bg-white/80 p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900/40">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">What lives here today</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl">
          The <strong className="font-medium text-gray-800 dark:text-gray-200">Resume Builder</strong> is
          the active tool in this area: a profile bank, experience editor, tailored résumé generation, and
          AI-assisted suggestions. Use it when you are preparing materials for a specific role or refreshing
          your master content.
        </p>
        <div className="mt-5">
          <Link
            to={ROUTES.admin.careerResume}
            className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            Open Resume Builder
          </Link>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="size-5 text-gray-500 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Roadmap ideas</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-3xl">
          These modules are not built yet; they sketch how Career could grow beyond résumé drafting.
        </p>
        <ul className="grid gap-4 sm:grid-cols-2">
          {futureIdeas.map(({ title, description, icon: Icon }) => (
            <li
              key={title}
              className="rounded-xl border border-gray-200/80 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/30"
            >
              <div className="flex gap-3">
                <div className="shrink-0 rounded-lg bg-blue-100/70 p-2 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
