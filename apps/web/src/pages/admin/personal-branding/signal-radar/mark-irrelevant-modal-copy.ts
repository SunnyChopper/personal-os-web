export function getMarkIrrelevantModalCopy(itemCount: number, itemTitle?: string) {
  const isBulk = itemCount > 1;
  const title = isBulk ? 'Why are these irrelevant?' : 'Why is this irrelevant?';
  const submitLabel = isBulk ? `Mark ${itemCount} cards as irrelevant` : 'Mark as irrelevant';
  const description = isBulk
    ? `Help the ranking agent learn what to filter. Pick one reason for all ${itemCount} selected cards.`
    : itemTitle
      ? `Help the ranking agent learn what to filter. Pick a reason for ${itemTitle}.`
      : 'Pick a reason so future Trend Stream items improve automatically.';

  return { title, submitLabel, description, isBulk };
}
