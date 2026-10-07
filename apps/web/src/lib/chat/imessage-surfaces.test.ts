import { describe, expect, it } from 'vitest';
import {
  chatAssistantChromeWidthClassName,
  chatBubbleMaxWidthClassName,
  chatThreadHeaderClassName,
  chatThreadHeaderMenuClassName,
  chatThreadHeaderPopoverClassName,
  getBubbleSurfaceClassName,
} from '@/lib/chat/imessage-surfaces';

describe('imessage-surfaces width tokens', () => {
  it('shares max width between bubble surface and assistant chrome', () => {
    expect(chatAssistantChromeWidthClassName).toContain(chatBubbleMaxWidthClassName);
    expect(getBubbleSurfaceClassName('assistant', 'solo')).toContain(chatBubbleMaxWidthClassName);
  });

  it('left-aligns assistant chrome with incoming bubbles', () => {
    expect(chatAssistantChromeWidthClassName).toContain('mr-auto');
    expect(chatAssistantChromeWidthClassName).toContain('w-full');
  });
});

describe('imessage-surfaces header stacking', () => {
  it('raises thread header above transcript and shell chevrons', () => {
    expect(chatThreadHeaderClassName).toContain('relative');
    expect(chatThreadHeaderClassName).toContain('z-30');
  });

  it('keeps overflow menus above header chrome', () => {
    expect(chatThreadHeaderMenuClassName).toContain('z-50');
    expect(chatThreadHeaderPopoverClassName).toContain('z-50');
  });
});
