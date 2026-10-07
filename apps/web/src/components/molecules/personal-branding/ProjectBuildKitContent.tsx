import { useEffect, useRef, useState } from 'react';
import Button from '@/components/atoms/Button';
import MarkdownRenderer from '@/components/molecules/MarkdownRenderer';
import { pbFeedbackTextClassName } from '@/pages/admin/personal-branding/personal-branding-ui';
import type { BrandProjectBuildKit } from '@/types/api/personal-branding.dto';

const COPY_RESET_MS = 2000;

function CopyBlock({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  const scheduleReset = () => {
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = setTimeout(() => {
      setCopied(false);
      setFailed(false);
      resetTimeoutRef.current = null;
    }, COPY_RESET_MS);
  };

  const handleCopy = async () => {
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    setCopied(false);
    setFailed(false);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      scheduleReset();
    } catch {
      setFailed(true);
      scheduleReset();
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</h4>
        <Button type="button" variant="secondary" size="sm" onClick={() => void handleCopy()}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      {failed ? (
        <p role="alert" className={pbFeedbackTextClassName('danger')}>
          Couldn&apos;t copy
        </p>
      ) : null}
      <pre className="max-h-48 overflow-auto rounded-lg bg-gray-50 p-3 text-xs dark:bg-gray-900">
        {text}
      </pre>
    </div>
  );
}

export interface ProjectBuildKitContentProps {
  kit: BrandProjectBuildKit;
  className?: string;
}

export function ProjectBuildKitContent({ kit, className }: ProjectBuildKitContentProps) {
  return (
    <div className={className ?? 'space-y-6'}>
      <CopyBlock label="Setup prompt" text={kit.setupPrompt} />
      {kit.cursorSkills.map((skill) => (
        <CopyBlock key={skill.name} label={`Skill: ${skill.name}`} text={skill.skillMarkdown} />
      ))}
      {kit.modules
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((mod) => (
          <div
            key={mod.order}
            className="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700"
          >
            <h4 className="text-sm font-semibold">
              Module {mod.order}: {mod.name}
            </h4>
            <MarkdownRenderer content={mod.goal} />
            <CopyBlock label="Module prompt" text={mod.prompt} />
          </div>
        ))}
    </div>
  );
}
