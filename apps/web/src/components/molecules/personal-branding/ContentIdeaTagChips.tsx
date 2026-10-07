/* eslint-disable react-refresh/only-export-components -- helpers must live here (see comment below) */
/** Keep helpers in this module — a sibling `content-idea-tag-chips.ts` collides with
 * `ContentIdeaTagChips.tsx` under Windows→WSL rsync (DrvFs), so the deploy mirror can
 * sync the component and drop the helper, breaking Vite resolve on Linux. */
export const DEFAULT_MAX_VISIBLE_TAGS = 3;

export function splitVisibleTags(tags: string[], maxVisible = DEFAULT_MAX_VISIBLE_TAGS) {
  const visible = tags.slice(0, maxVisible);
  const hidden = tags.slice(maxVisible);
  return { visible, hidden };
}

interface ContentIdeaTagChipsProps {
  tags: string[];
  maxVisible?: number;
}

export function ContentIdeaTagChips({
  tags,
  maxVisible = DEFAULT_MAX_VISIBLE_TAGS,
}: ContentIdeaTagChipsProps) {
  if (tags.length === 0) return null;

  const { visible, hidden } = splitVisibleTags(tags, maxVisible);
  const hiddenLabel = hidden.join(', ');

  return (
    <>
      {visible.map((tag) => (
        <span key={tag} className="rounded bg-gray-100 px-2 py-0.5 dark:bg-gray-800">
          {tag}
        </span>
      ))}
      {hidden.length > 0 ? (
        <span
          className="rounded bg-gray-100 px-2 py-0.5 dark:bg-gray-800"
          title={hiddenLabel}
          aria-label={`${hidden.length} more tags: ${hiddenLabel}`}
        >
          +{hidden.length}
        </span>
      ) : null}
    </>
  );
}
