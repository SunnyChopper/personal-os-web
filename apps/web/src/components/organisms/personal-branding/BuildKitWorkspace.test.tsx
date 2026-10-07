import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import BuildKitWorkspace from './BuildKitWorkspace';
import type {
  BrandProjectBuildKit,
  BrandProjectBuildKitHarness,
} from '@/types/api/personal-branding.dto';

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn() },
  });
});

const kit: BrandProjectBuildKit = {
  setupPrompt: 'setup-prompt-text',
  cursorSkills: [{ name: 'My Skill', description: 'hidden', skillMarkdown: 'skill-md' }],
  modules: [
    {
      order: 1,
      name: 'Core',
      goal: 'Ship it',
      prompt: 'module-prompt-text',
      dependsOn: ['Auth', 'DB'],
    },
  ],
  generatedAt: '2026-01-01T00:00:00.000Z',
  provider: 'hidden-provider',
  model: 'hidden-model',
};

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
      order: 2,
      name: 'Demo',
      moduleNames: ['Core'],
      dependsOn: ['Foundation'],
      integrationPoint: 'CLI prints the demo',
    },
    {
      order: 1,
      name: 'Foundation',
      moduleNames: ['Auth'],
      dependsOn: [],
      integrationPoint: 'repo builds',
    },
  ],
};

const kitWithHarness: BrandProjectBuildKit = { ...kit, harness };

