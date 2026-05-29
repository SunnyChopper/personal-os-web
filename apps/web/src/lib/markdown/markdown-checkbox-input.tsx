import type { ComponentProps } from 'react';
import { useTaskListToggleContext } from '@/lib/markdown/use-task-list-toggle-context';

export function MarkdownCheckboxInput({
  type,
  checked,
  disabled,
  readOnly,
  ...props
}: ComponentProps<'input'>) {
  const toggleContext = useTaskListToggleContext();

  if (type !== 'checkbox') {
    return (
      <input type={type} checked={checked} disabled={disabled} readOnly={readOnly} {...props} />
    );
  }

  const onToggle = toggleContext?.onToggle;
  if (!onToggle) {
    return <input type="checkbox" checked={checked} disabled={disabled} readOnly {...props} />;
  }

  const index = toggleContext.allocateIndex();

  return (
    <input
      {...props}
      type="checkbox"
      checked={checked}
      disabled={false}
      readOnly={false}
      onChange={(event) => {
        event.stopPropagation();
        onToggle(index, event.target.checked);
      }}
      onClick={(event) => {
        event.stopPropagation();
      }}
    />
  );
}
