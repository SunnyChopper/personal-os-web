import {
  loadCourseGeneratorAIModelPicker,
  saveCourseGeneratorAIModelPicker,
} from '@/lib/knowledge-vault/course-generator-ai-model-picker-storage';
import { usePersistedBrainstormModelPicker } from '@/hooks/knowledge-vault/usePersistedBrainstormModelPicker';

const courseGeneratorPickerStorage = {
  load: loadCourseGeneratorAIModelPicker,
  save: saveCourseGeneratorAIModelPicker,
};

export function useCourseGeneratorAIModelPicker() {
  return usePersistedBrainstormModelPicker(courseGeneratorPickerStorage);
}
