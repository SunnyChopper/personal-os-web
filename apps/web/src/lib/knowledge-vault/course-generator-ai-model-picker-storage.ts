import type { BrainstormModelPickerValue } from '@/lib/assistant/brainstorm-model-picker';

const STORAGE_KEY = 'course-generator-ai-model-picker';

export function loadCourseGeneratorAIModelPicker(): BrainstormModelPickerValue | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BrainstormModelPickerValue;
    if (parsed.mode !== 'auto' && parsed.mode !== 'manual') return null;
    if (typeof parsed.manualCatalogModelId !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCourseGeneratorAIModelPicker(value: BrainstormModelPickerValue): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore quota / private mode
  }
}
