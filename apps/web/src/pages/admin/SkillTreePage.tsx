import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Network,
  BookOpen,
  Code,
  Database,
  Cloud,
  Layers,
  ScanSearch,
  Plus,
  Info,
  Pencil,
  Trash2,
  Star,
  ListChecks,
} from 'lucide-react';
import { skillsService } from '@/services/knowledge-vault';
import { vaultPrimitivesService } from '@/services/knowledge-vault/vault-primitives.service';
import type { GhostNodeSuggestion, SkillLevelApi, SkillTreeSkill } from '@/types/knowledge-vault';
import Button from '@/components/atoms/Button';
import { GhostNodeUnlockModal } from '@/components/organisms/GhostNodeUnlockModal';
import { SkillTreeSkillFormModal } from '@/components/organisms/SkillTreeSkillFormModal';
import { SkillProgressRing } from '@/components/molecules/SkillProgressRing';
import { isSkillMastered, skillLevelToNum } from '@/lib/skill-tree-utils';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/routes';

const linkButtonSecondarySm =
  'inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 px-4 py-2 text-sm bg-white text-primary border-2 border-primary hover:bg-primary hover:text-white dark:bg-gray-800 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-600 dark:hover:text-white';

const DARK_MATTER_HELP =
  'Dark matter skills are suggested bridge topics—missing foundations that connect skills you already have. Scan finds gaps between your nodes; dashed cards are ghost suggestions you can turn into real skills or courses.';

const categoryIcons: Record<string, typeof Code> = {
  frontend: Code,
  backend: Layers,
  database: Database,
  devops: Cloud,
  general: Network,
};

