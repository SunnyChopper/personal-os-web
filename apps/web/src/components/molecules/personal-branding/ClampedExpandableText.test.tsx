import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ClampedExpandableText } from './ClampedExpandableText';

const LONG_TEXT =
  'Video Script: From Prototype to Production Agent Efficiency in 8 Minutes with observability and action.';

describe('ClampedExpandableText', () => {
  it('applies line-clamp-2 by default', () => {
    render(
      <article className="group">
        <ClampedExpandableText as="h3" lines={2} className="font-semibold">
          {LONG_TEXT}
        </ClampedExpandableText>
      </article>
    );

    const node = screen.getByRole('button', { name: LONG_TEXT });
    expect(node).toHaveClass('line-clamp-2');
    expect(node).toHaveAttribute('aria-expanded', 'false');
  });

  it('applies line-clamp-3 when lines is 3', () => {
    render(
      <article className="group">
        <ClampedExpandableText lines={3}>{LONG_TEXT}</ClampedExpandableText>
      </article>
    );

    expect(screen.getByRole('button', { name: LONG_TEXT })).toHaveClass('line-clamp-3');
  });

  it('removes clamp and sets aria-expanded when clicked', async () => {
    const user = userEvent.setup();
    render(
      <article className="group">
        <ClampedExpandableText lines={2}>{LONG_TEXT}</ClampedExpandableText>
      </article>
    );

    const node = screen.getByRole('button', { name: LONG_TEXT });
    await user.click(node);

    expect(node).not.toHaveClass('line-clamp-2');
    expect(node).toHaveAttribute('aria-expanded', 'true');

    await user.click(node);

    expect(node).toHaveClass('line-clamp-2');
    expect(node).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggles pinned state with Enter key', async () => {
    const user = userEvent.setup();
    render(
      <article className="group">
        <ClampedExpandableText lines={3}>{LONG_TEXT}</ClampedExpandableText>
      </article>
    );

    const node = screen.getByRole('button', { name: LONG_TEXT });
    node.focus();
    await user.keyboard('{Enter}');

    expect(node).toHaveAttribute('aria-expanded', 'true');
    expect(node).not.toHaveClass('line-clamp-3');
  });
});
