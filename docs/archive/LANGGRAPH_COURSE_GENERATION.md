> **Archived (historical).** The web app no longer runs LangGraph in the browser. Course generation uses the **backend** (`POST /ai/courses/*` and WebSocket `courseSkeletonStart` with server-side LLM calls). Kept for design background only.

# Langgraph for Aligned Course Outline Generation

## Problem Statement

Current course generation produces content that feels **disjointed** when moving from one lesson to the next. This happens because:

1. **No shared context**: Each lesson is generated independently without awareness of previous/upcoming lessons
2. **Single-pass generation**: The entire course skeleton is created in one prompt, leading to inconsistent depth and flow
3. **No alignment checks**: There's no mechanism to ensure lessons build upon each other logically
4. **Missing cross-references**: Concepts introduced in one lesson aren't properly referenced or built upon in subsequent lessons

## Solution: Langgraph with Shared Global State

Langgraph enables a **multi-agent orchestration** approach where specialized agents collaborate through a shared global state to create aligned, coherent course content.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│              Shared Global State (Graph State)          │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Course Metadata                                   │  │
│  │ - Title, Description, Difficulty                  │  │
│  │ - Learning Objectives (Course-level)              │  │
│  │ - Prerequisites                                   │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Module Structure                                  │  │
│  │ - Module titles, descriptions, order              │  │
│  │ - Module-level learning objectives                │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Lesson Outlines                                   │  │
│  │ - Lesson titles, objectives, estimated time       │  │
│  │ - Prerequisites per lesson                        │  │
│  │ - Key concepts introduced                         │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Concept Graph                                     │  │
│  │ - Concepts introduced in each lesson              │  │
│  │ - Dependencies between concepts                   │  │
│  │ - Cross-references between lessons                │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Alignment Checks                                  │  │
│  │ - Flow quality scores                             │  │
│  │ - Gaps identified                                 │  │
│  │ - Redundancies flagged                            │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         ↑                    ↑                    ↑
         │                    │                    │
    ┌────┴────┐         ┌─────┴─────┐        ┌─────┴─────┐
    │ Agent 1 │         │  Agent 2  │        │  Agent N  │
    └─────────┘         └───────────┘        └───────────┘
