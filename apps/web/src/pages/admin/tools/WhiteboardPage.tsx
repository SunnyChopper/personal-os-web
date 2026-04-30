import { useCallback, useEffect, useRef, useState, type ComponentProps } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Excalidraw, exportToBlob, serializeAsJSON } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import '@excalidraw/excalidraw/index.css';
import { get, set } from 'idb-keyval';
import { ArrowLeft, Copy, Image as ImageIcon, Save } from 'lucide-react';
import { ROUTES } from '@/routes';
import { whiteboardsService } from '@/services/tools/whiteboards.service';
import { cn } from '@/lib/utils';

const idbKey = (boardId: string) => `tools.whiteboard.${boardId}`;

type ExcalidrawScene = NonNullable<ComponentProps<typeof Excalidraw>['initialData']>;
type ExcalidrawOnChange = NonNullable<ComponentProps<typeof Excalidraw>['onChange']>;

export default function WhiteboardPage() {
  const { boardId = '' } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [ready, setReady] = useState(false);
  const [name, setName] = useState('Untitled board');
  const [vaultItemId, setVaultItemId] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<ExcalidrawScene | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!boardId) {
      navigate(ROUTES.admin.tools.whiteboard, { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const remote = await whiteboardsService.get(boardId);
        if (cancelled) return;
        setName(remote.name);
        setVaultItemId(remote.vaultItemId);
        try {
          const parsed = JSON.parse(remote.sceneJson) as ExcalidrawScene;
          setInitialData(parsed);
        } catch {
          setInitialData({});
        }
      } catch {
        const local = await get<string>(idbKey(boardId));
        if (cancelled) return;
        if (local) {
          try {
            setInitialData(JSON.parse(local));
          } catch {
            setInitialData({});
          }
        } else {
          setInitialData({});
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [boardId, navigate]);

  const persistLocal = useCallback<ExcalidrawOnChange>(
    (elements, appState, files) => {
      if (!boardId) return;
      const json = serializeAsJSON(elements, appState, files, 'local');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void set(idbKey(boardId), json);
      }, 500);
    },
    [boardId]
  );

  const handleSaveVault = async () => {
    if (!apiRef.current || !boardId) return;
    setError(null);
    try {
      const elements = apiRef.current.getSceneElements();
      const appState = apiRef.current.getAppState();
      const files = apiRef.current.getFiles();
      const sceneJson = serializeAsJSON(elements, appState, files, 'local');
      let thumb: string | undefined;
      try {
        const blob = await exportToBlob({
          elements,
          appState,
          files,
          mimeType: 'image/png',
          quality: 0.8,
        });
        thumb = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.onerror = () => reject(new Error('read failed'));
          r.readAsDataURL(blob);
        });
      } catch {
        thumb = undefined;
      }
      const res = await whiteboardsService.save({
        boardId,
        name,
        sceneJson,
        vaultItemId,
        thumbnailDataUrl: thumb,
      });
      setVaultItemId(res.vaultItemId);
      setSaveMsg('Saved to Knowledge Vault');
      setTimeout(() => setSaveMsg(null), 3500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const copyJson = async () => {
    if (!apiRef.current) return;
    const elements = apiRef.current.getSceneElements();
    const appState = apiRef.current.getAppState();
    const files = apiRef.current.getFiles();
    const json = serializeAsJSON(elements, appState, files, 'local');
    await navigator.clipboard.writeText(json);
    setSaveMsg('JSON copied');
    setTimeout(() => setSaveMsg(null), 2000);
  };

  const exportPng = async () => {
    if (!apiRef.current) return;
    const elements = apiRef.current.getSceneElements();
    const appState = apiRef.current.getAppState();
    const files = apiRef.current.getFiles();
    const blob = await exportToBlob({ elements, appState, files, mimeType: 'image/png' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\s+/g, '-')}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!ready || initialData === null) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-gray-500">Loading canvas…</div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-6rem)] min-h-[480px] flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to={ROUTES.admin.tools.whiteboard}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Boards
        </Link>
        <input
          className="min-w-[12rem] flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Board name"
        />
        <button
          type="button"
          onClick={() => void handleSaveVault()}
          className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          <Save className="h-4 w-4" />
          Save to Vault
        </button>
        <button
          type="button"
          onClick={() => void exportPng()}
          className="inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600"
        >
          <ImageIcon className="h-4 w-4" />
          Export PNG
        </button>
        <button
          type="button"
          onClick={() => void copyJson()}
          className="inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600"
        >
          <Copy className="h-4 w-4" />
          Copy JSON
        </button>
        {saveMsg && <span className="text-sm text-green-600">{saveMsg}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
      <div className={cn('min-h-0 flex-1 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700')}>
        <Excalidraw
          excalidrawAPI={(api) => {
            apiRef.current = api;
          }}
          initialData={initialData}
          onChange={(elements, appState, files) => {
            persistLocal(elements, appState, files);
          }}
        />
      </div>
    </div>
  );
}
