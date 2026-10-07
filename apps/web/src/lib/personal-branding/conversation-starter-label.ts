export const CONVERSATION_STARTER_LABEL = 'Conversation starter';

export function isConversationStarterLabel(label: string | null | undefined): boolean {
  return (label ?? '').trim().toLowerCase() === CONVERSATION_STARTER_LABEL.toLowerCase();
}
