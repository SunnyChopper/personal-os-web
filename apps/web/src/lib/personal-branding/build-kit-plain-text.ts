import type {
  BrandProjectBuildKit,
  BrandProjectBuildKitHarness,
} from '@/types/api/personal-branding.dto';

/** Plain-text export for Copy design notes: demo, stack, and codebase map. Waves stay on screen. */
export function buildKitDesignNotesPlainText(harness: BrandProjectBuildKitHarness): string {
  const blocks: string[] = [
    `Demo surface\n${harness.demo.demoSurface}`,
    `Frontend\n${harness.demo.frontend}`,
    `Backend\n${harness.demo.backend}`,
  ];

  if (harness.stack.choices.length > 0) {
    const lines = harness.stack.choices.map(
      (choice) => `${choice.layer}: ${choice.choice} - ${choice.rationale}`
    );
    blocks.push(`Stack\n${lines.join('\n')}`);
  }

  if (harness.stack.pulledSkills.length > 0) {
    const lines = harness.stack.pulledSkills.map((skill) => `${skill.name} - ${skill.why}`);
    blocks.push(`Pulled skills\n${lines.join('\n')}`);
  }

  if (harness.codebaseMap.length > 0) {
    const lines = harness.codebaseMap.map((entry) => `${entry.path} - ${entry.purpose}`);
    blocks.push(`Codebase map\n${lines.join('\n')}`);
  }

  return blocks.join('\n\n');
}

/** Plain-text export for Copy all: setup, skills, module prompts only (no goals/descriptions/metadata). */
export function buildKitPlainTextAll(kit: BrandProjectBuildKit): string {
  const blocks: string[] = [`Setup\n${kit.setupPrompt}`];

  for (const skill of kit.cursorSkills) {
    blocks.push(`${skill.name}\n${skill.skillMarkdown}`);
  }

  const modules = kit.modules.slice().sort((a, b) => a.order - b.order);
  for (const mod of modules) {
    blocks.push(`Module ${mod.order}: ${mod.name}\n${mod.prompt}`);
  }

  return blocks.join('\n\n');
}
