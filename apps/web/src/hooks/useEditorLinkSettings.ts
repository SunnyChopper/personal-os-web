import { useCallback, useMemo, useState } from 'react';
import type { EditorProtocol } from '@/lib/editor-links';
import { logger } from '@/lib/logger';

export const EDITOR_PROTOCOL_STORAGE_KEY = 'personal-os.observability.editorProtocol';
export const LOCAL_REPO_ROOT_STORAGE_KEY = 'personal-os.observability.localRepoRoot';

const VALID_PROTOCOLS: EditorProtocol[] = ['cursor', 'vscode', 'none'];

function parseProtocol(raw: string | null): EditorProtocol {
  if (raw && VALID_PROTOCOLS.includes(raw as EditorProtocol)) {
    return raw as EditorProtocol;
  }
  return 'cursor';
}

function readProtocol(): EditorProtocol {
  if (typeof window === 'undefined') return 'cursor';
  try {
    return parseProtocol(localStorage.getItem(EDITOR_PROTOCOL_STORAGE_KEY));
  } catch {
    return 'cursor';
  }
}

function readLocalRepoRoot(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(LOCAL_REPO_ROOT_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function writeProtocol(protocol: EditorProtocol): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EDITOR_PROTOCOL_STORAGE_KEY, protocol);
  } catch (error) {
    logger.warn('Failed to persist observability editor protocol', error);
  }
}

function writeLocalRepoRoot(localRepoRoot: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_REPO_ROOT_STORAGE_KEY, localRepoRoot);
  } catch (error) {
    logger.warn('Failed to persist observability local repo root', error);
  }
}

export function useEditorLinkSettings() {
  const [protocol, setProtocolState] = useState<EditorProtocol>(() => readProtocol());
  const [localRepoRoot, setLocalRepoRootState] = useState(() => readLocalRepoRoot());

  const setProtocol = useCallback((next: EditorProtocol) => {
    setProtocolState(next);
    writeProtocol(next);
  }, []);

  const setLocalRepoRoot = useCallback((next: string) => {
    setLocalRepoRootState(next);
    writeLocalRepoRoot(next);
  }, []);

  const settings = useMemo(() => ({ protocol, localRepoRoot }), [protocol, localRepoRoot]);

  return {
    protocol,
    localRepoRoot,
    setProtocol,
    setLocalRepoRoot,
    settings,
  };
}