```

## Agent Specialization

### 1. **Course Strategist Agent**

**Role**: High-level course design and structure

**Responsibilities**:

- Define course-level learning objectives
- Determine module breakdown and sequencing
- Establish difficulty progression
- Set overall pedagogical approach

**Inputs**:

- Topic
- Target difficulty
- Pre-assessment results
- User preferences

**Outputs** (to global state):

- Course title and description
- Module structure (titles, descriptions, order)
- Course-level learning objectives
- Prerequisites

**Node**: `course_strategist`

---

### 2. **Module Architect Agent**

**Role**: Design individual modules with lesson outlines

**Responsibilities**:

- Break down modules into lessons
- Define module-level learning objectives
- Ensure lessons within module flow logically
- Estimate time per lesson

**Inputs** (from global state):

- Module assignment
- Course objectives
- Previous modules (for context)

**Outputs** (to global state):

- Lesson titles and descriptions
- Lesson-level learning objectives
- Estimated time per lesson
- Key concepts to be introduced

**Node**: `module_architect`

**Execution**: Runs once per module, sequentially

**⚠️ Scalability Consideration**: Context Window Management

As the number of modules grows (25, 100+), passing all previous modules as context will exceed LLM context limits. Solutions:

#### Solution 1: Sliding Window with Summaries (Recommended)

- **Recent modules (N=3-5)**: Include full context from the last N modules
- **Earlier modules**: Include only summaries (titles, key concepts, learning objectives)
- **Progressive summarization**: As modules accumulate, older ones get more compressed summaries

```typescript
function getModuleContext(state: CourseGenerationState, currentModuleIndex: number): string {
  /** Get context for Module Architect with sliding window */
  const WINDOW_SIZE = 3; // Full context for last 3 modules
  const SUMMARY_THRESHOLD = 5; // Summarize modules older than this

  const contextParts: string[] = [];

  // Full context for recent modules
  const recentStart = Math.max(0, currentModuleIndex - WINDOW_SIZE);
  for (let i = recentStart; i < currentModuleIndex; i++) {
    const module = state.modules[i];
    contextParts.push(`## Module ${i + 1}: ${module.title}\n${module.description}`);
    for (const lesson of module.lessons) {
      contextParts.push(`- Lesson: ${lesson.title}\n  Concepts: ${lesson.keyConcepts.join(', ')}`);
    }
  }

  // Summaries for older modules
  if (currentModuleIndex > SUMMARY_THRESHOLD) {
    const olderModules = state.modules.slice(0, recentStart);
    const summary = await summarizeModules(olderModules); // LLM-generated summary
    contextParts.unshift(`## Earlier Modules Summary:\n${summary}`);
  }

  return contextParts.join('\n\n');
}
```

#### Solution 2: Concept Graph-Based Context

- Instead of full module context, provide only the **concept graph** from previous modules
- Module Architect queries: "What concepts were introduced? What prerequisites exist?"
- Much more compact: ~100 concepts vs. ~1000s of tokens from full modules

```typescript
function getConceptBasedContext(state: CourseGenerationState, currentModuleIndex: number): string {
  /** Use concept graph instead of full module context */
  const previousConcepts: string[] = [];
  for (let i = 0; i < currentModuleIndex; i++) {
    for (const lesson of state.modules[i].lessons) {
      previousConcepts.push(...lesson.keyConcepts);
    }
  }

  // Build concept dependency summary
  const conceptSummary = buildConceptSummary(previousConcepts, state.conceptGraph);

  return `
## Concepts Introduced So Far:
${conceptSummary}

## Prerequisites Available:
${listPrerequisites(state.conceptGraph)}
`;
}
```

#### Solution 3: Hierarchical Summarization

- **Module-level summaries**: One summary per module (title, objectives, key concepts)
- **Section-level summaries**: Group modules into sections (e.g., "Fundamentals", "Advanced")
- **Course-level summary**: High-level overview of entire course progression

```typescript
function getHierarchicalContext(state: CourseGenerationState, currentModuleIndex: number): string {
  /** Hierarchical context: course → sections → recent modules */
  const context: string[] = [];

  // Course-level summary (always included)
  context.push(
    `Course: ${state.course.title}\nObjectives: ${state.course.learningObjectives.join(', ')}`
  );

  // Section summaries (if applicable)
  const sections = groupModulesIntoSections(state.modules.slice(0, currentModuleIndex));
  for (const section of sections) {
    context.push(`Section '${section.name}': ${section.summary}`);
  }

  // Full context for current section only
  const currentSectionModules = getCurrentSectionModules(state.modules, currentModuleIndex);
  for (const module of currentSectionModules) {
    context.push(formatModuleFull(module));
  }

  return context.join('\n\n');
}
```

#### Solution 4: Parallel Processing with Limited Context Sharing

- Process modules in **batches** (e.g., 5 modules at a time)
- Within a batch: modules can reference each other
- Between batches: only pass summaries forward
- Reduces sequential dependency while maintaining alignment

```typescript
async function moduleArchitectBatch(
  state: CourseGenerationState,
  batchStart: number,
  batchSize: number = 5
): Promise<void> {
  /** Process modules in batches */
  const batchModules = state.modules.slice(batchStart, batchStart + batchSize);

  // Get summary of previous batches
  const previousSummary = await summarizeModules(state.modules.slice(0, batchStart));

  // Process batch modules (can be parallel within batch)
  for (const module of batchModules) {
    const context = previousSummary + getBatchContext(batchModules, module);
    await architectModule(module, context);
  }
}
```

#### Recommended Approach: Hybrid

Combine **Solution 1 (Sliding Window)** + **Solution 2 (Concept Graph)**:

1. **Recent modules (last 3-5)**: Full context for immediate continuity
2. **Concept graph**: All concepts from previous modules (compact, essential)
3. **Module summaries**: Compressed summaries of older modules
4. **Course objectives**: Always included for alignment

This provides:

- ✅ Immediate context for smooth transitions
- ✅ Complete concept awareness (no missing prerequisites)
- ✅ Scalable to 100+ modules
- ✅ Maintains alignment quality

---

### 3. **Concept Mapper Agent**

**Role**: Build and maintain concept dependency graph

**Responsibilities**:

- Track concepts introduced in each lesson
- Identify prerequisite relationships
- Map concept dependencies
- Flag missing prerequisites

**Inputs** (from global state):

- All lesson outlines
- Concepts introduced per lesson

**Outputs** (to global state):

- Concept dependency graph
- Prerequisite mappings
- Cross-lesson concept references

**Node**: `concept_mapper`

**Execution**: Runs after all modules are outlined

---

### 4. **Flow Validator Agent**

**Role**: Ensure logical progression and alignment

**Responsibilities**:

- Check lesson-to-lesson flow
- Identify gaps in progression
- Flag redundancies
- Validate prerequisite chains
- Assess difficulty progression

**Inputs** (from global state):

- Complete course structure
- Concept graph
- All lesson outlines

**Outputs** (to global state):

- Alignment scores per transition
- Gap analysis
- Redundancy reports
- Recommendations for fixes

**Node**: `flow_validator`

**Execution**: Runs after concept mapping

---

### 5. **Refinement Agent**

**Role**: Fix identified issues and improve alignment

**Responsibilities**:

- Address gaps identified by validator
- Remove redundancies
- Add missing prerequisites
- Improve transitions between lessons
- Adjust difficulty progression

**Inputs** (from global state):

- Flow validator results
- Current course structure

**Outputs** (to global state):

- Updated lesson outlines
- Improved module descriptions
- Added cross-references

**Node**: `refinement_agent`

**Execution**: Runs conditionally based on validator results

---

### 6. **Content Generator Agent**

**Role**: Generate detailed lesson content with context awareness

**Responsibilities**:

- Generate lesson content using full course context
- Reference previous lessons appropriately
- Build upon concepts from earlier lessons
- Include proper transitions
- Maintain consistent tone and depth

**Inputs** (from global state):

- Target lesson outline
- Previous lesson content
- Concept graph
- Course objectives

**Outputs**:

- Full markdown lesson content

**Node**: `content_generator`

**Execution**: Runs per lesson, after outline is finalized

---

## Langgraph State Schema

```typescript
interface CourseGenerationState {
  // Course-level metadata
  course: {
    title: string;
    description: string;
    difficulty: DifficultyLevel;
    estimatedHours: number;
    learningObjectives: string[];
    prerequisites: string[];
  };

