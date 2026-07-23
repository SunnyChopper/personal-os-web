import type { ContentNode } from '@/types/api/personal-branding.dto';

export function sourcePillarFilterOptions(
  sourceNodes: ContentNode[],
  activeProfilePillars: string[],
  selectedProfilePillars: string[]
): string[] {
  const allowed = new Set(activeProfilePillars);
  const fromNodes = sourceNodes
    .flatMap((node) => node.pillars ?? [])
    .filter((pillar) => allowed.has(pillar));
  const combined = [...selectedProfilePillars, ...fromNodes];
  return [...new Set(combined)].sort((a, b) => a.localeCompare(b));
}

export function matchesSourcePillarFilter(node: ContentNode, selectedPillars: string[]): boolean {
  if (selectedPillars.length === 0) return true;
  const nodePillars = node.pillars ?? [];
  return selectedPillars.some((pillar) => nodePillars.includes(pillar));
}

export function filterSourceNodesByPillars(
  sourceNodes: ContentNode[],
  selectedPillars: string[]
): ContentNode[] {
  if (selectedPillars.length === 0) return sourceNodes;
  return sourceNodes.filter((node) => matchesSourcePillarFilter(node, selectedPillars));
}

export function hasActiveSourcePillarFilter(selectedPillars: string[]): boolean {
  return selectedPillars.length > 0;
}