describe('BuildKitWorkspace', () => {
  it('renders contents nav and dependsOn for modules', () => {
    render(<BuildKitWorkspace kit={kit} onGenerate={vi.fn()} />);

    expect(screen.getByRole('navigation', { name: /build kit contents/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Setup' })).toHaveAttribute('href', '#build-kit-setup');
    expect(screen.getByRole('link', { name: 'My Skill' })).toHaveAttribute(
      'href',
      '#build-kit-skill-0'
    );
    expect(screen.getByText('Depends on Auth, DB')).toBeInTheDocument();
    expect(screen.queryByText('hidden')).not.toBeInTheDocument();
    expect(screen.queryByText('hidden-provider')).not.toBeInTheDocument();
    expect(screen.queryByText('hidden-model')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Design' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Waves' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Skills' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copy design notes/i })).not.toBeInTheDocument();
  });

  it('shows loading and failed states without a dialog', () => {
    const { rerender } = render(<BuildKitWorkspace kit={null} isLoading onGenerate={vi.fn()} />);
    expect(screen.getByText(/generating prompts/i)).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(
      <BuildKitWorkspace kit={null} error="Kit blew up" onGenerate={vi.fn()} onRetry={vi.fn()} />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Kit blew up');
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('shows Copied on block copy success', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    render(<BuildKitWorkspace kit={kit} onGenerate={vi.fn()} />);

    const copyButtons = screen.getAllByRole('button', { name: 'Copy' });
    fireEvent.click(copyButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Copied' }).length).toBeGreaterThan(0);
    });
  });

  it('shows failure alert when clipboard rejects', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));

    render(<BuildKitWorkspace kit={kit} onGenerate={vi.fn()} />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Copy' })[0]);

    await waitFor(() => {
      expect(screen.getAllByRole('alert')[0]).toHaveTextContent("Couldn't copy");
    });
  });

  it('Copy all writes ordered plain text', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText);

    render(<BuildKitWorkspace kit={kit} onGenerate={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /copy all/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        'Setup\nsetup-prompt-text\n\nMy Skill\nskill-md\n\nModule 1: Core\nmodule-prompt-text'
      );
    });
  });

  it('omits skill links when cursorSkills is empty', () => {
    render(<BuildKitWorkspace kit={{ ...kit, cursorSkills: [] }} onGenerate={vi.fn()} />);

    expect(screen.queryByRole('link', { name: 'My Skill' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Setup' })).toBeInTheDocument();
  });

  it('renders design, waves, and skills when a harness is stored', () => {
    render(<BuildKitWorkspace kit={kitWithHarness} onGenerate={vi.fn()} />);

    const nav = screen.getByRole('navigation', { name: /build kit contents/i });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent)
    ).toEqual(['Setup', 'Design', 'Waves', 'Skills', 'My Skill', 'Module 1: Core']);
    expect(screen.getByRole('link', { name: 'Design' })).toHaveAttribute(
      'href',
      '#build-kit-design'
    );
    expect(screen.getByRole('link', { name: 'Waves' })).toHaveAttribute('href', '#build-kit-waves');
    expect(screen.getByRole('link', { name: 'Skills' })).toHaveAttribute(
      'href',
      '#build-kit-skills'
    );
    expect(screen.getByText('A live terminal demo')).toBeInTheDocument();
    expect(screen.getByText('React UI')).toBeInTheDocument();
    expect(screen.getByText('FastAPI service')).toBeInTheDocument();
    expect(screen.getByText('ui: React — familiar')).toBeInTheDocument();
    expect(screen.getByText('cursor-skill — reuse the scaffold')).toBeInTheDocument();
    expect(screen.getByText('src/cli.py')).toBeInTheDocument();
    expect(screen.getByText('Wave 1: Foundation')).toBeInTheDocument();
    expect(screen.getByText('Modules Auth')).toBeInTheDocument();
    expect(screen.getByText('Integration point: repo builds')).toBeInTheDocument();
    expect(screen.getByText('Wave 2: Demo')).toBeInTheDocument();
    expect(screen.getByText('Modules Core')).toBeInTheDocument();
    expect(screen.getByText('Depends on Foundation')).toBeInTheDocument();
    expect(screen.getByText('Integration point: CLI prints the demo')).toBeInTheDocument();
    expect(screen.queryByText('hidden-provider')).not.toBeInTheDocument();
  });

  it('copies design notes without changing Copy all', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText);

    render(<BuildKitWorkspace kit={kitWithHarness} onGenerate={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /copy design notes/i }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
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

    fireEvent.click(screen.getByRole('button', { name: /copy all/i }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        'Setup\nsetup-prompt-text\n\nMy Skill\nskill-md\n\nModule 1: Core\nmodule-prompt-text'
      );
    });
  });

  it('shows a failure alert when copying design notes is rejected', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));

    render(<BuildKitWorkspace kit={kitWithHarness} onGenerate={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /copy design notes/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent("Couldn't copy");
    });
  });

  it('keeps the old contents list when harness is null or has no waves', () => {
    const { rerender } = render(
      <BuildKitWorkspace kit={{ ...kit, harness: null }} onGenerate={vi.fn()} />
    );
    expect(screen.queryByRole('link', { name: 'Design' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copy design notes/i })).not.toBeInTheDocument();

    rerender(
      <BuildKitWorkspace
        kit={{
          ...kitWithHarness,
          harness: { ...harness, waves: [] },
        }}
        onGenerate={vi.fn()}
      />
    );
    expect(screen.getByRole('link', { name: 'Design' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Waves' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Waves' })).not.toBeInTheDocument();

    rerender(
      <BuildKitWorkspace kit={{ ...kitWithHarness, cursorSkills: [] }} onGenerate={vi.fn()} />
    );
    expect(screen.queryByRole('link', { name: 'Skills' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Waves' })).toBeInTheDocument();
  });

  it('hides edit controls when there is no kit or no onPatch', () => {
    const { rerender } = render(
      <BuildKitWorkspace kit={null} onGenerate={vi.fn()} onPatch={vi.fn()} />
    );
    expect(screen.queryByRole('button', { name: 'Add skill' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit /i })).not.toBeInTheDocument();

    rerender(<BuildKitWorkspace kit={kit} onGenerate={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Add skill' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit My Skill' })).not.toBeInTheDocument();
  });

  it('saves a skill prompt and a module prompt through onPatch', async () => {
    const onPatch = vi.fn().mockResolvedValue(undefined);
    render(<BuildKitWorkspace kit={kit} onGenerate={vi.fn()} onPatch={onPatch} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit My Skill' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Skill prompt' }), {
      target: { value: 'updated skill' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onPatch).toHaveBeenCalledWith([
        { op: 'updateSkill', name: 'My Skill', skillMarkdown: 'updated skill' },
      ]);
    });
    expect(screen.queryByRole('textbox', { name: 'Skill prompt' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit module 1: Core' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Module prompt' }), {
      target: { value: 'updated module' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onPatch).toHaveBeenCalledWith([
        { op: 'updateModule', order: 1, prompt: 'updated module' },
      ]);
    });
  });

  it('keeps the editor open when the patch fails', async () => {
    const onPatch = vi.fn().mockRejectedValue(new Error('nope'));
    render(<BuildKitWorkspace kit={kit} onGenerate={vi.fn()} onPatch={onPatch} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit My Skill' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Skill prompt' }), {
      target: { value: 'updated skill' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('nope');
    });
    expect(screen.getByRole('textbox', { name: 'Skill prompt' })).toHaveValue('updated skill');
  });

  it('removes a skill only after confirmation', async () => {
    const onPatch = vi.fn().mockResolvedValue(undefined);
    render(<BuildKitWorkspace kit={kit} onGenerate={vi.fn()} onPatch={onPatch} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove My Skill' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(onPatch).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Remove module 1: Core' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Remove$/ }));

    await waitFor(() => {
      expect(onPatch).toHaveBeenCalledWith([{ op: 'removeModule', order: 1 }]);
    });
  });

  it('appends a skill and a module', async () => {
    const onPatch = vi.fn().mockResolvedValue(undefined);
    render(<BuildKitWorkspace kit={kit} onGenerate={vi.fn()} onPatch={onPatch} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add skill' }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: ' New skill ' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: ' what it does ' } });
    fireEvent.change(screen.getByLabelText('Skill prompt'), { target: { value: 'skill body' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onPatch).toHaveBeenCalledWith([
        {
          op: 'addSkill',
          name: 'New skill',
          description: 'what it does',
          skillMarkdown: 'skill body',
        },
      ]);
    });
    expect(screen.queryByLabelText('Skill prompt')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add module' }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: ' Next ' } });
    fireEvent.change(screen.getByLabelText('Goal'), { target: { value: ' Ship next ' } });
    fireEvent.change(screen.getByLabelText('Module prompt'), { target: { value: 'module body' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onPatch).toHaveBeenCalledWith([
        {
          op: 'addModule',
          order: 2,
          name: 'Next',
          goal: 'Ship next',
          prompt: 'module body',
        },
      ]);
    });
  });

  it('disables add at the skill and module caps', () => {
    const skills = Array.from({ length: 10 }, (_, index) => ({
      name: `Skill ${index}`,
      description: 'd',
      skillMarkdown: 'm',
    }));
    const { rerender } = render(
      <BuildKitWorkspace
        kit={{ ...kit, cursorSkills: skills }}
        onGenerate={vi.fn()}
        onPatch={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Add skill' })).toBeDisabled();
    expect(screen.getByText('10 skills is the limit.')).toBeInTheDocument();

    const modules = Array.from({ length: 20 }, (_, index) => ({
      order: index + 1,
      name: `M${index}`,
      goal: 'g',
      prompt: 'p',
      dependsOn: [] as string[],
    }));
    rerender(
      <BuildKitWorkspace kit={{ ...kit, modules }} onGenerate={vi.fn()} onPatch={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: 'Add module' })).toBeDisabled();
    expect(screen.getByText('20 modules is the limit.')).toBeInTheDocument();

    rerender(
      <BuildKitWorkspace
        kit={{
          ...kit,
          modules: [{ order: 50, name: 'Last', goal: 'g', prompt: 'p', dependsOn: [] }],
        }}
        onGenerate={vi.fn()}
        onPatch={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Add module' })).toBeDisabled();
    expect(screen.getByText("Module order can't go past 50.")).toBeInTheDocument();
  });
});
