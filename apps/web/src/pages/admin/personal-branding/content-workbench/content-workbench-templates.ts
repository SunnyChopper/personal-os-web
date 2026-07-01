import type { ContentType } from '@/types/api/personal-branding.dto';

export function layoutTemplateForContentType(contentType: ContentType): string {
  switch (contentType) {
    case 'DEEP_DIVE_BLOG':
      return `# Title

## Hook
One paragraph that states the problem and promise.

## Context
Background the reader needs.

## Deep dive
### Section 1
Core insight with evidence.

### Section 2
Practical implications.

## Takeaways
- Bullet 1
- Bullet 2
- Bullet 3

## CTA
What should the reader do next?
`;
    case 'SOCIAL_THREAD':
      return `1/ Hook — bold claim or question

2/ Context — why this matters now

3/ Insight — the core lesson

4/ Example — concrete proof

5/ Framework — 3-step breakdown

6/ CTA — ask a question or invite replies
`;
    case 'VIDEO_SCRIPT':
      return `[INTRO — 0:00-0:15]
On-camera hook + pattern interrupt.

[SECTION 1 — 0:15-1:00]
Main thesis with B-roll notes.

[SECTION 2 — 1:00-2:30]
Demonstration or story beat.

[OUTRO — 2:30-3:00]
Recap + subscribe CTA.
`;
    default:
      return '';
  }
}
