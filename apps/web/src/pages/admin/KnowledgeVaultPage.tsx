import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { PageContainer } from '@/components/templates/PageContainer';
import {
  Search,
  Plus,
  Grid3x3,
  List,
  FileText,
  FileCheck,
  BookOpen,
  CreditCard,
  ChevronDown,
  HelpCircle,
  ClipboardList,
  BookMarked,
} from 'lucide-react';
import { useKnowledgeVault } from '@/contexts/KnowledgeVault';
import { ROUTES } from '@/routes';
import VaultItemCard from '@/components/organisms/VaultItemCard';
import CourseStackCard from '@/components/organisms/CourseStackCard';
import FlashcardDeckCard from '@/components/organisms/FlashcardDeckCard';
import Dialog from '@/components/molecules/Dialog';
import ConfirmDialog from '@/components/molecules/ConfirmDialog';
import ArchiveVaultItemDialog from '@/components/molecules/knowledge-vault/ArchiveVaultItemDialog';
import KeyboardShortcutsOverlay from '@/components/molecules/knowledge-vault/KeyboardShortcutsOverlay';
import { LibraryBulkActionsBar } from '@/components/molecules/LibraryBulkActionsBar';
import TagInput from '@/components/molecules/TagInput';
import NoteForm, { type NoteFormHandle } from '@/components/organisms/NoteForm';
import DocumentForm from '@/components/organisms/DocumentForm';
import FlashcardDeckCreateDialog from '@/components/organisms/FlashcardDeckCreateDialog';
import { PracticeArtifactCreateDialog } from '@/components/organisms/PracticeArtifactCreateDialog';
import type { PracticeArtifactCreateKind } from '@/components/organisms/PracticeArtifactCreateDialog';
import type {
  VaultItemType,
  VaultItem,
  Note,
  CourseLesson,
  Course,
  HomeworkVaultItem,
  PracticeQuestionSetItem,
  QuizVaultItem,
  Flashcard,
} from '@/types/knowledge-vault';
import type { Area } from '@/types/growth-system';
import { Select } from '@/components/atoms/Select';
import {
  buildFlashcardsHubDeckUrl,
  buildStudySessionDeckUrl,
} from '@/lib/knowledge-vault/flashcard-deck-overdue';
import { getLibraryVaultItemExit } from '@/lib/knowledge-vault/library-filter-motion';
import { LibraryFilterGridShell } from '@/components/molecules/knowledge-vault/LibraryFilterGridShell';
import {
  clearLibrarySelection,
  isRefSelected,
  toggleLibrarySelection,
  type LibrarySelectableRef,
} from '@/lib/knowledge-vault/library-selection';
import {
  bulkAddTags,
  bulkChangeArea,
  bulkSoftArchive,
  summarizeBulkOutcome,
  type LibraryBulkMutations,
} from '@/lib/knowledge-vault/library-bulk-actions';
import {
  getKnowledgeVaultShortcutSections,
  isKeyboardShortcutsChord,
} from '@/lib/knowledge-vault/keyboard-shortcuts';
import type { OverlayLayer } from '@/lib/overlay-layer';
import { practiceArtifactsService } from '@/services/knowledge-vault/practice-artifacts.service';
import { useToast } from '@/hooks/use-toast';

const AREAS: Area[] = ['Health', 'Wealth', 'Love', 'Happiness', 'Operations', 'Day Job'];

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | VaultItemType;

interface CourseStack {
  course: Course;
  lessons: CourseLesson[];
}

