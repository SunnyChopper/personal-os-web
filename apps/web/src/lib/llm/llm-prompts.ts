import type { Area, SubCategory, Priority } from '@/types/growth-system';

const AREAS: Area[] = ['Health', 'Wealth', 'Love', 'Happiness', 'Operations', 'Day Job'];
const PRIORITIES: Priority[] = ['P1', 'P2', 'P3', 'P4'];

const SUBCATEGORIES: Record<Area, SubCategory[]> = {
  Health: ['Physical', 'Mental', 'Spiritual', 'Nutrition', 'Sleep', 'Exercise'],
  Wealth: ['Income', 'Expenses', 'Investments', 'Debt', 'Net Worth'],
  Love: ['Romantic', 'Family', 'Friends', 'Social'],
  Happiness: ['Joy', 'Gratitude', 'Purpose', 'Peace'],
  Operations: ['Productivity', 'Organization', 'Systems', 'Habits'],
  'Day Job': ['Career', 'Skills', 'Projects', 'Performance'],
};

export const SYSTEM_PROMPT = `You are an AI assistant specialized in personal productivity and task management. You help users organize their tasks, projects, and goals across six life areas: Health, Wealth, Love, Happiness, Operations, and Day Job.

Available Areas: ${AREAS.join(', ')}
Available Priorities: ${PRIORITIES.join(', ')} (P1 = highest urgency)

Subcategories by Area:
${Object.entries(SUBCATEGORIES)
  .map(([area, subs]) => `- ${area}: ${subs.join(', ')}`)
  .join('\n')}

Always respond with valid JSON matching the requested format. Be concise and actionable.`;

export function getParseTaskPrompt(text: string): string {
  return `Parse the following natural language input into a structured task. Extract the title, description, area, subcategory, priority, due date, and any other relevant fields.

Input: "${text}"

Respond with JSON in this exact format:
{
  "task": {
    "title": "extracted title",
    "description": "extracted description or null",
    "area": "one of: Health, Wealth, Love, Happiness, Operations, Day Job",
    "subCategory": "appropriate subcategory or null",
    "priority": "P1, P2, P3, or P4",
    "dueDate": "YYYY-MM-DD format or null",
    "scheduledDate": "YYYY-MM-DD format or null",
    "size": "Fibonacci story points (1,2,3,5,8,13,21) or null — not time"
  },
  "confidence": 0.0 to 1.0,
  "extractedEntities": ["list", "of", "key", "entities", "found"]
}`;
}

export function getTaskBreakdownPrompt(
  taskTitle: string,
  taskDescription: string | null,
  area: string
): string {
  return `Break down the following task into smaller, actionable subtasks:

Task: ${taskTitle}
${taskDescription ? `Description: ${taskDescription}` : ''}
Area: ${area}

Create 2-5 concrete subtasks that together complete the main task.

Respond with JSON in this exact format:
{
  "subtasks": [
    {
      "title": "subtask title",
      "description": "brief description",
      "area": "${area}",
      "priority": "P1-P4",
      "size": "Fibonacci story points (1,2,3,5,8,13,21) or null"
    }
  ],
  "reasoning": "brief explanation of the breakdown approach"
}`;
}

export function getBlockerResolutionPrompt(
  taskTitle: string,
  blockers: Array<{ id: string; title: string; status: string }>
): string {
  return `Suggest how to resolve blockers for this task:

Task: ${taskTitle}

Blockers:
${blockers.map((b) => `- [${b.id}] ${b.title} (Status: ${b.status})`).join('\n')}

Respond with JSON in this exact format:
{
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2"],
  "recommendedActions": [
    {
      "action": "specific action to take",
      "targetTaskId": "id of the blocker task",
      "reason": "why this helps"
    }
  ]
}`;
}

export function getPriorityAdvisorPrompt(
  taskTitle: string,
  taskDescription: string | null,
  currentPriority: string,
  otherTasks: Array<{ title: string; priority: string; dueDate: string | null }>
): string {
  return `Recommend the appropriate priority for this task given the context:

Task: ${taskTitle}
${taskDescription ? `Description: ${taskDescription}` : ''}
Current Priority: ${currentPriority}

Other active tasks:
${otherTasks.map((t) => `- ${t.title} (${t.priority}${t.dueDate ? `, due: ${t.dueDate}` : ''})`).join('\n')}

Respond with JSON in this exact format:
{
  "recommendedPriority": "P1, P2, P3, or P4",
  "reasoning": "explanation of the recommendation",
  "factors": ["factor 1", "factor 2", "factor 3"]
}`;
}

