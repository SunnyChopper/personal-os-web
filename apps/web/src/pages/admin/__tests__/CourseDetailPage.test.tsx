import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CourseDetailPage from '@/pages/admin/CourseDetailPage';
import type { CourseWithDetails } from '@/services/knowledge-vault/courses.service';

const mockGetCourseWithModulesAndLessons = vi.fn();
const mockMarkAccessed = vi.fn();
const mockGenerateLessonContent = vi.fn();
const mockShowToast = vi.fn();
const mockResolveApiModel = vi.fn(() => 'anthropic:claude-sonnet-4-6');

vi.mock('@/services/knowledge-vault', () => ({
  coursesService: {
    getCourseWithModulesAndLessons: (...args: unknown[]) =>
      mockGetCourseWithModulesAndLessons(...args),
    getById: vi.fn(),
    update: vi.fn(),
  },
  vaultItemsService: {
    markAccessed: (...args: unknown[]) => mockMarkAccessed(...args),
    markLessonComplete: vi.fn(),
  },
  aiCourseGeneratorService: {
    generateLessonContent: (...args: unknown[]) => mockGenerateLessonContent(...args),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
    dismissToast: vi.fn(),
    clearToasts: vi.fn(),
    ToastContainer: () => null,
  }),
}));

vi.mock('@/hooks/knowledge-vault/useCourseGeneratorAIModelPicker', () => ({
  useCourseGeneratorAIModelPicker: () => ({
    catalog: {
      models: [
        {
          id: 'anthropic:claude-sonnet-4-6',
          apiModelId: 'claude-sonnet-4-6',
          label: 'Claude Sonnet 4.6',
          provider: 'anthropic',
          qualityScore: 9,
          speedScore: 7,
          costScore: 5,
        },
      ],
      defaults: { defaultReasoningModelId: 'anthropic:claude-sonnet-4-6' },
      providersConfigured: { anthropic: true },
    },
    isCatalogLoading: false,
    picker: { mode: 'manual', manualCatalogModelId: 'anthropic:claude-sonnet-4-6' },
    setPicker: vi.fn(),
    resolveApiModel: mockResolveApiModel,
  }),
}));

const courseData: CourseWithDetails = {
  course: {
    id: 'course-1',
    title: 'Linear Algebra for Machine Learning',
    description: 'Learn LA basics',
    topic: 'Math',
    difficulty: 'intermediate',
    estimatedHours: 5,
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    isAiGenerated: true,
  },
  modules: [
    {
      module: {
        id: 'mod-1',
        courseId: 'course-1',
        title: 'Module 1: Vectors and Scalars',
        description: null,
        moduleIndex: 0,
        userId: 'user-1',
        createdAt: '2026-01-01T00:00:00Z',
      },
      lessons: [
        {
          id: 'les-1',
          type: 'course_lesson',
          title: 'Scalars, Vectors, and Tensors',
          content: '# Intro',
          tags: [],
          area: 'Operations',
          status: 'draft',
          searchableText: 'Scalars',
          courseId: 'course-1',
          moduleId: 'mod-1',
          lessonIndex: 0,
          estimatedMinutes: 15,
          completedAt: null,
          aiGenerated: true,
          userId: 'user-1',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          lastAccessedAt: null,
        },
        {
          id: 'les-2',
          type: 'course_lesson',
          title: 'Vector Addition and Scalar Multiplication',
          content: null,
          tags: [],
          area: 'Operations',
          status: 'draft',
          searchableText: 'Vector Addition',
          courseId: 'course-1',
          moduleId: 'mod-1',
          lessonIndex: 1,
          estimatedMinutes: 15,
          completedAt: null,
          aiGenerated: true,
          userId: 'user-1',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          lastAccessedAt: null,
        },
      ],
    },
    {
      module: {
        id: 'mod-2',
        courseId: 'course-1',
        title: 'Module 2: Matrices and Basic Operations',
        description: null,
        moduleIndex: 1,
        userId: 'user-1',
        createdAt: '2026-01-01T00:00:00Z',
      },
      lessons: [
        {
          id: 'les-3',
          type: 'course_lesson',
          title: 'The Dot Product',
          content: null,
          tags: [],
          area: 'Operations',
          status: 'draft',
          searchableText: 'Dot Product',
          courseId: 'course-1',
          moduleId: 'mod-2',
          lessonIndex: 2,
          estimatedMinutes: 20,
          completedAt: null,
          aiGenerated: true,
          userId: 'user-1',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          lastAccessedAt: null,
        },
      ],
    },
  ],
};

function renderPage(lessonId = 'les-3') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/admin/knowledge-vault/courses/course-1/${lessonId}`]}>
        <Routes>
          <Route
            path="/admin/knowledge-vault/courses/:courseId/:lessonId"
            element={<CourseDetailPage />}
          />
          <Route path="/admin/knowledge-vault/courses/:courseId" element={<CourseDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('CourseDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCourseWithModulesAndLessons.mockResolvedValue({
      success: true,
      data: courseData,
      error: null,
    });
    mockMarkAccessed.mockResolvedValue({ success: true });
    mockGenerateLessonContent.mockResolvedValue({
      success: false,
      data: null,
      error: 'Claude API error: model not found',
    });
    mockResolveApiModel.mockReturnValue('anthropic:claude-sonnet-4-6');
  });

  it('deduplicates module headings', async () => {
    renderPage('les-1');
    expect(await screen.findByText('Module 1: Vectors and Scalars')).toBeInTheDocument();
    expect(screen.queryByText('Module 1: Module 1: Vectors and Scalars')).not.toBeInTheDocument();
  });

  it('shows generated and not generated badges in the sidebar', async () => {
    renderPage('les-1');
    expect(await screen.findByText('Generated')).toBeInTheDocument();
    expect(screen.getAllByText('Not generated').length).toBeGreaterThan(0);
  });

  it('locks generation for lessons with missing prerequisites', async () => {
    renderPage('les-3');
    expect(
      await screen.findByText(/Generate "Vector Addition and Scalar Multiplication" first\./)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Generate Lesson Content/i })
    ).not.toBeInTheDocument();
  });

  it('shows target time for ungenerated lessons', async () => {
    renderPage('les-2');
    expect(await screen.findByText(/Target Time: 15 min/)).toBeInTheDocument();
  });

  it('shows model picker for unlockable ungenerated lessons', async () => {
    renderPage('les-2');
    expect(await screen.findByText('AI model')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Lesson Content/i })).toBeInTheDocument();
  });

  it('passes selected model and shows toast when generation fails', async () => {
    const user = userEvent.setup();
    renderPage('les-2');
    const generateButton = await screen.findByRole('button', { name: /Generate Lesson Content/i });
    await user.click(generateButton);

    await waitFor(() => {
      expect(mockGenerateLessonContent).toHaveBeenCalledWith(
        expect.objectContaining({
          courseId: 'course-1',
          lessonId: 'les-2',
          model: 'anthropic:claude-sonnet-4-6',
        })
      );
    });

    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        title: 'Lesson could not be generated',
        message: 'Claude API error: model not found',
      })
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('Claude API error: model not found');
  });
});
