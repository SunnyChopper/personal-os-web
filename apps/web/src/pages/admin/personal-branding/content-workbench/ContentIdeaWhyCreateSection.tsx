interface ContentIdeaWhyCreateSectionProps {
  rationale: string;
}

export function ContentIdeaWhyCreateSection({ rationale }: ContentIdeaWhyCreateSectionProps) {
  return (
    <div className="mt-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Why create this
      </p>
      <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{rationale}</p>
    </div>
  );
}
