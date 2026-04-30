export interface ResponsePattern {
  keywords: string[];
  response: string;
  thinking?: string;
  webSearch?: boolean;
  searchQuery?: string;
}

export const chatbotResponses: ResponsePattern[] = [
  {
    keywords: ['task', 'create', 'add', 'new task'],
    response: `I can help you create a [task](/admin/tasks)! Based on your message, I'll add this to your task list. Tasks in Personal OS connect to your [projects](/admin/projects) and [goals](/admin/goals), helping you break down strategic objectives into actionable steps.

Would you like me to:
1. Create this as a high-priority task
2. Link it to an existing project
3. Set a specific deadline`,
    thinking: `The user wants to create a task. I should:
1. Parse the task details from their message
2. Check if it relates to any existing projects or goals
3. Suggest appropriate priority levels based on keywords
4. Consider deadline implications from the context`,
  },
  {
    keywords: ['goal', 'progress', 'how'],
    response: `Let me check your [goals](/admin/goals) progress. In Personal OS, goals are part of the Strategic Layer, driving your [projects](/admin/projects) and daily actions.

Your active goals show:
- Goal completion tracking
- Linked projects and their status
- Key [metrics](/admin/metrics) aligned with each goal

Would you like me to show detailed progress on a specific goal?`,
    thinking: `I need to:
1. Retrieve all active goals from the database
2. Calculate completion percentages based on linked projects and tasks
3. Identify which metrics are tracking each goal
4. Determine if any goals are at risk or exceeding expectations`,
  },
  {
    keywords: ['metric', 'progress', 'performance', 'analytics'],
    response: `Your [metrics dashboard](/admin/metrics) provides data-driven insights. The Measurement Layer tracks KPIs tied to your [goals](/admin/goals) and [projects](/admin/projects).

I can help you:
- View current metric values
- Analyze trends over time
- Identify what's working well
- Suggest areas for improvement

Which metrics would you like to review?`,
    thinking: `Let me analyze the metrics data:
1. Pull all tracked metrics and their recent values
2. Calculate trend directions (improving/declining)
3. Compare against historical baselines
4. Identify correlations with goal progress
5. Look for anomalies or significant changes`,
  },
  {
    keywords: ['habit', 'routine', 'daily'],
    response: `[Habits](/admin/habits) are part of the Tactical Layer, turning your strategy into consistent daily action. I can help you:

- Review your current habits and streaks
- Create new habits aligned with your [goals](/admin/goals)
- Analyze habit completion patterns
- Suggest optimal times for habits

What habit would you like to work on?`,
    thinking: `For habit management, I should:
1. Check current habit streaks and completion rates
2. Identify habits that need attention or are at risk
3. Look for patterns in successful vs. failed habit completions
4. Consider time-of-day data for optimization suggestions`,
  },
  {
    keywords: ['project', 'status', 'milestone'],
    response: `Let me pull up your [project](/admin/projects) statuses. Projects bridge strategy and execution, breaking down [goals](/admin/goals) into manageable milestones.

I can show you:
- Active project progress percentages
- Upcoming milestones
- [Tasks](/admin/tasks) per project
- Blocked items needing attention

Which project would you like details on?`,
    thinking: `I need to:
1. Get all active projects and their current status
2. Calculate progress based on completed vs. total milestones
3. Identify upcoming deadlines and milestones
4. Flag any blocked or at-risk projects
5. Show task distribution across projects`,
  },
  {
    keywords: ['logbook', 'journal', 'reflection', 'entry'],
    response: `The [Logbook](/admin/logbook) is your Reflection Layer, capturing daily insights and learning. It helps you:

- Connect activities to outcomes
- Track what's working and what isn't
- Identify patterns in your growth
- Document key learnings

Would you like to:
1. Create a new journal entry
2. Review recent reflections
3. Analyze patterns in your entries`,
    thinking: `For logbook analysis:
1. Retrieve recent entries and their themes
2. Look for recurring topics or concerns
3. Connect logbook insights to goal progress
4. Identify breakthrough moments or learning patterns
5. Suggest reflection prompts based on recent activity`,
  },
  {
    keywords: ['help', 'what can you do', 'capabilities'],
    response: `I'm your Personal OS Assistant! I have access to your Personal OS data and can help you:

📋 **[Tasks](/admin/tasks)**: Create, update, or review your tasks
🎯 **[Goals](/admin/goals)**: Track progress and align actions
📊 **[Metrics](/admin/metrics)**: Analyze performance data
📅 **[Habits](/admin/habits)**: Build consistent routines
📁 **[Projects](/admin/projects)**: Manage complex initiatives
📖 **[Logbook](/admin/logbook)**: Reflect on your journey

I can create items, provide insights, search the web for information, and help you understand how everything connects. What would you like to work on?`,
    thinking: `The user is asking about my capabilities. I should provide a clear overview of:
1. All available Personal OS modules
2. My ability to create and manage items
3. Web search capabilities for external information
4. Cross-module insights and connections
5. Proactive suggestions based on their data`,
  },
  {
    keywords: ['integration', 'layers', 'how it works', 'connect'],
    response: `Personal OS Core uses a four-layer architecture where everything connects:

**Strategic Layer** ([Goals](/admin/goals) & [Projects](/admin/projects)) → defines what you want to achieve
↓
**Tactical Layer** ([Tasks](/admin/tasks) & [Habits](/admin/habits)) → drives daily execution
↓
**Measurement Layer** ([Metrics](/admin/metrics)) → tracks progress with data
↓
**Reflection Layer** ([Logbook](/admin/logbook)) → captures insights that inform strategy

This creates a continuous improvement cycle where each layer reinforces the others. Would you like to explore how to leverage these connections?`,
    thinking: `To explain the integration:
1. Show concrete examples from their data
2. Highlight where layers are working well together
3. Identify opportunities for better integration
4. Suggest specific actions to strengthen connections`,
  },
  {
    keywords: ['prioritize', 'what should i do', 'next', 'focus'],
    response: `Let me help you prioritize! Based on your Personal OS data, I can suggest:

1. **Urgent [Tasks](/admin/tasks)** with approaching deadlines
2. **High-Impact Activities** aligned with your top [goals](/admin/goals)
3. **[Habit](/admin/habits) Streaks** that need attention today
4. **[Project](/admin/projects) Milestones** coming up soon

I can also help you understand which activities will have the biggest impact on your [goals](/admin/goals). What area would you like to focus on?`,
    thinking: `For prioritization:
1. Analyze task deadlines and urgency
2. Map tasks to goals to find high-impact work
3. Check habit streaks that are at risk
4. Review project timelines for upcoming milestones
5. Consider energy levels and optimal task sequencing`,
  },
  {
    keywords: ['report', 'summary', 'overview', 'status'],
    response: `Here's a comprehensive overview of your Personal OS:

**Strategic Health**: Your [goals](/admin/goals) and [projects](/admin/projects) status
**Tactical Momentum**: [Task](/admin/tasks) completion and [habit](/admin/habits) consistency
**Performance Insights**: Key [metrics](/admin/metrics) and trends
**Growth Patterns**: Recent [logbook](/admin/logbook) insights

I can dive deeper into any of these areas. Which would you like to explore first?`,
    thinking: `To generate a comprehensive report:
1. Calculate goal completion rates
2. Measure task velocity and habit consistency
3. Analyze metric trends and correlations
4. Extract themes from recent logbook entries
5. Identify areas of strength and opportunities for growth`,
  },
  {
    keywords: ['search', 'find', 'look up', 'research'],
    response: `I can search the web for information to help you! Let me find relevant resources and insights.

After searching, I'll provide:
- Key findings and summaries
- Relevant links and sources
- How this information applies to your [goals](/admin/goals) and [projects](/admin/projects)

What would you like me to search for?`,
    thinking: `For web search requests:
1. Identify the core search intent
2. Formulate an effective search query
3. Plan to synthesize results with Personal OS context
4. Consider how findings might apply to their goals`,
    webSearch: true,
    searchQuery: 'user query will be extracted',
  },
];

export const defaultResponse = `I'm your Personal OS Assistant! I have access to your Personal OS data and can help you:

📋 **[Tasks](/admin/tasks)**: Create, update, or review your tasks
🎯 **[Goals](/admin/goals)**: Track progress and align actions
📊 **[Metrics](/admin/metrics)**: Analyze performance data
📅 **[Habits](/admin/habits)**: Build consistent routines
📁 **[Projects](/admin/projects)**: Manage complex initiatives
📖 **[Logbook](/admin/logbook)**: Reflect on your journey

I can create items, provide insights, and help you understand how everything connects. What would you like to work on?`;

export interface ResponseData {
  content: string;
  thinking?: string;
  webSearch?: boolean;
  searchQuery?: string;
}

export function findBestResponse(userMessage: string): ResponseData {
  const lowerMessage = userMessage.toLowerCase();

  for (const pattern of chatbotResponses) {
    if (pattern.keywords.some((keyword) => lowerMessage.includes(keyword))) {
      return {
        content: pattern.response,
        thinking: pattern.thinking,
        webSearch: pattern.webSearch,
        searchQuery: pattern.searchQuery,
      };
    }
  }

  return { content: defaultResponse };
}
