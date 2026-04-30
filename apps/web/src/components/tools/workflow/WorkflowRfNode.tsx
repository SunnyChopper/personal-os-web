import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';

export type WorkflowRfData = {
  ntype: string;
  label: string;
  config: Record<string, unknown>;
  runStatus?: 'success' | 'error' | 'pending';
};

export default function WorkflowRfNode({ data, selected }: NodeProps) {
  const d = data as WorkflowRfData;
  const isTrigger = d.ntype.startsWith('trigger.');
  const isCondition = d.ntype === 'action.condition';
  return (
    <div
      className={cn(
        'min-w-[180px] max-w-[220px] rounded-lg border-2 px-3 py-2 text-xs shadow-sm',
        isTrigger && 'border-blue-400 bg-blue-50 dark:bg-blue-950',
        !isTrigger && !isCondition && 'border-violet-400 bg-violet-50 dark:bg-violet-950',
        isCondition && 'border-amber-400 bg-amber-50 dark:bg-amber-950',
        selected && 'ring-2 ring-amber-400',
        d.runStatus === 'success' && 'border-green-500',
        d.runStatus === 'error' && 'border-red-500',
        d.runStatus === 'pending' && 'animate-pulse border-amber-400'
      )}
    >
      {!isTrigger && (
        <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      )}
      <div className="font-mono text-[10px] uppercase text-gray-500">{d.ntype}</div>
      <div className="font-medium text-gray-900 dark:text-gray-100">{d.label}</div>
      {isCondition ? (
        <div className="relative mt-2 h-6">
          <span className="absolute left-0 top-0 text-[10px] text-green-700">true</span>
          <span className="absolute right-0 top-0 text-[10px] text-red-700">false</span>
          <Handle
            id="true"
            type="source"
            position={Position.Bottom}
            className="!bg-green-600"
            style={{ left: '28%' }}
          />
          <Handle
            id="false"
            type="source"
            position={Position.Bottom}
            className="!bg-red-500"
            style={{ left: '72%' }}
          />
        </div>
      ) : (
        <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
      )}
    </div>
  );
}
