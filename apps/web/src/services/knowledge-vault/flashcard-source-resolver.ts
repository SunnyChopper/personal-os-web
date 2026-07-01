import type { Course, CourseLesson, VaultItem } from '@/types/knowledge-vault';
import { documentService } from './document.service';

export interface ResolvedFlashcardSource {
  id: string;
  title: string;
  type: string;
  content: string;
}

const MAX_TOTAL_CHARS = 12000;

async function resolveDocumentContent(item: VaultItem): Promise<string> {
  const inline = (item.content || '').trim();
  if (inline.length >= 80) {
    return inline;
  }
  try {
    const detail = await documentService.getDetail(item.id);
    const fromDetail = (detail.document.content || '').trim();
    if (fromDetail.length >= 80) {
      return fromDetail;
    }
    const chunks = await documentService.getChunks(item.id);
    return chunks.chunks
      .map((c) => c.content)
      .join('\n\n')
      .trim();
  } catch {
    return inline;
  }
}

function lessonContent(item: CourseLesson): string {
  return (item.content || '').trim();
}

export async function resolveFlashcardSources(
  sourceIds: string[],
  vaultItems: VaultItem[],
  courses: Course[]
): Promise<{ title: string; content: string; sources: ResolvedFlashcardSource[] }> {
  const resolved: ResolvedFlashcardSource[] = [];
  const courseIds = new Set(courses.map((c) => c.id));

  for (const sourceId of sourceIds) {
    if (courseIds.has(sourceId)) {
      const course = courses.find((c) => c.id === sourceId);
      const lessons = vaultItems.filter((v): v is CourseLesson => {
        return v.type === 'course_lesson' && (v as CourseLesson).courseId === sourceId;
      });
      for (const lesson of lessons) {
        const content = lessonContent(lesson);
        if (!content) continue;
        resolved.push({
          id: lesson.id,
          title: `${course?.title ?? 'Course'} — ${lesson.title}`,
          type: 'course_lesson',
          content,
        });
      }
      continue;
    }

    const item = vaultItems.find((v) => v.id === sourceId);
    if (!item) continue;

    if (item.type === 'note') {
      const content = (item.content || '').trim();
      if (content) {
        resolved.push({ id: item.id, title: item.title, type: item.type, content });
      }
    } else if (item.type === 'document') {
      const content = await resolveDocumentContent(item);
      if (content) {
        resolved.push({ id: item.id, title: item.title, type: item.type, content });
      }
    } else if (item.type === 'course_lesson') {
      const content = lessonContent(item as CourseLesson);
      if (content) {
        resolved.push({ id: item.id, title: item.title, type: item.type, content });
      }
    }
  }

  let total = 0;
  const parts: string[] = [];
  for (const src of resolved) {
    const block = `### ${src.title}\n${src.content}`;
    if (total + block.length > MAX_TOTAL_CHARS) {
      const remaining = MAX_TOTAL_CHARS - total;
      if (remaining > 200) {
        parts.push(block.slice(0, remaining));
      }
      break;
    }
    parts.push(block);
    total += block.length;
  }

  const title =
    resolved.length === 1
      ? resolved[0].title.slice(0, 200)
      : resolved.length > 1
        ? `Flashcards from ${resolved.length} sources`
        : 'Flashcards';

  return {
    title,
    content: parts.join('\n\n'),
    sources: resolved,
  };
}
