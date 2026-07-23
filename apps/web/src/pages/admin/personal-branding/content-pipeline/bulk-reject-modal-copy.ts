export function getBulkRejectModalCopy(variantCount: number): {
  title: string;
  description: string;
  submitLabel: string;
} {
  const isBulk = variantCount > 1;
  return {
    title: isBulk ? `Reject ${variantCount} variants` : 'Reject variant',
    description: isBulk
      ? `Share one critique for all ${variantCount} selected variants. This feeds future regeneration prompts.`
      : 'What fell flat? This feeds future regeneration prompts.',
    submitLabel: isBulk ? 'Reject all' : 'Submit rejection',
  };
}