  // Module structure
  modules: Array<{
    id: string;
    title: string;
    description: string;
    moduleIndex: number;
    learningObjectives: string[];
    lessons: Array<{
      id: string;
      title: string;
      description: string;
      lessonIndex: number;
      estimatedMinutes: number;
      learningObjectives: string[];
      keyConcepts: string[];
      prerequisites: string[]; // Concepts from previous lessons
      content?: string; // Generated later
    }>;
  }>;

  // Concept tracking
  conceptGraph: {
    concepts: Map<
      string,
      {
        introducedIn: string; // lessonId
        prerequisites: string[]; // concept IDs
        usedIn: string[]; // lessonIds
        depth: number; // How deep in the dependency tree
      }
    >;
    dependencies: Array<{
      from: string; // conceptId
      to: string; // conceptId
      type: 'prerequisite' | 'builds_on' | 'extends';
    }>;
  };

  // Alignment tracking
  alignment: {
    lessonTransitions: Array<{
      from: string; // lessonId
      to: string; // lessonId
      flowScore: number; // 0-1
      gaps: string[];
      redundancies: string[];
      recommendations: string[];
    }>;
    overallScore: number; // 0-1
    issues: Array<{
      type: 'gap' | 'redundancy' | 'prerequisite_missing' | 'difficulty_jump';
      severity: 'low' | 'medium' | 'high';
      description: string;
      affectedLessons: string[];
    }>;
  };

  // Generation metadata
  metadata: {
    currentPhase:
      | 'strategizing'
      | 'architecting'
      | 'mapping'
      | 'validating'
      | 'refining'
      | 'generating';
    iterations: number;
    lastModified: string;
  };
}
```

## Graph Flow

```
START
  ↓
[Course Strategist] → Creates course structure, modules
  ↓
[Module Architect] → For each module (sequential):
  ├─→ Module 1: Create lesson outlines
  ├─→ Module 2: Create lesson outlines (with Module 1 context)
  ├─→ Module 3: Create lesson outlines (with Modules 1-2 context)
  └─→ ...
  ↓
[Concept Mapper] → Build concept dependency graph
  ↓
