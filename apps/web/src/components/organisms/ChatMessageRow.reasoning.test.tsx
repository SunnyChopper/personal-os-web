import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChatMessageRow } from '@/components/organisms/ChatMessageRow';
import type { ChatMessage } from '@/types/chatbot';

type TracePanelProps = {
  assistantThinkingStreaming?: boolean;
  reasoningStreamDisabledReason?: string;
};

const panelProps: { current?: TracePanelProps } = {};

vi.mock('@/components/molecules/AssistantExecutionTracePanel', () => ({
  AssistantExecutionTracePanel: (props: TracePanelProps) => {
    panelProps.current = props;
    return <div data-testid="execution-trace-panel" />;
  },
}));

const assistantMessage: ChatMessage = {
  id: 'assistant-1',
  threadId: 'thread-1',
  role: 'assistant',
  content: '',
  createdAt: '2026-05-20T00:00:00Z',
  parentId: 'user-1',
  executionSteps: [{ stage: 'planning', message: 'Planning', startedAt: 1 }],
};

const baseProps = {
  message: assistantMessage,
  index: 1,
  transcriptLength: 2,
  getSiblings: () => ['assistant-1'],
  latestUserMessageId: 'user-1',
  isLoading: false,
  isStreaming: true,
  isAwaitingRunStart: false,
  awaitingWsFollowUp: false,
  thinkingPanelExpanded: false,
  onToggleThinking: vi.fn(),
  executionTracePanelExpanded: true,
  onToggleExecutionTrace: vi.fn(),
  editingMessageId: null,
  onSetEditingMessageId: vi.fn(),
  onEditMessage: vi.fn(),
  onRetryAssistantRun: vi.fn(),
  onRetryUserMessage: vi.fn(),
  onSendFollowUp: vi.fn(),
  onSelectSibling: vi.fn(),
};

describe('ChatMessageRow reasoning stream state', () => {
  it('marks planning trace as streaming before first thinking delta', () => {
    render(
      <ChatMessageRow
        {...baseProps}
        run={{
          assistantMessageId: 'assistant-1',
          userMessageId: 'user-1',
          buffer: '',
          thinkingBuffer: '',
          thinkingPhase: 'planning',
          reasoningStreamEnabled: true,
          statusHistory: [{ stage: 'planning', message: 'Planning', startedAt: 1 }],
        }}
      />
    );

    expect(screen.getByTestId('execution-trace-panel')).toBeInTheDocument();
    const captured = panelProps.current;
    expect(captured?.assistantThinkingStreaming).toBe(true);
  });

  it('passes server disabled reason to the execution trace panel', () => {
    render(
      <ChatMessageRow
        {...baseProps}
        run={{
          assistantMessageId: 'assistant-1',
          userMessageId: 'user-1',
          buffer: '',
          thinkingBuffer: '',
          thinkingPhase: 'planning',
          reasoningStreamEnabled: false,
          reasoningStreamDisabledReason: 'Reasoning stream is disabled in server configuration.',
          statusHistory: [{ stage: 'planning', message: 'Planning', startedAt: 1 }],
        }}
      />
    );

    const captured = panelProps.current;
    expect(captured?.reasoningStreamDisabledReason).toBe(
      'Reasoning stream is disabled in server configuration.'
    );
    expect(captured?.assistantThinkingStreaming).toBe(false);
  });
});
