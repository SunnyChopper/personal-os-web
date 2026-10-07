import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import SubModuleTabShell from './SubModuleTabShell';

const TABS = [
  { id: 'alpha', label: 'Alpha' },
  { id: 'beta', label: 'Beta' },
  { id: 'gamma', label: 'Gamma' },
] as const;

function renderShell(options?: {
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  isLoading?: boolean;
  controlled?: boolean;
  keepMounted?: boolean;
}) {
  const onTabChange = options?.onTabChange ?? vi.fn();
  const controlled = options?.controlled ?? Boolean(options?.activeTabId);
  render(
    <SubModuleTabShell
      tabs={TABS}
      defaultTabId="alpha"
      ariaLabel="Test sections"
      activeTabId={controlled ? (options?.activeTabId ?? 'alpha') : options?.activeTabId}
      onTabChange={controlled ? onTabChange : options?.onTabChange}
      isLoading={options?.isLoading}
      keepMounted={options?.keepMounted}
      renderPanel={(tabId) => (
        <div>
          <h2>{tabId} panel</h2>
          <button type="button">Panel action</button>
        </div>
      )}
    />
  );
  return { onTabChange };
}

function ControlledKeepMountedShell(options?: { isLoading?: boolean }) {
  const [active, setActive] = useState('alpha');
  return (
    <SubModuleTabShell
      tabs={TABS}
      defaultTabId="alpha"
      ariaLabel="Test sections"
      activeTabId={active}
      onTabChange={setActive}
      isLoading={options?.isLoading}
      keepMounted
      renderPanel={(tabId) => (
        <div>
          <h2>{tabId} panel</h2>
          {Array.from({ length: 40 }, (_, index) => (
            <p key={index}>Line {index}</p>
          ))}
        </div>
      )}
    />
  );
}

describe('SubModuleTabShell keyboard and focus', () => {
  it('uses roving tabindex on tabs', () => {
    renderShell();

    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute('tabindex', '-1');
  });

  it('wires aria-controls and aria-labelledby between tabs and panel', () => {
    renderShell();

    const panel = screen.getByRole('tabpanel');
    const alphaTab = screen.getByRole('tab', { name: 'Alpha' });

    expect(alphaTab).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', alphaTab.id);
  });

  it('moves selection and focus with ArrowRight, ArrowLeft, Home, and End', () => {
    renderShell();

    const alphaTab = screen.getByRole('tab', { name: 'Alpha' });
    const betaTab = screen.getByRole('tab', { name: 'Beta' });
    const gammaTab = screen.getByRole('tab', { name: 'Gamma' });

    alphaTab.focus();
    fireEvent.keyDown(alphaTab, { key: 'ArrowRight' });
    expect(betaTab).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(betaTab);

    fireEvent.keyDown(betaTab, { key: 'End' });
    expect(gammaTab).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(gammaTab);

    fireEvent.keyDown(gammaTab, { key: 'Home' });
    expect(alphaTab).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(alphaTab);

    fireEvent.keyDown(alphaTab, { key: 'ArrowLeft' });
    expect(gammaTab).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(gammaTab);
  });

  it('focuses panel heading on click but not on arrow activation', async () => {
    renderShell();

    const betaTab = screen.getByRole('tab', { name: 'Beta' });
    fireEvent.click(betaTab);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'beta panel' })).toHaveFocus();
    });

    const gammaTab = screen.getByRole('tab', { name: 'Gamma' });
    gammaTab.focus();
    fireEvent.keyDown(gammaTab, { key: 'ArrowLeft' });

    expect(document.activeElement).toBe(betaTab);
    expect(screen.getByRole('heading', { name: 'beta panel' })).not.toHaveFocus();
  });

  it('does not activate tabs while loading', () => {
    const onTabChange = vi.fn();
    renderShell({ isLoading: true, controlled: true, onTabChange });

    const betaTab = screen.getByRole('tab', { name: 'Beta' });
    fireEvent.click(betaTab);
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Alpha' }), { key: 'ArrowRight' });

    expect(onTabChange).not.toHaveBeenCalled();
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('SubModuleTabShell keepMounted', () => {
  it('renders one tabpanel per tab with inactive panels hidden', () => {
    renderShell({ keepMounted: true, controlled: true, activeTabId: 'alpha' });

    const panels = screen.getAllByRole('tabpanel', { hidden: true });
    expect(panels).toHaveLength(3);

    const betaTab = screen.getByRole('tab', { name: 'Beta' });
    const betaPanelId = betaTab.getAttribute('aria-controls');
    expect(betaPanelId).toBeTruthy();
    const betaPanel = document.getElementById(betaPanelId!);
    expect(betaPanel).toHaveAttribute('hidden');
    expect(betaPanel).toHaveTextContent('beta panel');
  });

  it('wires each tab aria-controls to its own panel id', () => {
    renderShell({ keepMounted: true, controlled: true, activeTabId: 'alpha' });

    for (const tab of TABS) {
      const tabButton = screen.getByRole('tab', { name: tab.label });
      const panelId = tabButton.getAttribute('aria-controls');
      expect(panelId).toBeTruthy();
      expect(document.getElementById(panelId!)).toHaveAttribute('aria-labelledby', tabButton.id);
    }
  });

  it('preserves panel scrollTop across tab switches', () => {
    render(<ControlledKeepMountedShell />);

    const betaTab = screen.getByRole('tab', { name: 'Beta' });
    fireEvent.click(betaTab);

    const betaPanelId = betaTab.getAttribute('aria-controls');
    expect(betaPanelId).toBeTruthy();
    const betaPanel = document.getElementById(betaPanelId!) as HTMLDivElement;
    betaPanel.scrollTop = 120;

    fireEvent.click(screen.getByRole('tab', { name: 'Gamma' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Beta' }));

    expect(betaPanel.scrollTop).toBe(120);
  });

  it('focuses the active panel heading on click', async () => {
    render(<ControlledKeepMountedShell />);

    fireEvent.click(screen.getByRole('tab', { name: 'Beta' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'beta panel' })).toHaveFocus();
    });
  });

  it('keeps inactive panel content mounted while loading', () => {
    render(<ControlledKeepMountedShell isLoading />);

    const betaTab = screen.getByRole('tab', { name: 'Beta' });
    const betaPanel = document.getElementById(betaTab.getAttribute('aria-controls')!);
    expect(betaPanel).toHaveAttribute('hidden');
    expect(betaPanel).toHaveTextContent('beta panel');
  });
});
