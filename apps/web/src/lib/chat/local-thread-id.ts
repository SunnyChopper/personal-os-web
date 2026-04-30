/** Client-only assistant thread ids; never sent to the API as existing threads. */
export const LOCAL_ASSISTANT_THREAD_PREFIX = 'local-';

export function isLocalAssistantThreadId(threadId: string | undefined | null): boolean {
  return Boolean(threadId?.startsWith(LOCAL_ASSISTANT_THREAD_PREFIX));
}

export function createLocalAssistantThreadId(): string {
  return `${LOCAL_ASSISTANT_THREAD_PREFIX}${crypto.randomUUID()}`;
}
