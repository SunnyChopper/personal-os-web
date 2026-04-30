import { useCallback, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import { Save } from 'lucide-react';
import { authService } from '@/lib/auth/auth.service';
import { postmanService } from '@/services/tools/postman.service';
import { cn } from '@/lib/utils';
import { getResolvedApiBaseUrl } from '@/lib/vite-public-env';

const API_BASE = getResolvedApiBaseUrl();

export default function PostmanPage() {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('https://httpbin.org/get');
  const [headersText, setHeadersText] = useState('{}');
  const [bodyText, setBodyText] = useState('');
  const [status, setStatus] = useState<number | null>(null);
  const [respHeaders, setRespHeaders] = useState<Record<string, string>>({});
  const [respBody, setRespBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('API capture');
  const [msg, setMsg] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    let headers: Record<string, string> = {};
    try {
      headers = JSON.parse(headersText || '{}') as Record<string, string>;
    } catch {
      setMsg('Headers must be valid JSON object');
      setLoading(false);
      return;
    }
    const reqInit: RequestInit = { method, headers: { ...headers } };
    if (['POST', 'PUT', 'PATCH'].includes(method) && bodyText.trim()) {
      (reqInit.headers as Record<string, string>)['Content-Type'] =
        (reqInit.headers as Record<string, string>)['Content-Type'] || 'application/json';
      reqInit.body = bodyText;
    }
    try {
      const res = await fetch(url, reqInit);
      setStatus(res.status);
      const rh: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        rh[k] = v;
      });
      setRespHeaders(rh);
      const text = await res.text();
      setRespBody(text);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Request failed (CORS or network)');
      setRespBody('');
    } finally {
      setLoading(false);
    }
  }, [bodyText, headersText, method, url]);

  const highlighted = Prism.highlight(respBody || '', Prism.languages.json, 'json');

  const saveVault = async (withResponse: boolean) => {
    setMsg(null);
    try {
      let h: Record<string, string> = {};
      try {
        h = JSON.parse(headersText || '{}') as Record<string, string>;
      } catch {
        setMsg('Headers JSON invalid');
        return;
      }
      await postmanService.saveToVault({
        title,
        request: { method, url, headers: h, body: bodyText || null },
        response: withResponse
          ? { status, headers: respHeaders, body: respBody }
          : undefined,
      });
      setMsg('Saved to Knowledge Vault');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Save failed');
    }
  };

  return (
    <div className="grid min-h-[560px] gap-4 lg:grid-cols-3">
      <div className="space-y-2 lg:col-span-1">
        <p className="text-xs text-amber-800 dark:text-amber-200">
          Runs in your browser. Cross-origin APIs may fail due to CORS — use a CORS-enabled endpoint
          or your own API.
        </p>
        <input
          className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900"
          placeholder="Save title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex gap-2">
          <select
            className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input
            className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 font-mono text-xs dark:border-gray-600 dark:bg-gray-900"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <textarea
          className="h-24 w-full rounded border border-gray-300 p-2 font-mono text-xs dark:border-gray-600 dark:bg-gray-950"
          placeholder='Headers JSON e.g. {"Authorization":"Bearer ..."}'
          value={headersText}
          onChange={(e) => setHeadersText(e.target.value)}
        />
        <textarea
          className="h-32 w-full rounded border border-gray-300 p-2 font-mono text-xs dark:border-gray-600 dark:bg-gray-950"
          placeholder="Body (JSON)"
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
        />
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Sending…' : 'Send'}
        </button>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void saveVault(false)}
            className="rounded border border-gray-300 py-1.5 text-sm dark:border-gray-600"
          >
            <Save className="mr-1 inline h-4 w-4" />
            Save request to Vault
          </button>
          <button
            type="button"
            onClick={() => void saveVault(true)}
            className="rounded border border-gray-300 py-1.5 text-sm dark:border-gray-600"
          >
            Save request + response
          </button>
        </div>
        {msg && <p className="text-sm text-green-700 dark:text-green-400">{msg}</p>}
        <p className="text-[10px] text-gray-500">API base (for reference): {API_BASE || '(same origin)'}</p>
        <p className="text-[10px] text-gray-500">
          Auth token present: {authService.getAccessToken() ? 'yes' : 'no'}
        </p>
      </div>
      <div className="space-y-2 lg:col-span-2">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Status: {status ?? '—'} {status ? '' : ''}
        </div>
        <pre className="max-h-32 overflow-auto rounded bg-gray-100 p-2 text-xs dark:bg-gray-900">
          {JSON.stringify(respHeaders, null, 2)}
        </pre>
        <div
          className={cn('min-h-[240px] overflow-auto rounded border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-950')}
        >
          {respBody ? (
            <code
              className="language-json text-xs"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          ) : (
            <span className="text-sm text-gray-500">Response body</span>
          )}
        </div>
      </div>
    </div>
  );
}