export default function KnowledgeVaultPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const editNoteId = searchParams.get('editNote');
  const {
    vaultItems,
    courses,
    flashcardDecks,
    loading,
    refreshVaultItems,
    deleteItem,
    updateNote,
    updateDocument,
    updateCourse,
    updateFlashcardDeck,
  } = useKnowledgeVault();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedArea, setSelectedArea] = useState<Area | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [createDialogType, setCreateDialogType] = useState<VaultItemType | null>(null);
  const [createInitialSourceIds, setCreateInitialSourceIds] = useState<string[] | null>(null);
  const [itemToArchive, setItemToArchive] = useState<VaultItem | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [hiddenArchiveIds, setHiddenArchiveIds] = useState<string[]>([]);
  const [selectedRefs, setSelectedRefs] = useState<LibrarySelectableRef[]>([]);
  const [selectionAnchorIndex, setSelectionAnchorIndex] = useState<number | null>(null);
  const [bulkTagsDraft, setBulkTagsDraft] = useState<string[]>([]);
  const [bulkAreaDraft, setBulkAreaDraft] = useState<Area>('Operations');
  const [addTagsDialogOpen, setAddTagsDialogOpen] = useState(false);
  const [changeAreaDialogOpen, setChangeAreaDialogOpen] = useState(false);
  const [bulkConfirmMode, setBulkConfirmMode] = useState<'archive' | 'delete' | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion() ?? false;
  const noteFormRef = useRef<NoteFormHandle>(null);

  const editingNote = useMemo(() => {
    if (!editNoteId) return null;
    const item = vaultItems.find((v) => v.id === editNoteId && v.type === 'note');
    return (item as Note | undefined) ?? null;
  }, [editNoteId, vaultItems]);

  const libraryDialogOpen =
    createDialogType !== null ||
    editingNote !== null ||
    itemToArchive !== null ||
    bulkConfirmMode !== null ||
    addTagsDialogOpen ||
    changeAreaDialogOpen;

  const shortcutsLayer: OverlayLayer = libraryDialogOpen ? 'nested' : 'default';

  const shortcutSections = useMemo(
    () =>
      getKnowledgeVaultShortcutSections({
        editNoteOpen: editingNote !== null,
        flashcardCreateOpen: createDialogType === 'flashcard',
      }),
    [createDialogType, editingNote]
  );

  useEffect(() => {
    const onChord = (event: KeyboardEvent) => {
      if (!isKeyboardShortcutsChord(event)) return;
      event.preventDefault();
      setShortcutsOpen((open) => !open);
    };

    window.addEventListener('keydown', onChord, true);
    return () => window.removeEventListener('keydown', onChord, true);
  }, []);

  const setEditingNote = useCallback(
    (note: Note | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (note) {
            next.set('editNote', note.id);
          } else {
            next.delete('editNote');
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Group course lessons by courseId
  const courseStacks = useMemo(() => {
    const lessons = vaultItems.filter(
      (item): item is CourseLesson => item.type === 'course_lesson' && item.status === 'active'
    );

    const stacksMap = new Map<string, CourseStack>();

    lessons.forEach((lesson) => {
      const course = courses.find((c) => c.id === lesson.courseId);
      if (!course) return; // Skip lessons without a course

      if (!stacksMap.has(lesson.courseId)) {
        stacksMap.set(lesson.courseId, {
          course,
          lessons: [],
        });
      }

      stacksMap.get(lesson.courseId)!.lessons.push(lesson);
    });

    // Sort lessons within each stack by lessonIndex
    stacksMap.forEach((stack) => {
      stack.lessons.sort((a, b) => a.lessonIndex - b.lessonIndex);
    });

    return Array.from(stacksMap.values());
  }, [vaultItems, courses]);

  // Get course IDs that have lessons (to filter out individual lesson cards)
  const courseIdsWithLessons = useMemo(() => {
    return new Set(courseStacks.map((stack) => stack.course.id));
  }, [courseStacks]);

  const filteredItems = useMemo(() => {
    let filtered = vaultItems;

    // Filter out course lessons that belong to a course stack
    filtered = filtered.filter((item) => {
      if (item.type === 'course_lesson') {
        return !courseIdsWithLessons.has((item as CourseLesson).courseId);
      }
      if (item.type === 'flashcard') {
        return !(item as Flashcard).deckId;
      }
      return true;
    });

    if (filterType !== 'all') {
      // For course_lesson filter, show course stacks instead
      if (filterType === 'course_lesson') {
        return []; // We'll handle course stacks separately
      }
      if (filterType === 'flashcard') {
        return []; // Decks rendered from flashcardDecks
      }
      filtered = filtered.filter((item) => item.type === filterType);
    }

    if (selectedArea !== 'all') {
      filtered = filtered.filter((item) => item.area === selectedArea);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => item.searchableText.includes(query));
    }

    return filtered.filter((item) => item.status === 'active');
  }, [vaultItems, filterType, selectedArea, searchQuery, courseIdsWithLessons]);

  const visibleVaultItems = useMemo(
    () => filteredItems.filter((item) => !hiddenArchiveIds.includes(item.id)),
    [filteredItems, hiddenArchiveIds]
  );

  const vaultCardExit = getLibraryVaultItemExit(shouldReduceMotion);

  // Filter course stacks based on search and area
  const filteredFlashcardDecks = useMemo(() => {
    let d = flashcardDecks.filter((deck) => deck.status !== 'archived');

    if (selectedArea !== 'all') {
      d = d.filter((deck) => {
        const firstLine = deck.description?.split('\n')[0]?.trim() || '';
        return firstLine === `Area: ${selectedArea}`;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      d = d.filter(
        (deck) =>
          deck.name.toLowerCase().includes(q) ||
          (deck.description || '').toLowerCase().includes(q) ||
          (deck.topic || '').toLowerCase().includes(q)
      );
    }

    return d;
  }, [flashcardDecks, selectedArea, searchQuery]);

  const filteredCourseStacks = useMemo(() => {
    let filtered = courseStacks;

    if (selectedArea !== 'all') {
      filtered = filtered.filter((stack) =>
        stack.lessons.some((lesson) => lesson.area === selectedArea)
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((stack) => {
        const courseMatches =
          stack.course.title.toLowerCase().includes(query) ||
          stack.course.description?.toLowerCase().includes(query) ||
          stack.course.topic.toLowerCase().includes(query);
        const lessonMatches = stack.lessons.some((lesson) =>
          lesson.searchableText.toLowerCase().includes(query)
        );
        return courseMatches || lessonMatches;
      });
    }

    return filtered;
  }, [courseStacks, selectedArea, searchQuery]);

  const visibleCourseStacks = useMemo(
    () => filteredCourseStacks.filter((stack) => !hiddenArchiveIds.includes(stack.course.id)),
    [filteredCourseStacks, hiddenArchiveIds]
  );

  const visibleFlashcardDecks = useMemo(
    () => filteredFlashcardDecks.filter((deck) => !hiddenArchiveIds.includes(deck.id)),
    [filteredFlashcardDecks, hiddenArchiveIds]
  );

  const isLibraryFilterEmpty = useMemo(
    () =>
      filteredItems.length === 0 &&
      visibleCourseStacks.length === 0 &&
      !((filterType === 'all' || filterType === 'flashcard') && visibleFlashcardDecks.length > 0),
    [filteredItems.length, visibleCourseStacks.length, filterType, visibleFlashcardDecks.length]
  );

  const visibleLibraryEntries = useMemo(() => {
    const entries: LibrarySelectableRef[] = [];
    if (filterType === 'all' || filterType === 'course_lesson') {
      for (const stack of visibleCourseStacks) {
        entries.push({ kind: 'course', id: stack.course.id });
      }
    }
    if (filterType === 'all' || filterType === 'flashcard') {
      for (const deck of visibleFlashcardDecks) {
        entries.push({ kind: 'flashcard_deck', id: deck.id });
      }
    }
    for (const item of visibleVaultItems) {
      if (item.type === 'flashcard') continue;
      entries.push({ kind: item.type as LibrarySelectableRef['kind'], id: item.id });
    }
    return entries;
  }, [filterType, visibleCourseStacks, visibleFlashcardDecks, visibleVaultItems]);

  const selectionActive = selectedRefs.length > 0;

  const bulkMutations = useMemo<LibraryBulkMutations>(
    () => ({
      updateNote: (id, input) => updateNote(id, input),
      updateDocument: (id, input) => updateDocument(id, input),
      updateFlashcardDeck: (id, input) => updateFlashcardDeck(id, input),
      updateCourse: (id, input) => updateCourse(id, input),
      updatePracticeSet: async (id, input) => {
        const res = await practiceArtifactsService.updatePracticeSet(id, input);
        if (!res.success) throw new Error(res.error?.message || 'Failed to update practice set');
      },
      updateQuiz: async (id, input) => {
        const res = await practiceArtifactsService.updateQuiz(id, input);
        if (!res.success) throw new Error(res.error?.message || 'Failed to update quiz');
      },
      updateHomework: async (id, input) => {
        const res = await practiceArtifactsService.updateHomework(id, input);
        if (!res.success) throw new Error(res.error?.message || 'Failed to update homework');
      },
      deleteVaultItem: (id) => deleteItem(id),
    }),
    [updateNote, updateDocument, updateFlashcardDeck, updateCourse, deleteItem]
  );

  const handleToggleSelect = useCallback(
    (ref: LibrarySelectableRef, event?: React.MouseEvent) => {
      const result = toggleLibrarySelection(selectedRefs, ref, visibleLibraryEntries, {
        shiftKey: event?.shiftKey,
        anchorIndex: selectionAnchorIndex,
      });
      setSelectedRefs(result.selected);
      setSelectionAnchorIndex(result.anchorIndex);
    },
    [selectedRefs, visibleLibraryEntries, selectionAnchorIndex]
  );

  const handleClearSelection = useCallback(() => {
    setSelectedRefs(clearLibrarySelection());
    setSelectionAnchorIndex(null);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || selectedRefs.length === 0 || shortcutsOpen) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('[role="dialog"]')) return;
      handleClearSelection();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedRefs.length, handleClearSelection, shortcutsOpen]);

  const applyOptimisticHide = useCallback((refs: LibrarySelectableRef[]) => {
    const ids = refs.map((ref) => ref.id);
    setHiddenArchiveIds((prev) => [...prev, ...ids.filter((id) => !prev.includes(id))]);
  }, []);

  const handleBulkAddTags = async () => {
    if (!bulkTagsDraft.length || bulkActionLoading) return;
    setBulkActionLoading(true);
    try {
      const outcome = await bulkAddTags(
        selectedRefs,
        bulkTagsDraft,
        { vaultItems, flashcardDecks },
        bulkMutations
      );
      showToast({
        title: 'Tags added',
        message: summarizeBulkOutcome(outcome),
        type: outcome.failed.length ? 'warning' : 'success',
      });
      if (outcome.failed.length) {
        setSelectedRefs(outcome.failed.map((f) => f.ref));
      } else {
        handleClearSelection();
      }
      setAddTagsDialogOpen(false);
      setBulkTagsDraft([]);
      await refreshVaultItems();
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : 'Failed to add tags',
        title: 'Bulk tags failed',
        type: 'error',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkChangeArea = async () => {
    if (bulkActionLoading) return;
    setBulkActionLoading(true);
    try {
      const outcome = await bulkChangeArea(
        selectedRefs,
        bulkAreaDraft,
        { vaultItems, flashcardDecks },
        bulkMutations
      );
      showToast({
        title: 'Area updated',
        message: summarizeBulkOutcome(outcome),
        type: outcome.failed.length ? 'warning' : 'success',
      });
      if (outcome.failed.length) {
        setSelectedRefs(outcome.failed.map((f) => f.ref));
      } else {
        handleClearSelection();
      }
      setChangeAreaDialogOpen(false);
      await refreshVaultItems();
    } catch (err) {
      showToast({
        title: 'Bulk area failed',
        message: err instanceof Error ? err.message : 'Failed to change area',
        type: 'error',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkSoftArchive = async () => {
    if (!bulkConfirmMode || bulkActionLoading) return;
    const refs = [...selectedRefs];
    setBulkActionLoading(true);
    setBulkConfirmMode(null);
    applyOptimisticHide(refs);
    handleClearSelection();
    try {
      const outcome = await bulkSoftArchive(refs, bulkMutations);
      showToast({
        title: 'Items archived',
        message: summarizeBulkOutcome(outcome),
        type: outcome.failed.length ? 'warning' : 'success',
      });
      if (outcome.failed.length) {
        const failedIds = new Set(outcome.failed.map((f) => f.ref.id));
        setHiddenArchiveIds((prev) => prev.filter((id) => !failedIds.has(id)));
        setSelectedRefs(outcome.failed.map((f) => f.ref));
      }
      await refreshVaultItems();
      setHiddenArchiveIds((prev) =>
        prev.filter((id) => !outcome.succeeded.some((s) => s.id === id))
      );
    } catch (err) {
      setHiddenArchiveIds((prev) => prev.filter((id) => !refs.some((r) => r.id === id)));
      showToast({
        title: 'Bulk archive failed',
        message: err instanceof Error ? err.message : 'Bulk archive failed',
        type: 'error',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const typeCounts = useMemo(() => {
    const counts: Record<VaultItemType, number> = {
      note: 0,
      document: 0,
      course_lesson: 0,
      flashcard: 0,
      practice_question_set: 0,
      quiz: 0,
      homework_assignment: 0,
    };

    vaultItems.forEach((item) => {
      if (item.status === 'active') {
        // Only count course lessons that aren't part of a course stack
        if (item.type === 'course_lesson') {
          if (!courseIdsWithLessons.has((item as CourseLesson).courseId)) {
            counts[item.type]++;
          }
        } else if (item.type !== 'flashcard') {
          counts[item.type]++;
        }
      }
    });

    // Add course stacks count to course_lesson count
    counts.course_lesson += courseStacks.length;
    counts.flashcard = flashcardDecks.length;

    return counts;
  }, [vaultItems, courseIdsWithLessons, courseStacks, flashcardDecks.length]);

  useEffect(() => {
    if (highlightId && !loading) {
      const t = window.setTimeout(() => {
        const el = document.getElementById(`vault-item-${highlightId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return () => window.clearTimeout(t);
    }
  }, [highlightId, loading, filterType, selectedArea, searchQuery]);

  const handleCreateClick = (type: VaultItemType) => {
    setShowCreateMenu(false);
    setCreateInitialSourceIds(null);
    setCreateDialogType(type);
  };

  const handleGenerateArtifactFromNote = useCallback(
    (kind: PracticeArtifactCreateKind) => {
      if (!editingNote) return;
      setCreateInitialSourceIds([editingNote.id]);
      setCreateDialogType(kind);
    },
    [editingNote]
  );

  const handleCloseCreateDialog = useCallback(() => {
    setCreateDialogType(null);
    setCreateInitialSourceIds(null);
  }, []);

  const handleCloseArchiveDialog = useCallback(() => {
    if (!archiving) {
      setItemToArchive(null);
      setArchiveError(null);
    }
  }, [archiving]);

  const handleConfirmArchive = async () => {
    if (!itemToArchive || archiving) return;
    const item = itemToArchive;
    setArchiving(true);
    setArchiveError(null);
    setItemToArchive(null);
    setHiddenArchiveIds((prev) => [...prev, item.id]);

    try {
      await deleteItem(item.id);
      if (editingNote?.id === item.id) {
        setEditingNote(null);
      }
      await refreshVaultItems();
      setHiddenArchiveIds((prev) => prev.filter((id) => id !== item.id));
    } catch (err) {
      setHiddenArchiveIds((prev) => prev.filter((id) => id !== item.id));
      setItemToArchive(item);
      setArchiveError(err instanceof Error ? err.message : 'Failed to archive item');
    } finally {
      setArchiving(false);
    }
  };

  const tabs: Array<{ id: FilterType; label: string; icon: typeof FileText; count?: number }> = [
    { id: 'all', label: 'All Items', icon: Grid3x3 },
    { id: 'note', label: 'Notes', icon: FileText, count: typeCounts.note },
    { id: 'document', label: 'Documents', icon: FileCheck, count: typeCounts.document },
    { id: 'course_lesson', label: 'Lessons', icon: BookOpen, count: typeCounts.course_lesson },
    { id: 'flashcard', label: 'Flashcards', icon: CreditCard, count: typeCounts.flashcard },
    {
      id: 'practice_question_set',
      label: 'Practice',
      icon: HelpCircle,
      count: typeCounts.practice_question_set,
    },
    { id: 'quiz', label: 'Quizzes', icon: ClipboardList, count: typeCounts.quiz },
    {
      id: 'homework_assignment',
      label: 'Homework',
      icon: BookMarked,
      count: typeCounts.homework_assignment,
    },
  ];

  return (
    <PageContainer className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Knowledge Vault</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Your personal repository of knowledge and learning
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
          >
            <Plus size={20} />
            <span>Add Item</span>
            <ChevronDown size={16} />
          </button>

          {showCreateMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowCreateMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <button
                  onClick={() => handleCreateClick('note')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-left"
                >
                  <FileText size={18} className="text-blue-600" />
                  <span className="text-gray-900 dark:text-white">Note</span>
                </button>
                <button
                  onClick={() => handleCreateClick('document')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-left"
                >
                  <FileCheck size={18} className="text-purple-600" />
                  <span className="text-gray-900 dark:text-white">Document</span>
                </button>
                <button
                  onClick={() => handleCreateClick('flashcard')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-left"
                >
                  <CreditCard size={18} className="text-amber-600" />
                  <span className="text-gray-900 dark:text-white">Flashcard deck</span>
                </button>
                <button
                  onClick={() => handleCreateClick('practice_question_set')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-left"
                >
                  <HelpCircle size={18} className="text-sky-600" />
                  <span className="text-gray-900 dark:text-white">Practice questions</span>
                </button>
                <button
                  onClick={() => handleCreateClick('quiz')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-left"
                >
                  <ClipboardList size={18} className="text-amber-600" />
                  <span className="text-gray-900 dark:text-white">Quiz</span>
                </button>
                <button
                  onClick={() => handleCreateClick('homework_assignment')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-left"
                >
                  <BookMarked size={18} className="text-violet-600" />
                  <span className="text-gray-900 dark:text-white">Homework</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[300px] relative">
          <Search
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search knowledge..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 focus:border-transparent"
          />
        </div>

        <Select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value as Area | 'all')}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600"
        >
          <option value="all">All Areas</option>
          {AREAS.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </Select>

        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded transition ${
              viewMode === 'grid'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Grid3x3 size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded transition ${
              viewMode === 'list'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <LibraryFilterGridShell filterKey={filterType} shouldReduceMotion={shouldReduceMotion}>
          {isLibraryFilterEmpty ? (
            <div className="text-center py-12">
              <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No items found' : 'Your vault is empty'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'Start building your knowledge base by adding your first item'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateMenu(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                >
                  <Plus size={20} />
                  <span>Add Your First Item</span>
                </button>
              )}
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-3'
              }
            >
              {/* Show course stacks when filter is 'all' or 'course_lesson' */}
              {(filterType === 'all' || filterType === 'course_lesson') &&
                visibleCourseStacks.map((stack) => (
                  <CourseStackCard
                    key={stack.course.id}
                    course={stack.course}
                    lessons={stack.lessons}
                    isSelected={isRefSelected(selectedRefs, {
                      kind: 'course',
                      id: stack.course.id,
                    })}
                    selectionActive={selectionActive}
                    onToggleSelect={handleToggleSelect}
                    onClick={() => {
                      navigate(`/admin/knowledge-vault/courses/${stack.course.id}`);
                    }}
                  />
                ))}

              {(filterType === 'all' || filterType === 'flashcard') &&
                visibleFlashcardDecks.map((deck) => (
                  <FlashcardDeckCard
                    key={deck.id}
                    deck={deck}
                    isSelected={isRefSelected(selectedRefs, {
                      kind: 'flashcard_deck',
                      id: deck.id,
                    })}
                    selectionActive={selectionActive}
                    onToggleSelect={handleToggleSelect}
                    onClick={() => {
                      navigate(buildFlashcardsHubDeckUrl(deck.id));
                    }}
                    onStartReview={() => {
                      navigate(buildStudySessionDeckUrl(deck.id));
                    }}
                  />
                ))}

              {/* Show regular vault items */}
              <AnimatePresence mode="popLayout" initial={false}>
                {visibleVaultItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout={!shouldReduceMotion}
                    initial={false}
                    exit={vaultCardExit}
                    className={viewMode === 'grid' ? 'h-full' : undefined}
                  >
                    <VaultItemCard
                      item={item}
                      highlighted={item.id === highlightId}
                      selected={editingNote?.id === item.id}
                      isSelected={isRefSelected(selectedRefs, {
                        kind: item.type as LibrarySelectableRef['kind'],
                        id: item.id,
                      })}
                      selectionActive={selectionActive}
                      onToggleSelect={handleToggleSelect}
                      onClick={() => {
                        if (item.type === 'note') {
                          setEditingNote(item as Note);
                        } else if (item.type === 'document') {
                          navigate(
                            `/admin/knowledge-vault/documents/${encodeURIComponent(item.id)}`
                          );
                        } else if (
                          item.type === 'practice_question_set' ||
                          item.type === 'quiz' ||
                          item.type === 'homework_assignment'
                        ) {
                          const linked = item as
                            | PracticeQuestionSetItem
                            | QuizVaultItem
                            | HomeworkVaultItem;
                          if (linked.courseId) {
                            navigate(
                              `${ROUTES.admin.knowledgeVaultCourses}/${encodeURIComponent(linked.courseId)}`
                            );
                          }
                        }
                      }}
                      onDelete={
                        item.type === 'note' || item.type === 'document'
                          ? () => setItemToArchive(item)
                          : undefined
                      }
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </LibraryFilterGridShell>
      )}

      {/* Create Dialog */}
      <Dialog
        isOpen={createDialogType !== null}
        onClose={handleCloseCreateDialog}
        title={`Create ${
          createDialogType === 'note'
            ? 'Note'
            : createDialogType === 'document'
              ? 'Document'
              : createDialogType === 'flashcard'
                ? 'Flashcard deck'
                : createDialogType === 'practice_question_set'
                  ? 'Practice questions'
                  : createDialogType === 'quiz'
                    ? 'Quiz'
                    : createDialogType === 'homework_assignment'
                      ? 'Homework'
                      : 'Item'
        }`}
        size={createDialogType === 'note' || createDialogType === 'flashcard' ? 'full' : 'md'}
      >
        <div className="p-6">
          {createDialogType === 'note' && (
            <NoteForm
              onSuccess={() => {
                handleCloseCreateDialog();
                refreshVaultItems();
              }}
              onCancel={handleCloseCreateDialog}
            />
          )}
          {createDialogType === 'document' && (
            <DocumentForm
              onSuccess={() => {
                handleCloseCreateDialog();
                refreshVaultItems();
              }}
              onCancel={handleCloseCreateDialog}
            />
          )}
          {createDialogType === 'flashcard' && (
            <FlashcardDeckCreateDialog
              onSuccess={() => {
                handleCloseCreateDialog();
                refreshVaultItems();
              }}
              onCancel={handleCloseCreateDialog}
            />
          )}
          {(createDialogType === 'practice_question_set' ||
            createDialogType === 'quiz' ||
            createDialogType === 'homework_assignment') && (
            <PracticeArtifactCreateDialog
              kind={createDialogType}
              initialSourceIds={createInitialSourceIds ?? undefined}
              onSuccess={() => {
                handleCloseCreateDialog();
                refreshVaultItems();
              }}
              onCancel={handleCloseCreateDialog}
            />
          )}
        </div>
      </Dialog>

      <ArchiveVaultItemDialog
        isOpen={itemToArchive !== null}
        item={itemToArchive}
        isLoading={archiving}
        error={archiveError}
        onClose={handleCloseArchiveDialog}
        onConfirm={handleConfirmArchive}
      />

      <ConfirmDialog
        isOpen={bulkConfirmMode === 'archive'}
        onClose={() => setBulkConfirmMode(null)}
        onConfirm={handleBulkSoftArchive}
        title={`Archive ${selectedRefs.length} item${selectedRefs.length === 1 ? '' : 's'}?`}
        confirmLabel="Archive"
        isLoading={bulkActionLoading}
        variant="default"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Selected items will be hidden from your active Library. You can restore them later from
          archived views when available.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={bulkConfirmMode === 'delete'}
        onClose={() => setBulkConfirmMode(null)}
        onConfirm={handleBulkSoftArchive}
        title={`Remove ${selectedRefs.length} item${selectedRefs.length === 1 ? '' : 's'} from Library?`}
        confirmLabel="Delete"
        isLoading={bulkActionLoading}
        variant="danger"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This will soft-delete the selected items and hide them from active Library views. This
          action cannot be undone from this screen without restoring archived content.
        </p>
      </ConfirmDialog>

      <Dialog
        isOpen={addTagsDialogOpen}
        onClose={() => !bulkActionLoading && setAddTagsDialogOpen(false)}
        title="Add tags"
        size="sm"
      >
        <div className="space-y-4 p-6">
          <TagInput
            value={bulkTagsDraft}
            onChange={setBulkTagsDraft}
            placeholder="Add tags to apply"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={() => setAddTagsDialogOpen(false)}
              disabled={bulkActionLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
              onClick={handleBulkAddTags}
              disabled={bulkActionLoading || bulkTagsDraft.length === 0}
            >
              Apply tags
            </button>
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={changeAreaDialogOpen}
        onClose={() => !bulkActionLoading && setChangeAreaDialogOpen(false)}
        title="Change area"
        size="sm"
      >
        <div className="space-y-4 p-6">
          <Select
            value={bulkAreaDraft}
            onChange={(e) => setBulkAreaDraft(e.target.value as Area)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
          >
            {AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={() => setChangeAreaDialogOpen(false)}
              disabled={bulkActionLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
              onClick={handleBulkChangeArea}
              disabled={bulkActionLoading}
            >
              Apply area
            </button>
          </div>
        </div>
      </Dialog>

      <LibraryBulkActionsBar
        selectedCount={selectedRefs.length}
        onAddTags={() => setAddTagsDialogOpen(true)}
        onChangeArea={() => setChangeAreaDialogOpen(true)}
        onArchive={() => setBulkConfirmMode('archive')}
        onDelete={() => setBulkConfirmMode('delete')}
        onClearSelection={handleClearSelection}
      />

      <KeyboardShortcutsOverlay
        isOpen={shortcutsOpen}
        layer={shortcutsLayer}
        onClose={() => setShortcutsOpen(false)}
        sections={shortcutSections}
      />

      {/* Edit Note Dialog */}
      <Dialog
        isOpen={editingNote !== null}
        onClose={() => noteFormRef.current?.requestClose()}
        title="Edit Note"
        size="full"
      >
        <div className="p-6">
          {editingNote && (
            <NoteForm
              ref={noteFormRef}
              note={editingNote}
              onGenerateArtifact={handleGenerateArtifactFromNote}
              onSuccess={() => {
                setEditingNote(null);
                refreshVaultItems();
              }}
              onCancel={() => setEditingNote(null)}
            />
          )}
        </div>
      </Dialog>
    </PageContainer>
  );
}