[Flow Validator] → Check alignment and flow
  ↓
{Check: alignment.overallScore > threshold?}
  ├─→ YES → [Content Generator] → Generate lesson content
  └─→ NO → [Refinement Agent] → Fix issues
            ↓
            [Flow Validator] → Re-check alignment
            ↓
            {Check: iterations < maxIterations?}
              ├─→ YES → Loop back to refinement
              └─→ NO → [Content Generator] → Generate with current state
  ↓
[Content Generator] → For each lesson (can be parallel):
  ├─→ Lesson 1: Generate with full context
  ├─→ Lesson 2: Generate with Lesson 1 context + concept graph
  ├─→ Lesson 3: Generate with Lessons 1-2 context + concept graph
  └─→ ...
  ↓
END
```

## Implementation Details

### Conditional Edges

```typescript
function shouldRefine(state: CourseGenerationState): 'refine' | 'generate_content' {
  /** Determine if refinement is needed */
  if (state.alignment.overallScore >= 0.8) {
    return 'generate_content';
  } else if (state.metadata.iterations < 3) {
    return 'refine';
  } else {
    return 'generate_content'; // Proceed even if not perfect
  }
}
```

### Parallel Execution

- **Module Architect**: Can process modules in parallel after initial structure is set
- **Content Generator**: Can generate multiple lessons in parallel (with read-only access to previous lessons)

### Context Management Helper

```typescript
function getModuleContextOptimized(
  state: CourseGenerationState,
  currentModuleIndex: number,
  windowSize: number = 3,
  summaryThreshold: number = 5
): string {
  /**
   * Optimized context retrieval for Module Architect.
   * Combines sliding window + concept graph for scalability.
   */
  const contextParts: string[] = [];

  // 1. Course-level context (always included, small)
  contextParts.push(`
Course: ${state.course.title}
Objectives: ${state.course.learningObjectives.join(', ')}
Difficulty: ${state.course.difficulty}
`);

  // 2. Concept graph summary (compact, essential)
  if (currentModuleIndex > 0) {
    const previousConcepts = extractConceptsFromModules(state.modules.slice(0, currentModuleIndex));
    const conceptSummary = formatConceptSummary(previousConcepts, state.conceptGraph);
    contextParts.push(`## Concepts Introduced:\n${conceptSummary}`);
  }

  // 3. Full context for recent modules (sliding window)
  const recentStart = Math.max(0, currentModuleIndex - windowSize);
  if (recentStart < currentModuleIndex) {
    contextParts.push('## Recent Modules (Full Context):');
    for (let i = recentStart; i < currentModuleIndex; i++) {
      const module = state.modules[i];
      contextParts.push(formatModuleFull(module));
    }
  }

  // 4. Summaries for older modules (if beyond threshold)
  if (currentModuleIndex > summaryThreshold) {
    const olderModules = state.modules.slice(0, recentStart);
    const summary = await generateModuleSummary(olderModules); // LLM call
    contextParts.push(`## Earlier Modules Summary:\n${summary}`);
  }

  return contextParts.join('\n\n');
}

function formatConceptSummary(concepts: string[], conceptGraph: ConceptGraph): string {
  /** Format concept graph into compact summary */
  const lines: string[] = [];
  for (const concept of concepts) {
    const deps = conceptGraph.getPrerequisites(concept);
    if (deps && deps.length > 0) {
      lines.push(`- ${concept} (requires: ${deps.join(', ')})`);
    } else {
      lines.push(`- ${concept}`);
    }
  }
  return lines.join('\n');
}
```

### State Updates

Each agent updates specific parts of the state:

```typescript
async function courseStrategistNode(
  state: CourseGenerationState
): Promise<Partial<CourseGenerationState>> {
  // Updates: course, modules (titles only)
  const courseStructure = await generateCourseStructure(state);
  return {
    course: courseStructure.course,
    modules: courseStructure.modules,
    metadata: {
      ...state.metadata,
      currentPhase: 'architecting',
    },
  };
}

