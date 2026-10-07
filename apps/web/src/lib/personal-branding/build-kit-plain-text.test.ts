import { describe, expect, it } from 'vitest';
import { buildKitDesignNotesPlainText, buildKitPlainTextAll } from './build-kit-plain-text';
import type {
  BrandProjectBuildKit,
  BrandProjectBuildKitHarness,
} from '@/types/api/personal-branding.dto';

describe('buildKitPlainTextAll', () => {
  it('orders setup, skills, and modules with blank-line separators', () => {
    const kit: BrandProjectBuildKit = {
      setupPrompt: 'setup body',
      cursorSkills: [{ name: 'Skill A', description: 'hidden', skillMarkdown: 'skill md' }],
      modules: [
        {
          order: 2,
          name: 'Second',
          goal: 'hidden goal',
          prompt: 'mod 2 prompt',
          dependsOn: ['First'],
        },
        {
          order: 1,
          name: 'First',
          goal: 'g',
          prompt: 'mod 1 prompt',
          dependsOn: [],
        },
      ],
      generatedAt: '2026-01-01T00:00:00.000Z',
    };

    expect(buildKitPlainTextAll(kit)).toBe(
      'Setup\nsetup body\n\nSkill A\nskill md\n\nModule 1: First\nmod 1 prompt\n\nModule 2: Second\nmod 2 prompt'
    );
  });

  it('omits skill and module blocks when arrays are empty', () => {
    const kit: BrandProjectBuildKit = {
      setupPrompt: 'only setup',
      cursorSkills: [],
      modules: [],
      generatedAt: '2026-01-01T00:00:00.000Z',
    };

    expect(buildKitPlainTextAll(kit)).toBe('Setup\nonly setup');
  });
});

describe('buildKitDesignNotesPlainText', () => {
  const harness: BrandProjectBuildKitHarness = {
    demo: {
      demoSurface: 'A live terminal demo',
      frontend: 'React UI',
      backend: 'FastAPI service',
    },
    stack: {
      choices: [{ layer: 'ui', choice: 'React', rationale: 'familiar' }],
      pulledSkills: [{ name: 'cursor-skill', why: 'reuse the scaffold' }],
    },
    codebaseMap: [{ path: 'src/cli.py', purpose: 'demo entry' }],
    waves: [
      {
        order: 1,
        name: 'Foundation',
        moduleNames: ['Auth'],
        dependsOn: [],
        integrationPoint: 'repo builds',
      },
    ],
  };

  it('copies demo, stack, pulled skills, and the codebase map', () => {
    expect(buildKitDesignNotesPlainText(harness)).toBe(
      [
        'Demo surface\nA live terminal demo',
        'Frontend\nReact UI',
        'Backend\nFastAPI service',
        'Stack\nui: React - familiar',
        'Pulled skills\ncursor-skill - reuse the scaffold',
        'Codebase map\nsrc/cli.py - demo entry',
      ].join('\n\n')
    );
  });

  it('skips empty stack, pulled skills, and codebase map', () => {
    expect(
      buildKitDesignNotesPlainText({
        ...harness,
        stack: { choices: [], pulledSkills: [] },
        codebaseMap: [],
      })
    ).toBe('Demo surface\nA live terminal demo\n\nFrontend\nReact UI\n\nBackend\nFastAPI service');
  });
});
