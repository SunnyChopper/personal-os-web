import { useState } from 'react';
import { Sparkles, Wand2, X, Check, AlertCircle } from 'lucide-react';
import { llmService } from '@/services/llm.service';
import { llmConfig } from '@/lib/llm';
import type { Project, Task, CreateTaskInput } from '@/types/growth-system';
import type {
  GeneratedProjectTask,
  ProjectHealthOutput,
  ProjectRiskOutput,
  ProjectTaskGenOutput,
} from '@/types/llm';
import Button from '@/components/atoms/Button';
import { AIThinkingIndicator } from '@/components/atoms/AIThinkingIndicator';

function riskSeverityFromScore(score: number): 'low' | 'medium' | 'high' {
  if (score <= 3) return 'low';
  if (score <= 6) return 'medium';
  return 'high';
}

function generatedTaskToCreateInput(task: GeneratedProjectTask, project: Project): CreateTaskInput {
  return {
    title: task.title,
    description: task.description,
    priority: task.priority,
    area: project.area,
    projectIds: [project.id],
    size: Math.max(1, Math.round(task.estimatedHours)),
    notes: `Category: ${task.category}`,
  };
}

function formatOverallHealthLabel(overallHealth: ProjectHealthOutput['overallHealth']): string {
  switch (overallHealth) {
    case 'atRisk':
      return 'At risk';
    default:
      return overallHealth.charAt(0).toUpperCase() + overallHealth.slice(1);
  }
}

function overallHealthBadgeClass(overallHealth: ProjectHealthOutput['overallHealth']): string {
  switch (overallHealth) {
    case 'excellent':
    case 'good':
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
    case 'atRisk':
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200';
    case 'critical':
    default:
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
  }
}

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
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'medium':
      case 'moderate':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
    }
  };

  const factorCardClass = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
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
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Health score
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${overallHealthBadgeClass(
                    healthResult.overallHealth
                  )}`}
                >
                  {formatOverallHealthLabel(healthResult.overallHealth)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  Trajectory: {healthResult.trajectory}
                </span>
              </div>
              <span className={`text-3xl font-bold ${getHealthColor(healthResult.healthScore)}`}>
                {healthResult.healthScore}%
              </span>
            </div>
          </div>

          {healthResult.healthFactors.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Health factors
              </span>
              {healthResult.healthFactors.map((factor, i) => (
                <div key={i} className={`p-3 rounded-lg border ${factorCardClass(factor.status)}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {factor.factorName}
                    </p>
                    <span className="text-xs uppercase text-gray-500 dark:text-gray-400">
                      {factor.status} · impact {factor.impact}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {factor.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {healthResult.positiveIndicators.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                What&apos;s going well
              </span>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {healthResult.positiveIndicators.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {healthResult.concerns.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">Concerns</span>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {healthResult.concerns.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {healthResult.priorityActions.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Priority actions
              </span>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {healthResult.priorityActions.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tasksResult && (
        <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-700 space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Suggested tasks
            </span>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {tasksResult.recommendedStart}
            </p>
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Est. total hours: {tasksResult.estimatedTotalHours}</span>
              <span>Critical path (indices): {tasksResult.criticalPath.join(', ') || '—'}</span>
            </div>
          </div>

          {tasksResult.executionPhases.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tasksResult.executionPhases.map((phase, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-full text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200"
                >
                  {phase}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-2">
            {tasksResult.tasks.map((task, i) => (
              <div key={i} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <p className="font-medium text-gray-900 dark:text-white">{task.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{task.description}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {task.priority} · ~{task.estimatedHours}h · {task.category}
                  {task.dependencies?.length ? ` · deps: [${task.dependencies.join(', ')}]` : ''}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => {
                const inputs = tasksResult.tasks.map((t) => generatedTaskToCreateInput(t, project));
                onCreateTasks?.(inputs);
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
                Overall risk level
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(risksResult.overallRiskLevel)}`}
              >
                {risksResult.overallRiskLevel.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {risksResult.topPriorityRisk}
            </p>
          </div>

          {risksResult.risks.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Identified risks
              </span>
              {risksResult.risks.map((risk, i) => {
                const severity = riskSeverityFromScore(risk.riskScore);
                return (
                  <div key={i} className={`p-3 rounded-lg border ${getRiskColor(severity)}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {risk.riskTitle}
                      </p>
                      <span className="text-xs uppercase whitespace-nowrap">
                        score {risk.riskScore} · {severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {risk.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs uppercase text-gray-500 dark:text-gray-400">
                      <span>{risk.category}</span>
                      <span>
                        P×I: {risk.probability} / {risk.impact}
                      </span>
                    </div>
                    <ul className="list-disc list-inside text-sm mt-2 text-gray-600 dark:text-gray-400 space-y-1">
                      {risk.mitigationStrategies.map((s, j) => (
                        <li key={j}>{s}</li>
                      ))}
                    </ul>
                    <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
                      <strong>Contingency:</strong> {risk.contingencyPlan}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {risksResult.riskMitigationRoadmap.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Mitigation roadmap
              </span>
              <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {risksResult.riskMitigationRoadmap.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
