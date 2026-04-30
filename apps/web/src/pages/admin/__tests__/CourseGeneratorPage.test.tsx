import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CourseGeneratorPage from '@/pages/admin/CourseGeneratorPage';

vi.mock('@/services/knowledge-vault/vault-primitives.service', () => ({
  vaultPrimitivesService: {
    jitSearch: vi.fn().mockResolvedValue({ success: true, data: { hits: [] } }),
  },
}));

vi.mock('@/services/knowledge-vault', () => ({
  aiCourseGeneratorService: {
    generatePreAssessment: vi.fn(),
    generateCourseSkeleton: vi.fn(),
    createCourseFromSkeleton: vi.fn(),
    generateLessonContent: vi.fn(),
    cancelInFlightCourseSkeleton: vi.fn(),
  },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <CourseGeneratorPage />
    </MemoryRouter>
  );
}

describe('CourseGeneratorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows labeled wizard steps', () => {
    renderPage();
    const nav = screen.getByRole('navigation', { name: 'Course creation steps' });
    expect(nav).toBeInTheDocument();
    const inNav = within(nav);
    expect(inNav.getByText('Choose topic')).toBeInTheDocument();
    expect(inNav.getByText('Take quiz')).toBeInTheDocument();
    expect(inNav.getByText('Create course')).toBeInTheDocument();
  });

  it('hides header back control on the first step', () => {
    renderPage();
    expect(screen.queryByRole('button', { name: 'Back to choose topic' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back to courses list' })).not.toBeInTheDocument();
  });
});
