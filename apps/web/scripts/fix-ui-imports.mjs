#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const srcRoot = join(process.cwd(), 'src');
const PRIMITIVE_IMPORT_RE =
  /^import \{ (Select|Textarea) \} from '@\/components\/atoms\/(Select|Textarea)';\n/gm;

function walk(dir, acc = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) walk(full, acc);
    else if (ent.name.endsWith('.tsx')) acc.push(full);
  }
  return acc;
}

function fixFile(content) {
  const needsSelect = /<Select\b/.test(content);
  const needsTextarea = /<Textarea\b/.test(content);

  let cleaned = content.replace(
    /import \{\nimport \{ (?:Select|Textarea) \} from '@\/components\/atoms\/(?:Select|Textarea)';\n(?:import \{ (?:Select|Textarea) \} from '@\/components\/atoms\/(?:Select|Textarea)';\n)?/g,
    'import {\n'
  );

  cleaned = cleaned.replace(PRIMITIVE_IMPORT_RE, '');

  const importEnd = cleaned.search(/\n(?:export |function |const |interface |type )/);
  const head = importEnd > 0 ? cleaned.slice(0, importEnd) : cleaned;
  const tail = importEnd > 0 ? cleaned.slice(importEnd) : '';

  const lines = [];
  if (needsSelect && !head.includes("from '@/components/atoms/Select'")) {
    lines.push("import { Select } from '@/components/atoms/Select';");
  }
  if (needsTextarea && !head.includes("from '@/components/atoms/Textarea'")) {
    lines.push("import { Textarea } from '@/components/atoms/Textarea';");
  }

  if (lines.length === 0) return content === cleaned ? null : cleaned;

  return head + (head.endsWith('\n') ? '' : '\n') + lines.join('\n') + '\n' + tail;
}

let fixed = 0;
for (const file of walk(srcRoot)) {
  const content = readFileSync(file, 'utf-8');
  const next = fixFile(content);
  if (next && next !== content) {
    writeFileSync(file, next, 'utf-8');
    fixed++;
    console.log('fixed', relative(srcRoot, file));
  }
}
console.log(`\n${fixed} file(s) repaired.`);
