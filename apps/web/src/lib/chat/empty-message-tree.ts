import type { MessageTreeResponse } from '@/types/chatbot';

export const EMPTY_MESSAGE_TREE: MessageTreeResponse = {
  rootKey: 'ROOT',
  nodes: [],
  childrenByParentId: {},
  leafIds: [],
};
