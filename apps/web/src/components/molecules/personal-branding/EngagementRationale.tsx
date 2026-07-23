export interface EngagementRationaleProps {
  lead?: string | null;
  bullets?: string[] | null;
  className?: string;
  leadClassName?: string;
  bulletClassName?: string;
}

export default function EngagementRationale({
  lead,
  bullets,
  className,
  leadClassName = 'text-sm text-gray-600 dark:text-gray-300',
  bulletClassName = 'text-sm text-gray-500 dark:text-gray-400',
}: EngagementRationaleProps) {
  const leadText = lead?.trim();
  const bulletItems = (bullets ?? []).map((item) => item.trim()).filter(Boolean);

  if (!leadText && bulletItems.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {leadText ? <p className={leadClassName}>{leadText}</p> : null}
      {bulletItems.length > 0 ? (
        <ul className={`mt-1.5 list-disc space-y-1 pl-5 ${bulletClassName}`}>
          {bulletItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
