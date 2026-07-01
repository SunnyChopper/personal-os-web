import type { ChatThread } from '@/types/chatbot';

/** ISO timestamp used for sidebar ordering and relative labels (message activity only). */
export function threadRecencyTimestamp(
  thread: Pick<ChatThread, 'lastMessageAt' | 'createdAt'>
): string {
  return thread.lastMessageAt || thread.createdAt;
}

export function threadRecencyMs(thread: Pick<ChatThread, 'lastMessageAt' | 'createdAt'>): number {
  return new Date(threadRecencyTimestamp(thread)).getTime();
}