async function moduleArchitectNode(
  state: CourseGenerationState
): Promise<Partial<CourseGenerationState>> {
  // Updates: modules[].lessons
  // Reads: course, previous modules (with context window management)

  // Process each module sequentially
  const updatedModules = [...state.modules];

  for (let i = 0; i < updatedModules.length; i++) {
    // Get context using sliding window + concept graph approach
    const context = await getModuleContextOptimized(state, i);

    // Generate lessons for this module
    const lessons = await generateModuleLessons({
      module: updatedModules[i],
      courseObjectives: state.course.learningObjectives,
      previousContext: context,
      conceptGraph: state.conceptGraph,
    });

    // Update module with lessons
    updatedModules[i] = {
      ...updatedModules[i],
      lessons,
    };
  }

  return {
    modules: updatedModules,
    metadata: {
      ...state.metadata,
      currentPhase: 'mapping',
    },
  };
}

async function conceptMapperNode(
  state: CourseGenerationState
): Promise<Partial<CourseGenerationState>> {
  // Updates: conceptGraph
  // Reads: all modules and lessons
  const conceptGraph = await buildConceptGraph(state.modules);

  return {
    conceptGraph,
    metadata: {
      ...state.metadata,
      currentPhase: 'validating',
    },
  };
}

async function flowValidatorNode(
  state: CourseGenerationState
): Promise<Partial<CourseGenerationState>> {
  // Updates: alignment
  // Reads: everything
  const alignment = await validateFlow(state);

  return {
    alignment,
    metadata: {
      ...state.metadata,
      currentPhase: alignment.overallScore >= 0.8 ? 'generating' : 'refining',
    },
  };
}

async function refinementAgentNode(
  state: CourseGenerationState
): Promise<Partial<CourseGenerationState>> {
  // Updates: modules, lessons (outlines), conceptGraph
  // Reads: alignment
  const refined = await refineCourseStructure(state);

  return {
    modules: refined.modules,
    conceptGraph: refined.conceptGraph,
    metadata: {
      ...state.metadata,
      iterations: state.metadata.iterations + 1,
      currentPhase: 'validating',
    },
  };
}

async function contentGeneratorNode(
  state: CourseGenerationState
): Promise<Partial<CourseGenerationState>> {
  // Updates: modules[].lessons[].content
  // Reads: full state for context
  const modulesWithContent = await generateAllLessonContent(state);

  return {
    modules: modulesWithContent,
    metadata: {
      ...state.metadata,
      currentPhase: 'generating',
    },
  };
}
```

## Benefits of This Approach

### 1. **Contextual Awareness**

- Each agent has access to the full course structure
- Lessons are generated with awareness of what came before and what comes after
- Concepts are tracked and properly referenced

### 2. **Iterative Refinement**

- Issues are identified and fixed automatically
- Multiple passes ensure quality alignment
- Can refine specific sections without regenerating everything

### 3. **Specialized Expertise**

- Each agent focuses on one aspect (strategy, architecture, validation, etc.)
- Better quality than a single monolithic prompt
- Easier to debug and improve individual agents

### 4. **Maintainability**

- Clear separation of concerns
- Easy to add new agents (e.g., "Difficulty Calibrator", "Example Generator")
- Can swap out individual agents without affecting others

### 5. **Transparency**

- Full state is visible at each step
- Can inspect alignment scores and issues
- Easier to understand why content was generated a certain way

## Example: How It Solves Disjointedness

### Current Approach (Single Prompt)

```
Prompt: "Create a course on Data Structures with 5 modules..."
→ Generates all modules/lessons at once
→ Lesson 3 doesn't know what Lesson 2 covered
→ Lesson 4 introduces concepts without building on Lesson 3
→ Result: Disjointed flow
```

### Langgraph Approach

```
1. Course Strategist: "Course on Data Structures, 5 modules"
2. Module Architect (Module 1): Creates 3 lessons
3. Module Architect (Module 2):
   - Reads Module 1 lessons
   - Ensures Lesson 4 builds on Lesson 3
   - References concepts from Module 1
4. Concept Mapper: Tracks "Arrays" introduced in Lesson 1, used in Lesson 5
5. Flow Validator: "Lesson 4 jumps too quickly - missing prerequisite concept"
6. Refinement Agent: Adds prerequisite concept to Lesson 4
7. Content Generator (Lesson 4):
   - Reads Lessons 1-3 content
   - References "Arrays" from Lesson 1
   - Builds on "Linked Lists" from Lesson 3
   - Result: Aligned, coherent flow
```

## Integration with Existing System

### Service Layer

```typescript
// src/services/knowledge-vault/langgraph-course-generator.service.ts

