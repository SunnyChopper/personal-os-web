import type { CookedMicroStep } from '@/types/planner';

export function RescueMicroStepList({ steps }: { steps: CookedMicroStep[] }) {
  return (
    <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-800 dark:text-gray-200">
      {steps.map((s, i) => (
        <li key={i}>
          <span className="font-medium">{s.label}</span>
          <span className="text-gray-500 dark:text-gray-400"> ({s.durationMinutes}m)</span>
          <p className="text-xs text-gray-600 dark:text-gray-400">{s.reason}</p>
        </li>
      ))}
    </ol>
  );
}
