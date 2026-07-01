#!/usr/bin/env node
/**
 * One-shot codemod: raw <select>/<textarea> → Select/Textarea primitives.
 * Skips atoms primitives, tests, and stories.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const srcRoot = join(process.cwd(), 'src');
const skipPath = (p) =>
  p.includes('.test.') ||
  p.includes('.stories.') ||
  p.includes('components/atoms/Select.') ||
  p.includes('components/atoms/Textarea.') ||
  p.includes('components/atoms/FormInput.') ||
  p.includes('components/atoms/InlineEdit.');

function walk(dir, acc = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) walk(full, acc);
    else if (ent.name.endsWith('.tsx')) acc.push(full);
  }
  return acc;
}

function ensureImport(content, symbol, fromPath) {
  if (content.includes(`from '${fromPath}'`) && content.includes(symbol)) {
    return content;
  }
  const importLine = `import { ${symbol} } from '${fromPath}';\n`;
  const lastImport = content.lastIndexOf('\nimport ');
  if (lastImport >= 0) {
    const end = content.indexOf('\n', lastImport + 1);
    return content.slice(0, end + 1) + importLine + content.slice(end + 1);
  }
  return importLine + content;
}

let changed = 0;
for (const file of walk(srcRoot)) {
  const rel = relative(srcRoot, file).replace(/\\/g, '/');
  if (skipPath(rel)) continue;

  let content = readFileSync(file, 'utf-8');
  const before = content;

  if (/<select\b/.test(content)) {
    content = content.replace(/<select\b/g, '<Select');
    content = content.replace(/<\/select>/g, '</Select>');
    content = ensureImport(content, 'Select', '@/components/atoms/Select');
  }

  if (/<textarea\b/.test(content)) {
    content = content.replace(/<textarea\b/g, '<Textarea');
    content = content.replace(/<\/textarea>/g, '</Textarea>');
    content = ensureImport(content, 'Textarea', '@/components/atoms/Textarea');
  }

  if (content !== before) {
    writeFileSync(file, content, 'utf-8');
    changed++;
    console.log('updated', rel);
  }
}

console.log(`\nDone. ${changed} file(s) updated.`);
