import type { CareerResumeExportFormat } from '@/types/api/career.types';

const FORMATS: { id: CareerResumeExportFormat; label: string }[] = [
  { id: 'pdf', label: 'PDF' },
  { id: 'docx', label: 'DOCX' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'plainText', label: 'ATS text' },
];

type Props = {
  resumeId: string | null;
  templateId?: string | null;
  busyFormat?: CareerResumeExportFormat | null;
  /** When false, provenance/quality blocked export until draft is fixed. */
  exportReady?: boolean;
  onExport: (format: CareerResumeExportFormat) => void;
};

export function ResumeExportButtons({ resumeId, busyFormat, exportReady = true, onExport }: Props) {
  const disabled = !resumeId || exportReady === false;
  return (
    <div className="flex flex-wrap gap-2">
      {FORMATS.map((f) => (
        <button
          key={f.id}
          type="button"
          disabled={disabled || busyFormat === f.id}
          className="text-xs px-2.5 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
          onClick={() => onExport(f.id)}
        >
          {busyFormat === f.id ? '…' : f.label}
        </button>
      ))}
    </div>
  );
}