export const langgraphCourseGeneratorService = {
  async generateCourseWithLanggraph(
    input: GenerateCourseSkeletonInput
  ): Promise<ApiResponse<CourseSkeletonResult>> {
    // Initialize Langgraph state
    const initialState: CourseGenerationState = {
      course: {
        /* ... */
      },
      modules: [],
      conceptGraph: { concepts: new Map(), dependencies: [] },
      alignment: { lessonTransitions: [], overallScore: 0, issues: [] },
      metadata: {
        currentPhase: 'strategizing',
        iterations: 0,
        lastModified: new Date().toISOString(),
      },
    };

    // Build graph
    const graph = buildCourseGenerationGraph();

    // Execute
    const finalState = await graph.invoke(initialState, {
      config: { configurable: { input } },
    });

    // Convert to existing CourseSkeletonResult format
    return convertStateToSkeletonResult(finalState);
  },
};
```

### Graph Definition

```typescript
// Using LangGraph.js TypeScript SDK

import { StateGraph, START, END } from '@langchain/langgraph';
import type { Annotation } from '@langchain/langgraph';

// Define state annotation
const CourseGenerationAnnotation: Annotation<CourseGenerationState> = {
  reducer: (x: CourseGenerationState, y: Partial<CourseGenerationState>) => ({
    ...x,
    ...y,
    // Merge arrays and nested objects properly
    modules: y.modules ?? x.modules,
    conceptGraph: {
      ...x.conceptGraph,
      ...y.conceptGraph,
      concepts: new Map([...x.conceptGraph.concepts, ...(y.conceptGraph?.concepts ?? [])]),
    },
    alignment: {
      ...x.alignment,
      ...y.alignment,
      lessonTransitions: y.alignment?.lessonTransitions ?? x.alignment.lessonTransitions,
      issues: y.alignment?.issues ?? x.alignment.issues,
    },
  }),
};

function buildCourseGenerationGraph() {
  const workflow = new StateGraph(CourseGenerationAnnotation);

  // Add nodes
  workflow.addNode('course_strategist', courseStrategistNode);
  workflow.addNode('module_architect', moduleArchitectNode);
  workflow.addNode('concept_mapper', conceptMapperNode);
  workflow.addNode('flow_validator', flowValidatorNode);
  workflow.addNode('refinement_agent', refinementAgentNode);
  workflow.addNode('content_generator', contentGeneratorNode);

  // Add edges
  workflow.addEdge(START, 'course_strategist');
  workflow.addEdge('course_strategist', 'module_architect');
  workflow.addEdge('module_architect', 'concept_mapper');
  workflow.addEdge('concept_mapper', 'flow_validator');

  // Conditional edge for refinement loop
  workflow.addConditionalEdges('flow_validator', shouldRefine, {
    refine: 'refinement_agent',
    generate_content: 'content_generator',
  });

  workflow.addEdge('refinement_agent', 'flow_validator');
  workflow.addEdge('content_generator', END);

  return workflow.compile();
}

function shouldRefine(state: CourseGenerationState): 'refine' | 'generate_content' {
  if (state.alignment.overallScore >= 0.8) {
    return 'generate_content';
  } else if (state.metadata.iterations < 3) {
    return 'refine';
  } else {
    return 'generate_content'; // Proceed even if not perfect
  }
}
```

## Next Steps

1. **Prototype**: Implement a simplified version with 3-4 agents
2. **Test**: Generate a course and compare alignment scores
3. **Iterate**: Refine agent prompts and validation logic
4. **Scale**: Add more specialized agents as needed
5. **Integrate**: Replace current single-prompt approach

## Alternative: Hybrid Approach

If full Langgraph implementation is too complex initially, consider a **hybrid approach**:

1. Keep current `generateCourseSkeleton` for initial structure
2. Add a **post-processing alignment agent** that:
   - Reads the generated skeleton
   - Identifies gaps and redundancies
   - Suggests refinements
   - Regenerates problematic sections

This provides immediate improvement with less implementation complexity.

## Conclusion

Langgraph with shared global state enables **collaborative multi-agent course generation** that ensures:

- ✅ Lessons build logically on each other
- ✅ Concepts are properly introduced and referenced
- ✅ Smooth difficulty progression
- ✅ No gaps or redundancies
- ✅ Context-aware content generation

This approach transforms course generation from a **single-shot prompt** into an **iterative, collaborative process** that produces aligned, coherent educational content.