export function getEffortEstimationPrompt(
  taskTitle: string,
  taskDescription: string | null,
  similarTasks: Array<{ title: string; size: number | null }>
): string {
  return `Estimate Fibonacci story points for this task (relative complexity, not duration):

Task: ${taskTitle}
${taskDescription ? `Description: ${taskDescription}` : ''}

${similarTasks.length > 0 ? `Similar completed tasks for reference:\n${similarTasks.map((t) => `- ${t.title}: ${t.size ?? 'unknown'} pts`).join('\n')}` : ''}

Respond with JSON in this exact format:
{
  "storyPoints": one of 1, 2, 3, 5, 8, 13, 21,
  "confidence": "low" | "medium" | "high",
  "complexityFactors": ["factor 1", "factor 2"],
  "assumptions": ["assumption 1"]
}`;
}

export function getTaskCategorizationPrompt(title: string, description?: string): string {
  return `Categorize this task into the appropriate life area and subcategory:

Title: ${title}
${description ? `Description: ${description}` : ''}

Respond with JSON in this exact format:
{
  "area": "one of: Health, Wealth, Love, Happiness, Operations, DayJob",
  "subCategory": "appropriate subcategory or null",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation"
}`;
}

export function getDependencyDetectionPrompt(
  taskTitle: string,
  taskDescription: string | null,
  existingTasks: Array<{ id: string; title: string; status: string }>
): string {
  return `Identify potential dependencies for this task from the existing task list:

New Task: ${taskTitle}
${taskDescription ? `Description: ${taskDescription}` : ''}

Existing Tasks:
${existingTasks.map((t) => `- [${t.id}] ${t.title} (${t.status})`).join('\n')}

Respond with JSON in this exact format:
{
  "suggestedDependencies": [
    {
      "taskId": "id of the dependency",
      "taskTitle": "title of the dependency",
      "reason": "why this should be a dependency",
      "confidence": 0.0 to 1.0
    }
  ]
}`;
}

export function getProjectHealthPrompt(
  projectName: string,
  projectDescription: string | null,
  tasks: Array<{ title: string; status: string; priority: string; dueDate: string | null }>
): string {
  return `Analyze the health of this project:

Project: ${projectName}
${projectDescription ? `Description: ${projectDescription}` : ''}

Tasks (${tasks.length} total):
${tasks.map((t) => `- ${t.title} [${t.status}] (${t.priority}${t.dueDate ? `, due: ${t.dueDate}` : ''})`).join('\n')}

Respond with JSON in this exact format:
{
  "healthScore": 0 to 100,
  "issues": [
    {
      "type": "progress_analysis or health_analysis or blocker_resolution",
      "title": "issue title",
      "content": "description of the issue",
      "severity": "info, warning, or critical"
    }
  ],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "summary": "brief overall health summary"
}`;
}

export function getProjectTaskGenPrompt(
  projectName: string,
  projectDescription: string | null,
  area: string,
  existingTasks: Array<{ title: string }>
): string {
  return `Suggest additional tasks needed to complete this project:

Project: ${projectName}
${projectDescription ? `Description: ${projectDescription}` : ''}
Area: ${area}

Existing Tasks:
${existingTasks.map((t) => `- ${t.title}`).join('\n')}

Respond with JSON in this exact format:
{
  "suggestedTasks": [
    {
      "title": "task title",
      "description": "brief description",
      "area": "${area}",
      "priority": "P1-P4",
      "size": "Fibonacci story points (1,2,3,5,8,13,21) or null"
    }
  ],
  "reasoning": "explanation of what gaps these tasks fill"
}`;
}

export function getProjectRiskPrompt(
  projectName: string,
  projectDescription: string | null,
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
  }>
): string {
  return `Identify risks for this project:

Project: ${projectName}
${projectDescription ? `Description: ${projectDescription}` : ''}

Tasks:
${tasks.map((t) => `- [${t.id}] ${t.title} [${t.status}] (${t.priority}${t.dueDate ? `, due: ${t.dueDate}` : ''})`).join('\n')}

Respond with JSON in this exact format:
{
  "risks": [
    {
      "severity": "low, medium, or high",
      "description": "risk description",
      "mitigation": "suggested mitigation",
      "affectedTasks": ["task ids if applicable"]
    }
  ],
  "overallRiskLevel": "low, medium, or high",
  "summary": "brief risk summary"
}`;
}
