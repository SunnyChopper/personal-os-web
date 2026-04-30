import { useState } from 'react';
import { Sparkles, Wand2, X, Check, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { llmService } from '@/services/llm.service';
import { llmConfig } from '@/lib/llm';
import type { Project, Task, CreateTaskInput } from '@/types/growth-system';
import type { ProjectHealthOutput, ProjectTaskGenOutput, ProjectRiskOutput } from '@/types/llm';
import Button from '@/components/atoms/Button';
import { AIThinkingIndicator } from '@/components/atoms/AIThinkingIndicator';

type AssistMode = 'health' | 'generate' | 'risks';

interface AIProjectAssistPanelProps {
  mode: AssistMode;
  project: Project;
  tasks: Task[];
  onClose: () => void;
  onCreateTasks?: (tasks: CreateTaskInput[]) => void;
}

export function AIProjectAssistPanel({
  mode,
  project,
  tasks,
  onClose,
  onCreateTasks,
}: AIProjectAssistPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [healthResult, setHealthResult] = useState<ProjectHealthOutput | null>(null);
  const [tasksResult, setTasksResult] = useState<ProjectTaskGenOutput | null>(null);
  const [risksResult, setRisksResult] = useState<ProjectRiskOutput | null>(null);

  const isConfigured = llmConfig.isConfigured();

  const handleAnalyzeHealth = async () => {
    setIsLoading(true);
    setError(null);

    const response = await llmService.analyzeProjectHealth(project, tasks);

    if (response.success && response.data) {
      setHealthResult(response.data);
    } else {
      setError(response.error || 'Failed to analyze project health');
    }
    setIsLoading(false);
  };

  const handleGenerateTasks = async () => {
    setIsLoading(true);
    setError(null);

    const response = await llmService.generateProjectTasks(project, tasks);

    if (response.success && response.data) {
      setTasksResult(response.data);
    } else {
      setError(response.error || 'Failed to generate tasks');
    }
    setIsLoading(false);
  };

  const handleIdentifyRisks = async () => {
    setIsLoading(true);
    setError(null);

    const response = await llmService.identifyProjectRisks(project, tasks);

    if (response.success && response.data) {
      setRisksResult(response.data);
    } else {
      setError(response.error || 'Failed to identify risks');
    }
    setIsLoading(false);
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'health':
        return 'Project Health Analysis';
      case 'generate':
        return 'Generate Tasks';
      case 'risks':
        return 'Risk Assessment';
    }
  };

  const getModeDescription = () => {
    switch (mode) {
      case 'health':
        return 'AI will analyze your project health based on task progress and status.';
      case 'generate':
        return 'AI will suggest additional tasks needed to complete this project.';
      case 'risks':
        return 'AI will identify potential risks and blockers for this project.';
    }
  };

  const handleInvoke = () => {
    switch (mode) {
      case 'health':
        handleAnalyzeHealth();
        break;
      case 'generate':
        handleGenerateTasks();
        break;
      case 'risks':
        handleIdentifyRisks();
        break;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 70) return 'text-green-600 dark:text-green-400';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getRiskColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'medium':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
    }
  };

  if (!isConfigured) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              AI Not Configured
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Go to Settings to configure your LLM connection.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-3 text-sm text-amber-700 dark:text-amber-300 hover:underline"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span className="font-medium text-gray-900 dark:text-white">{getModeTitle()}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-amber-200/50 dark:hover:bg-amber-800/50 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{getModeDescription()}</p>

      {!isLoading && !error && !healthResult && !tasksResult && !risksResult && (
        <Button
          onClick={handleInvoke}
          variant="primary"
          size="sm"
          className="bg-amber-600 hover:bg-amber-700"
        >
          <Wand2 className="w-4 h-4 mr-1" />
          Analyze
        </Button>
      )}

      {isLoading && (
        <div className="py-4">
          <AIThinkingIndicator message="Analyzing project..." />
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {healthResult && (
        <div className="mt-4 space-y-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Health Score
              </span>
              <span className={`text-3xl font-bold ${getHealthColor(healthResult.healthScore)}`}>
                {healthResult.healthScore}%
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{healthResult.summary}</p>
          </div>

          {healthResult.issues.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">Issues</span>
              {healthResult.issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-3 rounded-lg border ${
                    issue.severity === 'critical'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : issue.severity === 'warning'
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {issue.severity === 'critical' ? (
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    ) : issue.severity === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {issue.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{issue.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {healthResult.recommendations.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Recommendations
              </span>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {healthResult.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tasksResult && (
        <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-700">
          <span className="text-sm font-medium text-gray-900 dark:text-white">Suggested Tasks</span>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{tasksResult.reasoning}</p>

          <div className="space-y-2">
            {tasksResult.suggestedTasks.map((task, i) => (
              <div key={i} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <p className="font-medium text-gray-900 dark:text-white">{task.title}</p>
                {task.description && <p className="text-sm text-gray-500">{task.description}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {task.priority} | {task.size ? `${task.size}pts` : 'Points TBD'}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => {
                onCreateTasks?.(tasksResult.suggestedTasks);
                onClose();
              }}
              variant="primary"
              size="sm"
            >
              <Check className="w-4 h-4 mr-1" />
              Create All Tasks
            </Button>
          </div>
        </div>
      )}

      {risksResult && (
        <div className="mt-4 space-y-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Overall Risk Level
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(risksResult.overallRiskLevel)}`}
              >
                {risksResult.overallRiskLevel.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{risksResult.summary}</p>
          </div>

          {risksResult.risks.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Identified Risks
              </span>
              {risksResult.risks.map((risk, i) => (
                <div key={i} className={`p-3 rounded-lg border ${getRiskColor(risk.severity)}`}>
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium">{risk.description}</p>
                    <span className="text-xs uppercase">{risk.severity}</span>
                  </div>
                  <p className="text-sm mt-1 opacity-80">
                    <strong>Mitigation:</strong> {risk.mitigation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
