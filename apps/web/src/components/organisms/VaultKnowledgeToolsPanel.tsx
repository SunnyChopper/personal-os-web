import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, MessageCircleWarning, Wand2 } from 'lucide-react';
import { vaultPrimitivesService } from '@/services/knowledge-vault/vault-primitives.service';
import Button from '@/components/atoms/Button';
import { ROUTES } from '@/routes';

interface VaultKnowledgeToolsPanelProps {
  vaultItemId: string;
}

export function VaultKnowledgeToolsPanel({ vaultItemId }: VaultKnowledgeToolsPanelProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'expert' | 'beginner' | 'analogy'>('beginner');
  const [rewrite, setRewrite] = useState<string | null>(null);
  const [loadingRw, setLoadingRw] = useState(false);
  const [feynmanLog, setFeynmanLog] = useState<Array<{ role: string; content: string }>>([]);
  const [feynmanInput, setFeynmanInput] = useState('');
  const [feynmanOut, setFeynmanOut] = useState<Record<string, unknown> | null>(null);
  const [loadingF, setLoadingF] = useState(false);
  const [devils, setDevils] = useState<Record<string, unknown> | null>(null);
  const [loadingD, setLoadingD] = useState(false);

  const runRewrite = async () => {
    setLoadingRw(true);
    try {
      const res = await vaultPrimitivesService.rewrite(vaultItemId, mode);
      if (res.success && res.data?.text) setRewrite(res.data.text);
    } finally {
      setLoadingRw(false);
    }
  };

  const startFeynman = () => {
    navigate(`${ROUTES.admin.knowledgeVaultFeynmanStudy}/${vaultItemId}`);
  };

  const sendFeynman = async () => {
    if (!feynmanInput.trim()) return;
    const next = [...feynmanLog, { role: 'user', content: feynmanInput.trim() }];
    setFeynmanLog(next);
    setFeynmanInput('');
    setLoadingF(true);
    try {
      const res = await vaultPrimitivesService.feynmanRespond(vaultItemId, next);
      if (res.success && res.data) setFeynmanOut(res.data as Record<string, unknown>);
    } finally {
      setLoadingF(false);
    }
  };

  const runDevils = async () => {
    setLoadingD(true);
    try {
      const res = await vaultPrimitivesService.devilsAdvocate(vaultItemId);
      if (res.success && res.data) setDevils(res.data as Record<string, unknown>);
    } finally {
      setLoadingD(false);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-6 bg-gray-50/50 dark:bg-gray-900/30">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Wand2 className="w-4 h-4" />
        Vault AI (read-only overlays)
      </h3>

      <div className="space-y-2">
        <p className="text-xs text-gray-500">Explain like I&apos;m…</p>
        <div className="flex flex-wrap gap-2">
          {(['expert', 'beginner', 'analogy'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-2 py-1 text-xs rounded-lg capitalize ${
                mode === m ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              {m}
            </button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => void runRewrite()}
            disabled={loadingRw}
          >
            Rewrite preview
          </Button>
        </div>
        {rewrite && (
          <pre className="text-xs whitespace-pre-wrap bg-white dark:bg-gray-800 p-3 rounded-lg max-h-40 overflow-auto border border-gray-200 dark:border-gray-600">
            {rewrite}
          </pre>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <FlaskConical className="w-3 h-3" /> Feynman coach
        </p>
        <Button type="button" size="sm" variant="secondary" onClick={startFeynman}>
          Feynman mode (split screen)
        </Button>
        <div className="text-xs space-y-1 max-h-28 overflow-auto">
          {feynmanLog.map((m, i) => (
            <p key={i} className={m.role === 'user' ? 'text-blue-700 dark:text-blue-300' : ''}>
              <strong>{m.role}:</strong> {m.content}
            </p>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={feynmanInput}
            onChange={(e) => setFeynmanInput(e.target.value)}
            placeholder="Your explanation…"
            className="flex-1 text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
          <Button type="button" size="sm" onClick={() => void sendFeynman()} disabled={loadingF}>
            Send
          </Button>
        </div>
        {feynmanOut && (
          <pre className="text-xs bg-amber-50 dark:bg-amber-900/20 p-2 rounded max-h-32 overflow-auto">
            {JSON.stringify(feynmanOut, null, 2)}
          </pre>
        )}
      </div>

      <div className="space-y-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => void runDevils()}
          disabled={loadingD}
          className="inline-flex items-center gap-2"
        >
          <MessageCircleWarning className="w-4 h-4" />
          Devil&apos;s advocate
        </Button>
        {devils && (
          <pre className="text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded max-h-40 overflow-auto">
            {JSON.stringify(devils, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
