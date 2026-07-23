export type DiffLineKind = 'same' | 'add' | 'remove';

export interface DiffLine {
  kind: DiffLineKind;
  text: string;
}

function diffLineArrays(oldLines: string[], newLines: string[]): DiffLine[] {
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(0));

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const stack: DiffLine[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      stack.push({ kind: 'same', text: oldLines[i - 1] });
      i -= 1;
      j -= 1;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ kind: 'add', text: newLines[j - 1] });
      j -= 1;
    } else {
      stack.push({ kind: 'remove', text: oldLines[i - 1] });
      i -= 1;
    }
  }
  return stack.reverse();
}

export function diffText(oldText: string, newText: string): DiffLine[] {
  if (oldText === newText) {
    return oldText.split('\n').map((text) => ({ kind: 'same', text }));
  }
  return diffLineArrays(oldText.split('\n'), newText.split('\n'));
}

export function diffVariantContent(
  previous: { title: string; body: string },
  current: { title: string; body: string }
): { title: DiffLine[]; body: DiffLine[] } {
  return {
    title: diffText(previous.title, current.title),
    body: diffText(previous.body, current.body),
  };
}
