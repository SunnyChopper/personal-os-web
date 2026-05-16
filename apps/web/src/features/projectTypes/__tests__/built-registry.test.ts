import { describe, expect, it } from 'vitest';
import {
  getProjectTypeDescriptor,
  PROJECT_TYPE_REGISTRY,
} from '@/features/projectTypes/built-registry';

describe('project type built-registry', () => {
  it('registers General and SoftwareDevelopment', () => {
    expect(PROJECT_TYPE_REGISTRY.General.id).toBe('General');
    expect(PROJECT_TYPE_REGISTRY.SoftwareDevelopment.id).toBe('SoftwareDevelopment');
  });

  it('getProjectTypeDescriptor(undefined) falls back to General', () => {
    expect(getProjectTypeDescriptor(undefined).id).toBe('General');
  });
});
