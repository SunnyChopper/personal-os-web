import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIHabitAssistPanel } from '@/components/molecules/AIHabitAssistPanel';
import { habitAIService } from '@/services/growth-system/habit-ai.service';

vi.mock('@/lib/llm', () => ({
  llmConfig: { isConfigured: () => true },
}));

describe('AIHabitAssistPanel', () => {
  beforeEach(() => {
    vi.spyOn(habitAIService, 'runEstablishedAction').mockResolvedValue({
      success: true,
      data: {
        result: {
          habitId: 'hab-1',
          actionType: 'patternInsight',
          readiness: 'established',
          title: 'Patterns look steady',
          summary: 'y'.repeat(45),
          evidence: [{ label: 'Logs', detail: 'Evidence detail text ok ok ok ok ok' }],
          recommendations: ['Keep weekday anchor'],
        },
        confidence: 0.71,
        provider: 'anthropic',
        model: '',
        cached: false,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('runs coaching when prompted', async () => {
    const user = userEvent.setup();
    render(
      <AIHabitAssistPanel
        mode="patternInsight"
        habitId="hab-1"
        habitName="Morning run"
        onClose={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Run coaching' }));

    expect(habitAIService.runEstablishedAction).toHaveBeenCalledWith({
      habitId: 'hab-1',
      actionType: 'patternInsight',
    });
    expect(screen.getByText('Patterns look steady')).toBeInTheDocument();
  });

  it('shows backend error message when request fails', async () => {
    vi.spyOn(habitAIService, 'runEstablishedAction').mockResolvedValue({
      success: false,
      error: { message: 'Server unavailable', code: 'ERR' },
    });

    const user = userEvent.setup();
    render(
      <AIHabitAssistPanel mode="recoveryPlan" habitId="hab-1" habitName="Read" onClose={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: 'Run coaching' }));

    expect(screen.getByText('Server unavailable')).toBeInTheDocument();
  });

  it('applies suggested patch when handler provided', async () => {
    vi.spyOn(habitAIService, 'runEstablishedAction').mockResolvedValue({
      success: true,
      data: {
        result: {
          habitId: 'hab-1',
          actionType: 'routineTuneUp',
          readiness: 'strongSignal',
          title: 'Tune cues',
          summary: 'y'.repeat(45),
          evidence: [{ label: 'Friction', detail: 'Evidence detail text ok ok ok ok ok' }],
          recommendations: ['Shrink scope'],
          suggestedHabitPatch: { trigger: 'Right after shoes on' },
        },
        confidence: 0.66,
        provider: 'anthropic',
        model: '',
        cached: false,
      },
    });

    const user = userEvent.setup();
    const onApply = vi.fn().mockResolvedValue(undefined);

    render(
      <AIHabitAssistPanel
        mode="routineTuneUp"
        habitId="hab-1"
        habitName="Walk"
        onClose={vi.fn()}
        onApplySuggestedPatch={onApply}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Run coaching' }));
    await user.click(screen.getByRole('button', { name: 'Apply suggested update' }));

    expect(onApply).toHaveBeenCalledWith({ trigger: 'Right after shoes on' });
  });
});
