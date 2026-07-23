import {
  BRAND_PLATFORM_LABELS,
  type BrandPlatform,
  type ContentNode,
} from '@/types/api/personal-branding.dto';
import { extractDateOnly } from '@/utils/date-formatters';

const SHORT_SLUG_MAX_LENGTH = 28;

export interface SourceContentSelectOption {
  value: string;
  label: string;
  description: string;
}

function platformDisplayName(platform: BrandPlatform | null | undefined): string {
  if (!platform) return 'Unknown platform';
  return BRAND_PLATFORM_LABELS[platform] ?? platform;
}

export function shortSlugFromTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (slug.length <= SHORT_SLUG_MAX_LENGTH) return slug;

  const parts = slug.split('-').filter(Boolean);
  let result = '';
  for (const part of parts) {
    const next = result ? `${result}-${part}` : part;
    if (next.length > SHORT_SLUG_MAX_LENGTH) break;
    result = next;
  }

  return result || slug.slice(0, SHORT_SLUG_MAX_LENGTH).replace(/-+$/, '');
}

function descriptionKey(node: Pick<ContentNode, 'platform' | 'createdAt' | 'title'>): string {
  const platform = platformDisplayName(node.platform);
  const date = extractDateOnly(node.createdAt);
  const slug = shortSlugFromTitle(node.title);
  return `${platform} · ${date} · ${slug}`;
}

export function formatSourceContentSelectOption(
  node: Pick<ContentNode, 'id' | 'title' | 'status' | 'platform' | 'createdAt'>,
  options?: { disambiguateIds?: Set<string> }
): SourceContentSelectOption {
  const platform = platformDisplayName(node.platform);
  const date = extractDateOnly(node.createdAt);
  const slug = shortSlugFromTitle(node.title);

  let description = `${platform} · ${date} · ${slug}`;
  if (options?.disambiguateIds?.has(node.id)) {
    description = `${description} · ${node.id.slice(-4)}`;
  }
  if (node.status === 'PIPELINED') {
    description = `${description} · Pipelined`;
  }

  return {
    value: node.id,
    label: node.title,
    description,
  };
}

export function buildSourceContentSelectOptions(
  nodes: Pick<ContentNode, 'id' | 'title' | 'status' | 'platform' | 'createdAt'>[]
): SourceContentSelectOption[] {
  const keyToIds = new Map<string, string[]>();

  for (const node of nodes) {
    const key = descriptionKey(node);
    const ids = keyToIds.get(key) ?? [];
    ids.push(node.id);
    keyToIds.set(key, ids);
  }

  const disambiguateIds = new Set<string>();
  for (const ids of keyToIds.values()) {
    if (ids.length > 1) {
      for (const id of ids) {
        disambiguateIds.add(id);
      }
    }
  }

  return nodes.map((node) => formatSourceContentSelectOption(node, { disambiguateIds }));
}
