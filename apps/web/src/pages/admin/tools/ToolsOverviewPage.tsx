import { Link } from 'react-router-dom';
import { ArrowRight, DollarSign, Brain, Zap, Wrench, Sparkles } from 'lucide-react';
import { TOOL_NAV_GROUPS, TOOL_PHASE_LABELS, type ToolPhase } from '@/lib/tools/tool-nav';

function phaseBadgeClass(phase: ToolPhase) {
  switch (phase) {
    case 'available':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
    case 'phase-0':
      return 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    case 'phase-1':
      return 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200';
    case 'phase-2':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
    case 'phase-3':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200';
    case 'phase-4':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

export default function ToolsOverviewPage() {
  const valueProps = [
    {
      icon: <Wrench className="w-6 h-6" />,
      title: 'Centralized',
      description: 'All tools in one place',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: 'Cost-Effective',
      description: 'Reduce subscription costs',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'AI-Enhanced',
      description: 'Richer context for AI',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Efficient',
      description: 'Faster workflows',
      gradient: 'from-orange-500 to-amber-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-8 md:p-12 dark:from-slate-800 dark:via-blue-800 dark:to-indigo-800">
        <div className="relative z-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
              <Wrench className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Tools</h1>
          </div>
          <p className="mb-6 text-lg text-blue-100 md:max-w-2xl">
            Centralized productivity tools: orchestration, APIs, modeling, security utilities, and
            presentation — with Knowledge Vault integration where it matters.
          </p>
          <div className="flex flex-wrap gap-3">
            {valueProps.map((prop) => (
              <div
                key={prop.title}
                className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm"
              >
                <div className={`rounded-lg bg-gradient-to-br ${prop.gradient} p-1.5 text-white`}>
                  {prop.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{prop.title}</div>
                  <div className="text-xs text-blue-100">{prop.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Why Tools exists</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Replace scattered SaaS with local-first utilities and a unified automation surface. Pure
          client-side tools never send secrets to third-party loggers; server-backed pieces use your
          existing Personal OS API.
        </p>
      </div>

      {TOOL_NAV_GROUPS.map((group) => {
        const GroupIcon = group.icon;
        return (
          <section key={group.id}>
            <div className="mb-4 flex items-center gap-2">
              <GroupIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{group.label}</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {group.items.map((tool) => (
                <Link
                  key={tool.href}
                  to={tool.href}
                  className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-blue-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {tool.name}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${phaseBadgeClass(tool.phase)}`}
                        >
                          {TOOL_PHASE_LABELS[tool.phase]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{tool.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-500" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:border-blue-800 dark:from-blue-900/30 dark:to-indigo-900/30">
        <div className="flex items-start gap-4">
          <div className="shrink-0 rounded-lg bg-blue-500 p-2">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="mb-2 font-bold text-blue-900 dark:text-blue-100">Knowledge Vault</h4>
            <p className="text-gray-800 dark:text-gray-200">
              Tools that support it expose <strong>Save to Knowledge Vault</strong> so diagrams,
              API captures, and slide decks stay searchable alongside your notes.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
