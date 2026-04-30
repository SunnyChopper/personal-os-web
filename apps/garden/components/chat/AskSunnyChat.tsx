'use client';

import { useState } from 'react';

export function AskSunnyChat() {
  const [q, setQ] = useState('');
  const [a, setA] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!q.trim()) return;
    setLoading(true);
    setA(null);
    try {
      const res = await fetch('/api/ask-sunny', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Request failed');
      setA(data.answer as string);
    } catch (e) {
      setA(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg bg-white p-4">
      <textarea
        className="h-24 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="Ask about public notes, changelog, artifacts…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        maxLength={2000}
      />
      <button
        type="button"
        onClick={send}
        disabled={loading}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-40"
      >
        {loading ? 'Thinking…' : 'Ask'}
      </button>
      {a ? <p className="whitespace-pre-wrap text-sm text-gray-700">{a}</p> : null}
    </div>
  );
}