export default function SkillTreePage() {
  const qc = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [ghostNodes, setGhostNodes] = useState<GhostNodeSuggestion[]>([]);
  const [ghostPick, setGhostPick] = useState<GhostNodeSuggestion | null>(null);
  const [dmLoading, setDmLoading] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [editSkill, setEditSkill] = useState<SkillTreeSkill | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [bulkLevel, setBulkLevel] = useState<SkillLevelApi>('Intermediate');
  const [bulkBusy, setBulkBusy] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['skill-tree'],
    queryFn: async () => {
      const res = await skillsService.getTree();
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to load skills');
      }
      return res.data;
    },
  });

  const skills: SkillTreeSkill[] = data?.skills ?? [];
  const categoriesFromApi = data?.categories ?? [];

  const normalized = useMemo(() => {
    return skills.map((s) => ({
      ...s,
      levelNum: skillLevelToNum(s.level),
      categoryKey: (s.category || 'general').toLowerCase().replace(/\s+/g, '_'),
    }));
  }, [skills]);

  const categoryTabs = useMemo(() => {
    const tabs = [{ id: 'all', name: 'All Skills', icon: Network }];
    for (const c of categoriesFromApi) {
      const key = c.toLowerCase().replace(/\s+/g, '_');
      const Icon = categoryIcons[key] || BookOpen;
      tabs.push({ id: key, name: c, icon: Icon });
    }
    return tabs;
  }, [categoriesFromApi]);

  const filteredSkills =
    selectedCategory === 'all'
      ? normalized
      : normalized.filter((s) => s.categoryKey === selectedCategory);

  const groupedByLevel = filteredSkills.reduce(
    (acc, skill) => {
      const ln = skill.levelNum;
      if (!acc[ln]) acc[ln] = [];
      acc[ln].push(skill);
      return acc;
    },
    {} as Record<number, typeof normalized>
  );

  const levels = Object.keys(groupedByLevel)
    .map(Number)
    .sort((a, b) => a - b);

  const getCategoryColor = (categoryKey: string) => {
    const colors: Record<string, string> = {
      frontend:
        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
      backend:
        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
      database:
        'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700',
      devops:
        'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
      general:
        'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600',
    };
    return colors[categoryKey] || colors.general;
  };

  const learned = skills.filter((s) => s.isCompleted).length;
  const total = skills.length || 1;
  const progressPct = Math.round((learned / total) * 100);

  const parseGhostNodes = (raw: Record<string, unknown>): GhostNodeSuggestion[] => {
    const mapOne = (g: Record<string, unknown>): GhostNodeSuggestion => ({
      name: String(g.name ?? ''),
      bridgesFrom: String(g.bridgesFrom ?? g.bridges_from ?? ''),
      bridgesTo: String(g.bridgesTo ?? g.bridges_to ?? ''),
      reason: String(g.reason ?? ''),
      suggestedDifficulty: String(
        g.suggestedDifficulty ?? g.suggested_difficulty ?? 'intermediate'
      ),
    });
    const gn = raw.ghostNodes;
    if (Array.isArray(gn)) {
      return gn.map((x) => mapOne((x as Record<string, unknown>) || {})).filter((x) => x.name);
    }
    const gaps = raw.gaps;
    if (Array.isArray(gaps)) {
      return gaps.map((x) => mapOne((x as Record<string, unknown>) || {})).filter((x) => x.name);
    }
    return [];
  };

  const runDarkMatter = async () => {
    setDmLoading(true);
    try {
      const res = await vaultPrimitivesService.darkMatter();
      if (res.success && res.data) {
        setGhostNodes(parseGhostNodes(res.data as Record<string, unknown>));
      }
    } finally {
      setDmLoading(false);
    }
  };

  const verifySkill = async (skillId: string) => {
    setVerifyBusy(skillId);
    try {
      await skillsService.verifySkill(skillId);
      await qc.invalidateQueries({ queryKey: ['skill-tree'] });
    } finally {
      setVerifyBusy(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearBulkSelection = () => setSelectedIds(new Set());

  const handleDeleteSkill = async (skill: SkillTreeSkill) => {
    if (
      !window.confirm(
        `Delete “${skill.name}”? Child skills must be removed first. This cannot be undone.`
      )
    ) {
      return;
    }
    const res = await skillsService.deleteSkill(skill.id);
    if (!res.success) {
      window.alert(res.error || 'Delete failed');
      return;
    }
    await qc.invalidateQueries({ queryKey: ['skill-tree'] });
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(skill.id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (
      !window.confirm(`Delete ${ids.length} skill(s)? Child skills block deletion until removed.`)
    ) {
      return;
    }
    setBulkBusy(true);
    try {
      const errors: string[] = [];
      for (const id of ids) {
        const res = await skillsService.deleteSkill(id);
        if (!res.success) errors.push(`${id}: ${res.error || 'failed'}`);
      }
      await qc.invalidateQueries({ queryKey: ['skill-tree'] });
      clearBulkSelection();
      if (errors.length) window.alert(`Some deletes failed:\n${errors.slice(0, 5).join('\n')}`);
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkSetLevel = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      const errors: string[] = [];
      for (const id of ids) {
        const res = await skillsService.updateSkill(id, { level: bulkLevel });
        if (!res.success) errors.push(`${id}: ${res.error || 'failed'}`);
      }
      await qc.invalidateQueries({ queryKey: ['skill-tree'] });
      if (errors.length) window.alert(`Some updates failed:\n${errors.slice(0, 5).join('\n')}`);
    } finally {
      setBulkBusy(false);
    }
  };

  const onCreateSubmit = async (payload: {
    name: string;
    description: string;
    category: string;
    level: SkillLevelApi;
  }) => {
    setFormBusy(true);
    try {
      const res = await skillsService.createSkill({
        name: payload.name,
        description: payload.description || undefined,
        category: payload.category || undefined,
        level: payload.level,
      });
      if (!res.success) {
        window.alert(res.error || 'Create failed');
        return;
      }
      setCreateOpen(false);
      await qc.invalidateQueries({ queryKey: ['skill-tree'] });
    } finally {
      setFormBusy(false);
    }
  };

  const onEditSubmit = async (payload: {
    name: string;
    description: string;
    category: string;
    level: SkillLevelApi;
    progressPercentage?: number;
  }) => {
    if (!editSkill) return;
    setFormBusy(true);
    try {
      const res = await skillsService.updateSkill(editSkill.id, {
        name: payload.name,
        description: payload.description || undefined,
        category: payload.category || undefined,
        level: payload.level,
        progressPercentage: payload.progressPercentage,
      });
      if (!res.success) {
        window.alert(res.error || 'Update failed');
        return;
      }
      setEditSkill(null);
      await qc.invalidateQueries({ queryKey: ['skill-tree'] });
    } finally {
      setFormBusy(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-gray-600 dark:text-gray-400">Loading skill tree…</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-red-600 dark:text-red-400">
        {error instanceof Error ? error.message : 'Failed to load'}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Skill Tree</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Skills from your Knowledge Vault (live data). Add skills here, via the assistant, or
            enrich them from{' '}
            <Link
              to={ROUTES.admin.knowledgeVaultLibrary}
              className="text-green-600 dark:text-green-400 underline font-medium"
            >
              Library
            </Link>
            ,{' '}
            <Link
              to={ROUTES.admin.knowledgeVaultCourses}
              className="text-green-600 dark:text-green-400 underline font-medium"
            >
              Courses
            </Link>
            , and{' '}
            <Link
              to={ROUTES.admin.knowledgeVaultFlashcards}
              className="text-green-600 dark:text-green-400 underline font-medium"
            >
              Flashcards
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            data-testid="bulk-manage-toggle"
            className={bulkMode ? 'ring-2 ring-green-500' : ''}
            onClick={() => {
              setBulkMode((v) => !v);
              clearBulkSelection();
            }}
          >
            <ListChecks className="w-4 h-4 mr-1" />
            {bulkMode ? 'Exit bulk' : 'Bulk manage'}
          </Button>
          <Button
            type="button"
            size="sm"
            data-testid="add-skill-button"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add skill
          </Button>
          <Link to={ROUTES.admin.knowledgeVaultLibrary} className={cn(linkButtonSecondarySm)}>
            Open Library
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Overall Progress</h2>
          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
            {progressPct}%
          </span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
          <div
            className="bg-gradient-to-r from-green-500 to-blue-600 h-3 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          {learned} of {skills.length} skills completed · {data?.unlockedSkills ?? 0} unlocked
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          <span className="font-medium text-amber-600 dark:text-amber-400">Mastery</span> (gold
          star): completed at Master level, verification status current, decay under 25%.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categoryTabs.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon size={18} />
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
        {levels.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
              No skills in this category yet. Skills are unlocked by completing{' '}
              <strong>Courses</strong>, mastering <strong>Flashcard</strong> decks, or adding them
              manually via the <strong>Library</strong> and this page.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add your first skill
              </Button>
              <Link to={ROUTES.admin.knowledgeVaultCourses} className={cn(linkButtonSecondarySm)}>
                Go to Courses
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {levels.map((level) => (
              <div key={level}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-bold">
                    {level}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Level {level}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {level === 1 ? 'Fundamentals' : level === 2 ? 'Intermediate' : 'Advanced+'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {groupedByLevel[level].map((skill) => {
                    const dr = skill.decayRate ?? 0;
                    const mastered = isSkillMastered(skill);
                    const decayBorder =
                      skill.verificationStatus === 'needs_verification'
                        ? 'border-amber-500 shadow-amber-500/30 shadow-lg'
                        : dr > 0.5
                          ? 'border-yellow-500'
                          : dr > 0.25
                            ? 'border-lime-600/60'
                            : '';
                    const masteryRing = mastered
                      ? 'ring-2 ring-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.35)]'
                      : '';
                    return (
                      <motion.div
                        key={skill.id}
                        data-testid={`skill-tree-card-${skill.id}`}
                        title={
                          [
                            skill.lastVerifiedAt ? `Last verified: ${skill.lastVerifiedAt}` : null,
                            skill.knowledgeHalfLifeDays != null
                              ? `Half-life: ${skill.knowledgeHalfLifeDays} days`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' · ') || undefined
                        }
                        {...(skill.verificationStatus === 'needs_verification'
                          ? {
                              animate: { scale: [1, 1.02, 1] },
                              transition: { repeat: Infinity, duration: 2.2 },
                            }
                          : {})}
                        className={`group relative p-4 rounded-lg border-2 transition ${
                          (skill.decayRate ?? 0) > 0.75 ? 'opacity-60' : ''
                        } ${
                          skill.isCompleted
                            ? `${getCategoryColor(skill.categoryKey)} ${decayBorder} ${masteryRing}`
                            : `bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 ${decayBorder} ${masteryRing}`
                        } ${bulkMode && selectedIds.has(skill.id) ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''}`}
                      >
                        {bulkMode && (
                          <label className="absolute top-2 left-2 z-10 flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(skill.id)}
                              onChange={() => toggleSelect(skill.id)}
                              className="rounded border-gray-400"
                              aria-label={`Select ${skill.name}`}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </label>
                        )}

                        {!bulkMode && (
                          <div className="absolute top-1 right-1 z-10 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              className="p-1 rounded-md bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                              aria-label={`Edit ${skill.name}`}
                              onClick={() => setEditSkill(skill)}
                            >
                              <Pencil className="w-3.5 h-3.5 text-gray-700 dark:text-gray-200" />
                            </button>
                            <button
                              type="button"
                              className="p-1 rounded-md bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                              aria-label={`Delete ${skill.name}`}
                              onClick={() => void handleDeleteSkill(skill)}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        )}

                        {skill.isCompleted && !bulkMode && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}

                        {mastered && (
                          <div
                            className="absolute -bottom-1 -right-1 z-10"
                            title="Mastered"
                            data-testid={`mastery-badge-${skill.id}`}
                          >
                            <Star className="w-6 h-6 text-amber-400 fill-amber-400 drop-shadow-md" />
                          </div>
                        )}

                        <div className="flex justify-center mb-2">
                          <div className="relative flex items-center justify-center">
                            <SkillProgressRing
                              progress={skill.progressPercentage ?? 0}
                              size={40}
                              strokeWidth={2.5}
                            />
                            <span className="absolute text-[10px] font-semibold text-gray-700 dark:text-gray-200">
                              {Math.round(skill.progressPercentage ?? 0)}%
                            </span>
                          </div>
                        </div>

                        <div className="text-center">
                          <p className="font-medium text-sm mb-1">{skill.name}</p>
                          <p className="text-xs opacity-75 capitalize">
                            {skill.category || 'general'}
                          </p>
                          {skill.verificationStatus === 'needs_verification' && (
                            <p className="text-xs text-amber-600 mt-1">Needs verification</p>
                          )}
                          {typeof skill.decayRate === 'number' && (
                            <p className="text-[10px] text-gray-500 mt-1">
                              Decay {(skill.decayRate * 100).toFixed(0)}%
                            </p>
                          )}
                          {(skill.verificationStatus === 'needs_verification' ||
                            skill.verificationStatus === 'obsolete') && (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="mt-2 w-full text-xs"
                              disabled={verifyBusy === skill.id}
                              onClick={() => void verifySkill(skill.id)}
                            >
                              {verifyBusy === skill.id ? 'Verifying…' : 'Verify with AI'}
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                {ghostNodes.some((g) =>
                  groupedByLevel[level].some(
                    (s) =>
                      s.name.toLowerCase() === g.bridgesFrom.toLowerCase() ||
                      s.name.toLowerCase() === g.bridgesTo.toLowerCase()
                  )
                ) && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {ghostNodes
                      .filter((g) =>
                        groupedByLevel[level].some(
                          (s) =>
                            s.name.toLowerCase() === g.bridgesFrom.toLowerCase() ||
                            s.name.toLowerCase() === g.bridgesTo.toLowerCase()
                        )
                      )
                      .map((g) => (
                        <button
                          key={`${g.name}-${g.bridgesFrom}-${g.bridgesTo}`}
                          type="button"
                          onClick={() => setGhostPick(g)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-purple-400 dark:border-purple-500 animate-pulse bg-purple-50/30 dark:bg-purple-900/10 opacity-90 text-sm text-purple-900 dark:text-purple-100"
                        >
                          <Plus className="w-4 h-4 shrink-0" />
                          <span className="font-medium">{g.name}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <ScanSearch className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-blue-900 dark:text-blue-300">Dark matter scan</h3>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full p-1 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="What is dark matter?"
            title={DARK_MATTER_HELP}
          >
            <Info className="w-5 h-5" />
          </button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void runDarkMatter()}
            disabled={dmLoading}
          >
            {dmLoading ? 'Scanning…' : 'Scan for gaps'}
          </Button>
        </div>
        <p id="dark-matter-short" className="text-xs text-blue-800 dark:text-blue-200 max-w-3xl">
          Suggested bridge skills between topics you already track. Full definitions: see{' '}
          <strong>Skill Tree</strong> in the repository docs at{' '}
          <code className="text-[10px] bg-blue-100/50 dark:bg-blue-950/50 px-1 rounded">
            docs/frontend/SKILL_TREE.md
          </code>
          .
        </p>
        {ghostNodes.length > 0 && (
          <p className="text-xs text-blue-800 dark:text-blue-200">
            {ghostNodes.length} bridge suggestion(s) — look for pulsing dashed cards in skill levels
            above, or open one here:
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {ghostNodes.map((g) => (
            <button
              key={`all-${g.name}-${g.bridgesFrom}`}
              type="button"
              onClick={() => setGhostPick(g)}
              className="text-xs px-2 py-1 rounded border border-dashed border-purple-400 text-purple-800 dark:text-purple-200 animate-pulse"
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      <GhostNodeUnlockModal ghost={ghostPick} onClose={() => setGhostPick(null)} />

      {createOpen && (
        <SkillTreeSkillFormModal
          key="skill-create"
          mode="create"
          skill={null}
          onClose={() => setCreateOpen(false)}
          onSubmit={async (p) => onCreateSubmit(p)}
          busy={formBusy}
        />
      )}

      {editSkill && (
        <SkillTreeSkillFormModal
          key={`skill-edit-${editSkill.id}`}
          mode="edit"
          skill={editSkill}
          onClose={() => setEditSkill(null)}
          onSubmit={async (p) => onEditSubmit(p)}
          busy={formBusy}
        />
      )}

      {bulkMode && selectedIds.size > 0 && (
        <div
          className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 shadow-lg"
          data-testid="bulk-action-bar"
        >
          <span className="text-sm text-gray-700 dark:text-gray-200">
            {selectedIds.size} selected
          </span>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Set level</span>
            <select
              value={bulkLevel}
              onChange={(e) => setBulkLevel(e.target.value as SkillLevelApi)}
              className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
            >
              {(['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'] as const).map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={bulkBusy}
            onClick={() => void handleBulkSetLevel()}
          >
            Apply level
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="text-red-600 border-red-300 dark:border-red-800"
            disabled={bulkBusy}
            onClick={() => void handleBulkDelete()}
          >
            Delete selected
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={clearBulkSelection}>
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
