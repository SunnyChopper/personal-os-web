import {
  FileText,
  BookOpen,
  CreditCard,
  FileCheck,
  Tag,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import type { VaultItem, Note, Document, CourseLesson, Flashcard } from '@/types/knowledge-vault';

interface VaultItemCardProps {
  item: VaultItem;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  highlighted?: boolean;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function NoteCardContent({ note }: { note: Note }) {
  return (
    <>
      <div className="flex items-start gap-3 mb-2">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <FileText size={20} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{note.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Note</p>
        </div>
      </div>

      {note.content && (
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
          {note.content.substring(0, 150)}...
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap mb-2">
        {note.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300"
          >
            <Tag size={12} />
            {tag}
          </span>
        ))}
        {note.tags.length > 3 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            +{note.tags.length - 3} more
          </span>
        )}
      </div>

      {note.linkedItems.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Linked to {note.linkedItems.length} item{note.linkedItems.length !== 1 ? 's' : ''}
        </p>
      )}
    </>
  );
}

function DocumentCardContent({ document }: { document: Document }) {
  return (
    <>
      <div className="flex items-start gap-3 mb-2">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <FileCheck size={20} className="text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{document.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Document</p>
        </div>
      </div>

      {document.content && (
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
          {document.content.substring(0, 150)}...
        </p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2 flex-wrap">
        {document.fileType && <span className="uppercase font-medium">{document.fileType}</span>}
        {document.pageCount && <span>{document.pageCount} pages</span>}
        {document.indexingStatus === 'pending' && (
          <span className="text-amber-600 dark:text-amber-400 font-medium">Indexing…</span>
        )}
        {document.indexingStatus === 'failed' && (
          <span className="text-red-600 dark:text-red-400 font-medium">Index failed</span>
        )}
        {document.indexingStatus === 'complete' &&
          document.chunkCount != null &&
          document.chunkCount > 0 && (
            <span className="text-emerald-600 dark:text-emerald-400">
              {document.chunkCount} chunks
            </span>
          )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {document.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300"
          >
            <Tag size={12} />
            {tag}
          </span>
        ))}
      </div>
    </>
  );
}

function LessonCardContent({ lesson }: { lesson: CourseLesson }) {
  return (
    <>
      <div className="flex items-start gap-3 mb-2">
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <BookOpen size={20} className="text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{lesson.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Course Lesson</p>
        </div>
        {lesson.completedAt && (
          <CheckCircle2 size={20} className="text-green-600 dark:text-green-400 flex-shrink-0" />
        )}
      </div>

      {lesson.content && (
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
          {lesson.content.substring(0, 150)}...
        </p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
        <span>Lesson {lesson.lessonIndex + 1}</span>
        {lesson.estimatedMinutes && <span>{lesson.estimatedMinutes} minutes</span>}
        {lesson.aiGenerated && (
          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
            AI Generated
          </span>
        )}
      </div>

      {lesson.completedAt && (
        <p className="text-xs text-green-600 dark:text-green-400">
          Completed {formatDate(lesson.completedAt)}
        </p>
      )}
    </>
  );
}

function FlashcardCardContent({ flashcard }: { flashcard: Flashcard }) {
  const isOverdue = new Date(flashcard.nextReviewDate) < new Date();

  return (
    <>
      <div className="flex items-start gap-3 mb-2">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
          <CreditCard size={20} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {flashcard.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Flashcard</p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Front</p>
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{flashcard.front}</p>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
        <span>{flashcard.repetitions} reviews</span>
        <span>Ease: {flashcard.easeFactor.toFixed(1)}</span>
        <span>Interval: {flashcard.interval}d</span>
      </div>

      <div className="flex items-center gap-2">
        <Calendar size={14} className={isOverdue ? 'text-red-500' : 'text-gray-400'} />
        <p
          className={`text-xs ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}
        >
          {isOverdue ? 'Review overdue' : `Review ${formatDate(flashcard.nextReviewDate)}`}
        </p>
      </div>
    </>
  );
}

export default function VaultItemCard({ item, onClick, highlighted }: VaultItemCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      id={`vault-item-${item.id}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={
        onClick
          ? `View ${item.type}: ${item.type === 'note' ? (item as Note).title : item.type === 'document' ? (item as Document).title : 'item'}`
          : undefined
      }
      className={`rounded-lg p-4 transition-all cursor-pointer ${
        highlighted
          ? 'bg-white dark:bg-gray-800 border-2 border-violet-500 ring-2 ring-violet-500/20 shadow-lg dark:shadow-violet-900/20'
          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg'
      }`}
    >
      {item.type === 'note' && <NoteCardContent note={item as Note} />}
      {item.type === 'document' && <DocumentCardContent document={item as Document} />}
      {item.type === 'course_lesson' && <LessonCardContent lesson={item as CourseLesson} />}
      {item.type === 'flashcard' && <FlashcardCardContent flashcard={item as Flashcard} />}

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Updated {formatDate(item.updatedAt)}</span>
        {item.lastAccessedAt && <span>Accessed {formatDate(item.lastAccessedAt)}</span>}
      </div>
    </div>
  );
}
