/**
 * Helper function to extract text content from React nodes.
 * Recursively traverses the node tree to extract all text content.
 */
export function extractTextFromNode(node: unknown): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) {
    return node.map(extractTextFromNode).join('');
  }
  if (node && typeof node === 'object' && node !== null && 'props' in node) {
    const props = (node as { props: unknown }).props;
    if (props && typeof props === 'object' && props !== null && 'children' in props) {
      return extractTextFromNode((props as { children: unknown }).children);
    }
  }
  return '';
}

/**
 * Generate a stable hash from text content for use in heading IDs.
 */
export function createTextHash(textContent: string): string {
  return textContent
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50); // Limit length
}

/**
 * Generate a stable heading ID from level and text content.
 * Uses provided maps to ensure the same heading always gets the same ID across re-renders.
 * Handles duplicate headings by tracking occurrences and generating unique IDs for each instance.
 */
export function generateHeadingId(
  level: number,
  textContent: string,
  headingIdMap: Map<string, string>,
  headingCounters: Record<number, number>,
  headingOccurrenceMap: Map<string, number>
): string {
  const textHash = createTextHash(textContent);
  const mapKey = `${level}-${textHash || 'untitled'}`;

  // Get current occurrence count for this mapKey (how many times we've seen this heading text at this level)
  const occurrenceCount = headingOccurrenceMap.get(mapKey) || 0;

  // Create a unique key that includes the occurrence index to ensure each duplicate gets a unique ID
  const uniqueMapKey = occurrenceCount === 0 ? mapKey : `${mapKey}-${occurrenceCount}`;

  // Check if we've already generated an ID for this specific occurrence
  if (headingIdMap.has(uniqueMapKey)) {
    // Increment occurrence count for next time we see this heading
    headingOccurrenceMap.set(mapKey, occurrenceCount + 1);
    return headingIdMap.get(uniqueMapKey)!;
  }

  // New heading occurrence - generate ID with counter and occurrence suffix if needed
  const counter = headingCounters[level] || 0;
  headingCounters[level] = counter + 1;

  // For the first occurrence, use standard format. For duplicates, append occurrence index.
  const headingId =
    occurrenceCount === 0
      ? `heading-${level}-${textHash || 'untitled'}-${counter}`
      : `heading-${level}-${textHash || 'untitled'}-${counter}-${occurrenceCount}`;

  // Store the ID with the unique key (including occurrence index)
  headingIdMap.set(uniqueMapKey, headingId);

  // Increment occurrence count for next time we see this heading
  headingOccurrenceMap.set(mapKey, occurrenceCount + 1);

  return headingId;
}
