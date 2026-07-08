import { Link } from 'react-router-dom';
import { PenLine, Radio, Share2, User, Users } from 'lucide-react';
import { ROUTES } from '@/routes';
import { Card } from '@/components/atoms/Card';
import { cn } from '@/lib/utils';
import { linkAccentClassName } from './personal-branding-ui';

const MODULES = [
  {
    title: 'Brand Identity',
    description: 'Core profile and platform-specific formatting rules.',
    href: ROUTES.admin.personalBrandingBrandIdentity,
    icon: User,
  },
  {
    title: 'Content Workbench',
    description: 'Sandbox workspace and ideation engine.',
    href: ROUTES.admin.personalBrandingWorkbench,
    icon: PenLine,
  },
  {
    title: 'Content Pipeline',
    description: 'Generate and manage platform-native content variants.',
    href: ROUTES.admin.personalBrandingPipeline,
    icon: Share2,
  },
  {
    title: 'Signal Radar',
    description: 'Trend stream and source management.',
    href: ROUTES.admin.personalBrandingRadar,
    icon: Radio,
  },
  {
    title: 'Rolodex',
    description: 'Interactions board and connection directory.',
    href: ROUTES.admin.personalBrandingRolodex,
    icon: Users,
  },
] as const;

export default function PersonalBrandingOverviewPage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {MODULES.map((mod) => {
        const Icon = mod.icon;
        return (
          <Link key={mod.href} to={mod.href} className="group block rounded-2xl focus:outline-none">
            <Card
              className={cn(
                'h-full rounded-2xl p-6 transition dark:bg-gray-900',
                'group-hover:border-blue-300 group-hover:shadow-sm dark:group-hover:border-blue-600',
                'group-focus-visible:ring-2 group-focus-visible:ring-blue-500 group-focus-visible:ring-offset-2'
              )}
            >
              <div className={cn('mb-3 flex items-center gap-2', linkAccentClassName)}>
                <Icon className="size-5" />
                <span className="text-sm font-medium">{mod.title}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{mod.description}</p>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
