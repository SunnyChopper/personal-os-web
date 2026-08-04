/**
 * Bundled platform-rule catalog (mirrors backend
 * `personal_branding_platform_policy.get_platform_rule_catalog`).
 *
 * Keep in sync with `personal-os-backend/src/services/personal_branding_platform_policy.py`
 * MODE_CATALOG / DEVICE_CATALOG / PLATFORM_LIMIT_DEFAULTS / WORDS_PER_MINUTE.
 * SPA serves this locally so Brand Identity UI does not depend on Lambda cold-start
 * availability for a static constant payload (alert aafeaa15dfe7).
 */
import type {
  PlatformRuleCatalog,
  PlatformRuleCatalogEntry,
} from '@/types/api/personal-branding.dto';

function entry(
  id: string,
  label: string,
  definition: string,
  example: string,
  enabledEffect: string,
  disabledEffect: string
): PlatformRuleCatalogEntry {
  return { id, label, definition, example, enabledEffect, disabledEffect };
}

export const PLATFORM_RULE_CATALOG: PlatformRuleCatalog = {
  modes: [
    entry(
      'narrative',
      'Narrative',
      'Tell a story with a clear sequence of events.',
      'I shipped the v2 launch at 2 a.m., broke prod, then recovered by dawn.',
      'Use chronological storytelling and scene progression.',
      'Avoid extended story arcs; stay analytical or list-driven.'
    ),
    entry(
      'descriptive',
      'Descriptive',
      'Paint vivid scenes using concrete sensory detail.',
      'The dashboard glows blue at midnight while alerts tick in the sidebar.',
      'Include specific imagery and tangible examples.',
      'Keep language abstract; minimize sensory detail.'
    ),
    entry(
      'expository',
      'Expository',
      'Explain concepts clearly with structure and evidence.',
      'Personal branding is how you consistently signal expertise across platforms.',
      'Prioritize clarity, definitions, and stepwise explanation.',
      'Avoid tutorial-style exposition; favor opinion or story.'
    ),
    entry(
      'argumentative',
      'Argumentative',
      'Build a reasoned case with claims and support.',
      'Short-form posts outperform long essays when your audience scrolls on mobile.',
      'State a thesis and defend it with evidence.',
      'Avoid debate framing; stay neutral or observational.'
    ),
    entry(
      'persuasive',
      'Persuasive',
      'Move the reader toward a belief or action.',
      "Subscribe to the newsletter—you'll get one actionable tip every Tuesday.",
      'Use calls to action and value-aligned framing.',
      'Avoid direct persuasion; stay informational only.'
    ),
    entry(
      'instructional',
      'Instructional',
      'Teach the reader how to do something practical.',
      'Step 1: Pick your three pillars. Step 2: Draft one hook per platform.',
      'Use numbered steps and actionable guidance.',
      'Avoid how-to steps; keep content conceptual.'
    ),
  ],
  devices: [
    entry(
      'metaphor',
      'Metaphor',
      'Direct comparison without like/as.',
      'Your LinkedIn profile is your storefront window.',
      'May use metaphors for clarity.',
      'Do not use metaphors.'
    ),
    entry(
      'simile',
      'Simile',
      'Comparison using like or as.',
      'Engagement feels like a tide—it rises when you show up consistently.',
      'May use similes sparingly.',
      'Do not use similes.'
    ),
    entry(
      'analogy',
      'Analogy',
      'Extended comparison to explain unfamiliar ideas.',
      'Building a brand voice is like tuning an instrument—small adjustments compound.',
      'May use analogies to simplify complex topics.',
      'Do not use analogies.'
    ),
    entry(
      'anecdote',
      'Anecdote',
      'Short personal or illustrative story.',
      'Last quarter I posted daily for 30 days and doubled inbound DMs.',
      'May open sections with brief anecdotes.',
      'Do not use anecdotes.'
    ),
    entry(
      'rhetoricalQuestion',
      'Rhetorical question',
      'Question asked for effect, not an answer.',
      'What would change if you led every post with one clear promise?',
      'May use rhetorical questions for engagement.',
      'Do not use rhetorical questions.'
    ),
    entry(
      'anaphora',
      'Anaphora',
      'Repeat a phrase at the start of successive clauses.',
      'Build trust. Build rhythm. Build a voice people recognize.',
      'May use anaphora for rhythm and emphasis.',
      'Do not use anaphora.'
    ),
    entry(
      'antithesis',
      'Antithesis',
      'Juxtapose contrasting ideas in parallel structure.',
      'Be bold in ideas, restrained in self-promotion.',
      'May contrast opposing ideas for emphasis.',
      'Do not use antithesis.'
    ),
    entry(
      'parallelism',
      'Parallelism',
      'Use matching grammatical structures for rhythm.',
      'Write clearly, edit ruthlessly, publish consistently.',
      'May use parallel sentence structures.',
      'Do not use parallel constructions.'
    ),
    entry(
      'ruleOfThree',
      'Rule of three',
      'Group ideas in threes for memorability.',
      'clarity, speed, and trust',
      'May organize key points in groups of three.',
      'Avoid deliberate three-part lists.'
    ),
    entry(
      'hyperbole',
      'Hyperbole',
      'Deliberate exaggeration for emphasis.',
      'This one headline change transformed my entire funnel overnight.',
      'May use mild hyperbole for emphasis.',
      'Do not use hyperbole or exaggeration.'
    ),
  ],
  strengths: ['subtle', 'light', 'moderate', 'strong', 'dominant'],
  wordsPerMinute: 200,
  limitDefaults: {
    x: { characterLimit: 280, readTimeLimitMinutes: 1 },
    linkedin: { characterLimit: 1300, readTimeLimitMinutes: 3 },
    medium: { characterLimit: 2500, readTimeLimitMinutes: 6 },
    instagram: { characterLimit: 2200, readTimeLimitMinutes: 2 },
    youtube: { characterLimit: 5000, readTimeLimitMinutes: 8 },
    newsletter: { characterLimit: 3500, readTimeLimitMinutes: 7 },
  },
};
