import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import NoteForm from '@/components/organisms/NoteForm';
import DocumentForm from '@/components/organisms/DocumentForm';
import FlashcardDeckCreateDialog from '@/components/organisms/FlashcardDeckCreateDialog';
import { PracticeArtifactCreateDialog } from '@/components/organisms/PracticeArtifactCreateDialog';
import type {
  VaultItemType,
  VaultItem,
  Note,
  CourseLesson,
  Course,
  HomeworkVaultItem,
  PracticeQuestionSetItem,
  QuizVaultItem,
} from '@/types/knowledge-vault';
import type { Area } from '@/types/growth-system';
import { Select } from '@/components/atoms/Select';

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
  const { vaultItems, courses, flashcardDecks, loading, refreshVaultItems, deleteItem } =
    useKnowledgeVault();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedArea, setSelectedArea] = useState<Area | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [createDialogType, setCreateDialogType] = useState<VaultItemType | null>(null);
  const [itemToArchive, setItemToArchive] = useState<VaultItem | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const editingNote = useMemo(() => {
    if (!editNoteId) return null;
    const item = vaultItems.find((v) => v.id === editNoteId && v.type === 'note');
    return (item as Note | undefined) ?? null;
  }, [editNoteId, vaultItems]);

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

  // Filter course stacks based on search and area
  const filteredFlashcardDecks = useMemo(() => {
    let d = flashcardDecks;

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
    setCreateDialogType(type);
  };

  const handleConfirmArchive = async () => {
    if (!itemToArchive) return;
    setArchiving(true);
    setArchiveError(null);
    try {
      await deleteItem(itemToArchive.id);
      if (editingNote?.id === itemToArchive.id) {
        setEditingNote(null);
      }
      setItemToArchive(null);
      await refreshVaultItems();
    } catch (err) {
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
      ) : filteredItems.length === 0 &&
        filteredCourseStacks.length === 0 &&
        !(filterType === 'flashcard' && filteredFlashcardDecks.length > 0) ? (
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
            filteredCourseStacks.map((stack) => (
              <CourseStackCard
                key={stack.course.id}
                course={stack.course}
                lessons={stack.lessons}
                onClick={() => {
                  navigate(`/admin/knowledge-vault/courses/${stack.course.id}`);
                }}
              />
            ))}

          {filterType === 'flashcard' &&
            filteredFlashcardDecks.map((deck) => (
              <FlashcardDeckCard
                key={deck.id}
                deck={deck}
                onClick={() => {
                  navigate(
                    `${ROUTES.admin.knowledgeVaultFlashcards}?deck=${encodeURIComponent(deck.id)}`
                  );
                }}
              />
            ))}

          {/* Show regular vault items */}
          {filteredItems.map((item) => (
            <VaultItemCard
              key={item.id}
              item={item}
              highlighted={item.id === highlightId}
              onClick={() => {
                if (item.type === 'note') {
                  setEditingNote(item as Note);
                } else if (item.type === 'document') {
                  navigate(`/admin/knowledge-vault/documents/${encodeURIComponent(item.id)}`);
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
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog
        isOpen={createDialogType !== null}
        onClose={() => setCreateDialogType(null)}
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
                setCreateDialogType(null);
                refreshVaultItems();
              }}
              onCancel={() => setCreateDialogType(null)}
            />
          )}
          {createDialogType === 'document' && (
            <DocumentForm
              onSuccess={() => {
                setCreateDialogType(null);
                refreshVaultItems();
              }}
              onCancel={() => setCreateDialogType(null)}
            />
          )}
          {createDialogType === 'flashcard' && (
            <FlashcardDeckCreateDialog
              onSuccess={() => {
                setCreateDialogType(null);
                refreshVaultItems();
              }}
              onCancel={() => setCreateDialogType(null)}
            />
          )}
          {(createDialogType === 'practice_question_set' ||
            createDialogType === 'quiz' ||
            createDialogType === 'homework_assignment') && (
            <PracticeArtifactCreateDialog
              kind={createDialogType}
              onSuccess={() => {
                setCreateDialogType(null);
                refreshVaultItems();
              }}
              onCancel={() => setCreateDialogType(null)}
            />
          )}
        </div>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <Dialog
        isOpen={itemToArchive !== null}
        onClose={() => {
          if (!archiving) {
            setItemToArchive(null);
            setArchiveError(null);
          }
        }}
        title="Archive item?"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to archive{' '}
            <span className="font-medium text-gray-900 dark:text-white">
              {itemToArchive?.title}
            </span>
            ? It will be hidden from your vault but can be restored later.
          </p>
          {archiveError && <p className="text-sm text-red-600 dark:text-red-400">{archiveError}</p>}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => {
                setItemToArchive(null);
                setArchiveError(null);
              }}
              disabled={archiving}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmArchive}
              disabled={archiving}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              {archiving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Archiving...</span>
                </>
              ) : (
                <span>Archive</span>
              )}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog
        isOpen={editingNote !== null}
        onClose={() => setEditingNote(null)}
        title="Edit Note"
        size="full"
      >
        <div className="p-6">
          {editingNote && (
            <NoteForm
              note={editingNote}
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
