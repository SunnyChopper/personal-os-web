import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  SuggestVariantImprovementsInput,
  VariantImprovementSuggestion,
} from '@/types/api/personal-branding.dto';

export function useVariantImprovementSuggestions(variantId: string) {
  const [suggestions, setSuggestions] = useState<VariantImprovementSuggestion[] | null>(null);

  useEffect(() => {
    setSuggestions(null);
  }, [variantId]);

  const suggestMutation = useMutation({
    mutationFn: (body?: SuggestVariantImprovementsInput) =>
      personalBrandingService.suggestVariantImprovements(variantId, body),
    onSuccess: (data) => {
      setSuggestions(data.suggestions);
    },
  });

  const dismiss = () => setSuggestions(null);

  return {
    suggestions,
    suggestMutation,
    dismiss,
  };
}
