import type { LucideIcon } from 'lucide-react';
import { Workflow, Globe, LayoutGrid, Presentation, Shield, Container } from 'lucide-react';
import { ROUTES } from '@/routes';

/** Which implementation phase ships this tool (for overview badges). */
export type ToolPhase = 'phase-0' | 'phase-1' | 'phase-2' | 'phase-3' | 'phase-4' | 'available';

export interface ToolNavItem {
  name: string;
  href: string;
  /** Short description for overview cards */
  description: string;
  phase: ToolPhase;
}

export interface ToolNavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: ToolNavItem[];
}

/**
 * Double-nested Tools sidebar + overview grid data.
 * Keep in sync with `App.tsx` nested routes under `/admin/tools`.
 */
export const TOOL_NAV_GROUPS: ToolNavGroup[] = [
  {
    id: 'orchestration',
    label: 'Orchestration & Workflows',
    icon: Workflow,
    items: [
      {
        name: 'Workflow Engine',
        href: ROUTES.admin.tools.workflows,
        description: 'Visual node-based automations (triggers, actions, vault saves).',
        phase: 'phase-3',
      },
      {
        name: 'Cron Builder',
        href: ROUTES.admin.tools.cronBuilder,
        description: 'Build cron expressions from a visual UI.',
        phase: 'phase-3',
      },
    ],
  },
  {
    id: 'network',
    label: 'Network & APIs',
    icon: Globe,
    items: [
      {
        name: 'Local Postman',
        href: ROUTES.admin.tools.postman,
        description: 'HTTP client with history; save requests or responses to the Vault.',
        phase: 'phase-2',
      },
      {
        name: 'Webhook Catcher',
        href: ROUTES.admin.tools.webhooks,
        description: 'Public ingest URL, stored events, live inspector.',
        phase: 'phase-2',
      },
    ],
  },
  {
    id: 'architecture',
    label: 'Architecture & Modeling',
    icon: LayoutGrid,
    items: [
      {
        name: 'Infinite Whiteboard',
        href: ROUTES.admin.tools.whiteboard,
        description: 'Excalidraw-style canvas with local autosave and Vault export.',
        phase: 'phase-1',
      },
    ],
  },
  {
    id: 'data',
    label: 'Data & Security',
    icon: Shield,
    items: [
      {
        name: 'Formatters & Converters',
        href: ROUTES.admin.tools.formatters,
        description: 'JSON/YAML, CSV→JSON, string case, URL encode — offline.',
        phase: 'phase-4',
      },
      {
        name: 'JWT Decoder',
        href: ROUTES.admin.tools.jwt,
        description: 'Decode JWT header/payload locally; optional local verify.',
        phase: 'phase-4',
      },
      {
        name: 'Base64',
        href: ROUTES.admin.tools.base64,
        description: 'Encode/decode text and files in the browser.',
        phase: 'phase-4',
      },
      {
        name: 'Regex Sandbox',
        href: ROUTES.admin.tools.regex,
        description: 'Live matches + optional AI explanation (network only for explain).',
        phase: 'phase-4',
      },
    ],
  },
  {
    id: 'devops',
    label: 'DevOps & Environment',
    icon: Container,
    items: [
      {
        name: 'Docker Compose Builder',
        href: ROUTES.admin.tools.docker,
        description: 'Pick services and generate compose YAML locally.',
        phase: 'phase-4',
      },
      {
        name: 'ESLint Rule Builder',
        href: ROUTES.admin.tools.eslint,
        description: 'Scaffold .eslintrc.json from checkboxes.',
        phase: 'phase-4',
      },
    ],
  },
  {
    id: 'presentation',
    label: 'Documents',
    icon: Presentation,
    items: [
      {
        name: 'Markdown Viewer',
        href: ROUTES.admin.markdownViewer,
        description: 'Browse and edit markdown files with folders and tags.',
        phase: 'available',
      },
    ],
  },
];

export const TOOL_PHASE_LABELS: Record<ToolPhase, string> = {
  'phase-0': 'Foundation',
  'phase-1': 'Architecture',
  'phase-2': 'Network',
  'phase-3': 'Orchestration',
  'phase-4': 'Utilities',
  available: 'Available',
};
