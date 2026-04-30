import { useState } from 'react';
import { useKnowledgeVault } from '@/contexts/KnowledgeVault';
import { Plus, BookOpen, GraduationCap, Clock, Sparkles, Search } from 'lucide-react';
import Dialog from '@/components/molecules/Dialog';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';

export default function CoursesPage() {
  const { courses, loading } = useKnowledgeVault();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const navigate = useNavigate();

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCourseClick = (courseId: string) => {
    navigate(`${ROUTES.admin.knowledgeVaultCourses}/${courseId}`);
  };

  const difficultyColors = {
    beginner: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    intermediate: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    advanced: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    expert: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Learning Courses</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered personalized learning paths
          </p>
        </div>

        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
        >
          <Plus size={20} />
          <span>Create Course</span>
        </button>
      </div>

      <div className="relative">
        <Search
          size={20}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <GraduationCap size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'No courses found' : 'No courses yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery
              ? 'Try adjusting your search'
              : 'Create your first AI-powered learning course'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateDialog(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
            >
              <Sparkles size={20} />
              <span>Generate Course with AI</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              onClick={() => handleCourseClick(course.id)}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <GraduationCap size={24} className="text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                    {course.title}
                  </h3>
                  {course.isAiGenerated && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                      <Sparkles size={12} />
                      AI Generated
                    </span>
                  )}
                </div>
              </div>

              {course.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                  {course.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm mb-3">
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <BookOpen size={16} />
                  {course.topic}
                </span>
                {course.estimatedHours && (
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Clock size={16} />
                    {course.estimatedHours}h
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${difficultyColors[course.difficulty]}`}
                >
                  {course.difficulty}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(course.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        title="Create New Course"
      >
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Choose how you want to create your course:
          </p>

          <div className="space-y-3">
            <button
              onClick={() => {
                setShowCreateDialog(false);
                navigate(`${ROUTES.admin.knowledgeVaultCourses}/new`);
              }}
              className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition"
            >
              <Sparkles size={24} />
              <div className="text-left">
                <div className="font-semibold">AI-Powered Course Generator</div>
                <div className="text-sm opacity-90">
                  Take a quick assessment and let AI create a personalized course
                </div>
              </div>
            </button>

            <button
              className="w-full flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition"
              disabled
            >
              <BookOpen size={24} />
              <div className="text-left">
                <div className="font-semibold">Manual Course Creation</div>
                <div className="text-sm opacity-70">
                  Create a course structure manually (Coming Soon)
                </div>
              </div>
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
