import type { BuildKitPatchOperation } from '@/types/api/personal-branding.dto';

export function isProposalStale(
  baseGeneratedAt: string,
  generatedAt: string | null | undefined
): boolean {
  return baseGeneratedAt !== generatedAt;
}

export function describeRevisionOperation(operation: BuildKitPatchOperation): string {
  switch (operation.op) {
    case 'updateSkill':
      return `Update skill ${operation.name}`;
    case 'removeSkill':
      return `Remove skill ${operation.name}`;
    case 'addSkill':
      return `Add skill ${operation.name}`;
    case 'updateModule':
      return `Update module ${operation.order}`;
    case 'removeModule':
      return `Remove module ${operation.order}`;
    case 'addModule':
      return `Add module ${operation.order}: ${operation.name}`;
    case 'setSetupPrompt':
      return 'Replace setup prompt';
    default: {
      const unreachable: never = operation;
      return unreachable;
    }
  }
}

/** Full replacement text for the confirm review. Null when the op only removes. */
export function revisionOperationBody(operation: BuildKitPatchOperation): string | null {
  switch (operation.op) {
    case 'updateSkill': {
      const parts = [operation.description, operation.skillMarkdown].filter(
        (part): part is string => Boolean(part)
      );
      return parts.length > 0 ? parts.join('\n\n') : null;
    }
    case 'addSkill':
      return operation.skillMarkdown;
    case 'updateModule': {
      const parts = [
        operation.name,
        operation.goal,
        operation.prompt,
        operation.dependsOn?.length ? `Depends on ${operation.dependsOn.join(', ')}` : null,
      ].filter((part): part is string => Boolean(part));
      return parts.length > 0 ? parts.join('\n\n') : null;
    }
    case 'addModule':
      return [operation.goal, operation.prompt].filter(Boolean).join('\n\n');
    case 'setSetupPrompt':
      return operation.setupPrompt;
    case 'removeSkill':
    case 'removeModule':
      return null;
    default: {
      const unreachable: never = operation;
      return unreachable;
    }
  }
}
