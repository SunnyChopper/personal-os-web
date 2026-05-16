import { type ReactNode } from 'react';

export interface TooltipRow {
  term: ReactNode;
  description: ReactNode;
}

interface MetricBreakdownTooltipProps {
  intro?: ReactNode;
  rows: TooltipRow[];
  result?: ReactNode;
}

/** Structured rows for metric help tooltips (definition list style). */
export function MetricBreakdownTooltip({ intro, rows, result }: MetricBreakdownTooltipProps) {
  return (
    <div className="space-y-2">
      {intro ? <div className="opacity-95">{intro}</div> : null}
      <dl className="space-y-1.5">
        {rows.map((row, i) => (
          <div key={i} className="grid gap-0.5">
            <dt className="font-semibold opacity-95">{row.term}</dt>
            <dd className="pl-0 opacity-85 [&>code]:rounded [&>code]:bg-white/10 [&>code]:px-1">
              {row.description}
            </dd>
          </div>
        ))}
      </dl>
      {result ? (
        <div className="border-t border-white/15 pt-2 mt-2 font-semibold">{result}</div>
      ) : null}
    </div>
  );
}
