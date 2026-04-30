# LLM Integration Guide

**Purpose:** Implement the backend LLM layer that powers frontend `/ai/*` requests  
**Key Change:** Frontend already calls backend; backend owns provider calls and Secrets Manager keys

---

## Overview

The frontend already calls the backend via `/ai/*` (see `APILLMAdapter`). The backend should:

1. Store API keys securely in AWS Secrets Manager
2. Receive LLM requests from frontend via `/ai/*` endpoints
3. Execute LLM calls using LangChain Python
4. Return structured outputs to frontend with the expected response shape
5. Cache expensive AI results in DynamoDB

---

## Architecture

```
Frontend                    Backend                      LLM Providers
   │                           │                              │
   │  POST /ai/tasks/parse     │                              │
   │  { input: "..." }         │                              │
   │ ─────────────────────────>│                              │
   │                           │  Get API key from            │
   │                           │  Secrets Manager             │
   │                           │                              │
   │                           │  Create LangChain provider   │
   │                           │  with structured output      │
   │                           │ ────────────────────────────>│
   │                           │                              │
   │                           │<─────────────────────────────│
   │                           │  Structured JSON response    │
   │<──────────────────────────│                              │
   │  { success: true,         │                              │
   │    data: { ... } }        │                              │
```

---

## AWS Secrets Manager Setup

### Secret Structure

Create secret: `personal-os/{stage}/llm-keys`

```json
{
  "anthropic": "sk-ant-xxxxx",
  "openai": "sk-xxxxx",
  "gemini": "AIzaSyxxxxx",
  "groq": "gsk_xxxxx"
}
```

### Lambda execution role (IAM)

The **API Terraform** stack attaches an execution role that must allow **`secretsmanager:GetSecretValue`** on `personal-os/${stage}/llm-keys*`. See monorepo `infrastructure/modules/api-lambda-execution-role/`.

### Python Secret Retrieval

```python
# src/ai/config.py
import json
import boto3
from functools import lru_cache
from src.core.config import settings

secrets_client = boto3.client('secretsmanager', region_name=settings.AWS_REGION)

@lru_cache(maxsize=1)
def get_llm_keys() -> dict:
    """Retrieve LLM API keys from Secrets Manager (cached)."""
    try:
        response = secrets_client.get_secret_value(
            SecretId=f"personal-os/{settings.STAGE}/llm-keys"
        )
        return json.loads(response['SecretString'])
    except Exception as e:
        print(f"Failed to retrieve LLM keys: {e}")
        return {}

def get_api_key(provider: str) -> str | None:
    """Get API key for specific provider."""
    keys = get_llm_keys()
    return keys.get(provider)

def has_api_key(provider: str) -> bool:
    """Check if API key exists for provider."""
    return get_api_key(provider) is not None
```

---

## Provider Implementation

### Base Provider

```python
# src/ai/providers/base.py
from abc import ABC, abstractmethod
from typing import Any
from langchain_core.language_models import BaseChatModel
from pydantic import BaseModel

class BaseLLMProvider(ABC):
    """Abstract base class for LLM providers."""

    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    @abstractmethod
    def get_provider_name(self) -> str:
        """Return provider identifier."""
        pass

    @abstractmethod
    def create_model(self) -> BaseChatModel:
        """Create LangChain chat model instance."""
        pass

    async def invoke(self, messages: list[dict]) -> str:
        """Invoke model with messages, return text response."""
        model = self.create_model()
        response = await model.ainvoke(
            [(msg["role"], msg["content"]) for msg in messages]
        )
        return response.content

    async def invoke_structured(
        self,
        schema: type[BaseModel],
        messages: list[dict]
    ) -> BaseModel:
        """Invoke model with structured output."""
        model = self.create_model()
        structured_model = model.with_structured_output(schema)
        response = await structured_model.ainvoke(
            [(msg["role"], msg["content"]) for msg in messages]
        )
        return response
```

### Anthropic Provider

```python
# src/ai/providers/anthropic.py
from langchain_anthropic import ChatAnthropic
from .base import BaseLLMProvider

class AnthropicProvider(BaseLLMProvider):
    """Anthropic Claude provider."""

    def get_provider_name(self) -> str:
        return "anthropic"

    def create_model(self) -> ChatAnthropic:
        return ChatAnthropic(
            api_key=self.api_key,
            model=self.model,
            temperature=0.7,
            max_tokens=4096
        )
```

### OpenAI Provider

```python
# src/ai/providers/openai.py
from langchain_openai import ChatOpenAI
from .base import BaseLLMProvider

class OpenAIProvider(BaseLLMProvider):
    """OpenAI GPT provider."""

    def get_provider_name(self) -> str:
        return "openai"

    def create_model(self) -> ChatOpenAI:
        return ChatOpenAI(
            api_key=self.api_key,
            model=self.model,
            temperature=0.7,
            max_tokens=4096
        )
```

### Gemini Provider

```python
# src/ai/providers/gemini.py
from langchain_google_genai import ChatGoogleGenerativeAI
from .base import BaseLLMProvider

class GeminiProvider(BaseLLMProvider):
    """Google Gemini provider."""

    def get_provider_name(self) -> str:
        return "gemini"

    def create_model(self) -> ChatGoogleGenerativeAI:
        return ChatGoogleGenerativeAI(
            google_api_key=self.api_key,
            model=self.model,
            temperature=0.7,
            max_output_tokens=4096
        )
```

### Groq Provider

```python
# src/ai/providers/groq.py
from langchain_groq import ChatGroq
from .base import BaseLLMProvider

class GroqProvider(BaseLLMProvider):
    """Groq provider for fast inference."""

    def get_provider_name(self) -> str:
        return "groq"

    def create_model(self) -> ChatGroq:
        return ChatGroq(
            api_key=self.api_key,
            model=self.model,
            temperature=0.7,
            max_tokens=4096
        )
```

### Provider Factory

```python
# src/ai/providers/__init__.py
from .base import BaseLLMProvider
from .anthropic import AnthropicProvider
from .openai import OpenAIProvider
from .gemini import GeminiProvider
from .groq import GroqProvider

def create_provider(
    provider_type: str,
    api_key: str,
    model: str
) -> BaseLLMProvider:
    """Factory function to create provider instance."""
    providers = {
        "anthropic": AnthropicProvider,
        "openai": OpenAIProvider,
        "gemini": GeminiProvider,
        "groq": GroqProvider,
    }

    if provider_type not in providers:
        raise ValueError(f"Unsupported provider: {provider_type}")

    return providers[provider_type](api_key, model)
```

---

## Pydantic Schemas (Structured Output)

### Task Schemas

```python
# src/ai/schemas/task_schemas.py
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class Area(str, Enum):
    Health = "Health"
    Wealth = "Wealth"
    Love = "Love"
    Happiness = "Happiness"
    Operations = "Operations"
    DayJob = "DayJob"

class Priority(str, Enum):
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"
    P4 = "P4"

class ParseTaskOutput(BaseModel):
    """Output schema for natural language task parsing."""
    title: str = Field(description="The task title extracted from natural language")
    description: Optional[str] = Field(default=None, description="Optional task description")
    area: Area = Field(description="The life area this task belongs to")
    subCategory: Optional[str] = Field(default=None, description="Optional subcategory within the area")
    priority: Priority = Field(default=Priority.P3, description="Suggested priority level")
    dueDate: Optional[str] = Field(default=None, description="ISO date string if a deadline was mentioned")
    scheduledDate: Optional[str] = Field(default=None, description="ISO date string if a specific date was mentioned")
    size: Optional[int] = Field(default=None, ge=1, le=300, description="Estimated minutes")
    confidence: float = Field(ge=0, le=1, description="Confidence in the parsing accuracy")

class Subtask(BaseModel):
    """Subtask in a breakdown."""
    title: str
    description: Optional[str] = None
    estimatedSize: Optional[int] = Field(default=None, ge=1, le=300)
    order: int

class TaskBreakdownOutput(BaseModel):
    """Output schema for task breakdown."""
    subtasks: list[Subtask] = Field(description="List of subtasks in logical order")
    reasoning: str = Field(description="Explanation of how the task was broken down")
    confidence: float = Field(ge=0, le=1, description="Confidence in the breakdown quality")
    totalEstimatedEffort: Optional[int] = Field(default=None, description="Total estimated minutes")

class PriorityAdvisorOutput(BaseModel):
    """Output schema for priority recommendation."""
    recommendedPriority: Priority = Field(description="Recommended priority level")
    reasoning: str = Field(description="Detailed explanation for the recommendation")
    urgencyScore: float = Field(ge=0, le=10, description="Urgency rating (0-10)")
    impactScore: float = Field(ge=0, le=10, description="Impact rating (0-10)")
    confidence: float = Field(ge=0, le=1, description="Confidence in the recommendation")
    factors: list[str] = Field(description="Key factors considered in the decision")

class EffortEstimationOutput(BaseModel):
    """Output schema for effort estimation."""
    estimatedMinutes: int = Field(ge=1, description="Estimated minutes to complete")
    reasoning: str = Field(description="Explanation for the estimate")
    confidence: float = Field(ge=0, le=1, description="Confidence in the estimate")
    factors: list[str] = Field(description="Factors affecting the estimate")

class TaskCategorizationOutput(BaseModel):
    """Output schema for task categorization."""
    area: Area = Field(description="Recommended life area")
    subCategory: Optional[str] = Field(default=None, description="Recommended subcategory")
    reasoning: str = Field(description="Explanation for the categorization")
    confidence: float = Field(ge=0, le=1, description="Confidence in the categorization")
    alternativeCategories: list[str] = Field(default=[], description="Alternative categories considered")
```

### Goal Schemas

```python
# src/ai/schemas/goal_schemas.py
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class TimeHorizon(str, Enum):
    Yearly = "Yearly"
    Quarterly = "Quarterly"
    Monthly = "Monthly"
    Weekly = "Weekly"
    Daily = "Daily"

class GoalRefinementOutput(BaseModel):
    """Output schema for goal refinement."""
    refinedTitle: str = Field(description="Improved, SMART goal title")
    refinedDescription: Optional[str] = Field(default=None, description="Improved description")
    suggestedTimeHorizon: TimeHorizon = Field(description="Suggested time horizon")
    reasoning: str = Field(description="Explanation of refinements")
    confidence: float = Field(ge=0, le=1)

class SuccessCriterionSuggestion(BaseModel):
    """A suggested success criterion."""
    text: str = Field(description="Criterion text")
    measurable: bool = Field(description="Whether this criterion is measurable")
    suggestedMetricName: Optional[str] = Field(default=None, description="Suggested metric to track")

class SuccessCriteriaOutput(BaseModel):
    """Output schema for success criteria generation."""
    criteria: list[SuccessCriterionSuggestion] = Field(description="List of success criteria")
    reasoning: str = Field(description="Explanation of criteria selection")
    confidence: float = Field(ge=0, le=1)

class SubGoalSuggestion(BaseModel):
    """A suggested sub-goal for cascading."""
    title: str
    timeHorizon: TimeHorizon
    description: Optional[str] = None

class GoalCascadeOutput(BaseModel):
    """Output schema for goal cascading."""
    subGoals: list[SubGoalSuggestion] = Field(description="List of sub-goals")
    reasoning: str = Field(description="Explanation of the cascade")
    confidence: float = Field(ge=0, le=1)

class AchievementForecastOutput(BaseModel):
    """Output schema for achievement forecasting."""
    probabilityOfSuccess: float = Field(ge=0, le=100, description="Probability 0-100%")
    projectedCompletionDate: Optional[str] = Field(default=None, description="Projected completion date")
    reasoning: str = Field(description="Explanation of the forecast")
    riskFactors: list[str] = Field(default=[], description="Identified risk factors")
    recommendations: list[str] = Field(default=[], description="Recommendations to improve odds")
    confidence: float = Field(ge=0, le=1)
```

### Metric Schemas

```python
# src/ai/schemas/metric_schemas.py
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class PatternType(str, Enum):
    trend = "trend"
    cycle = "cycle"
    seasonal = "seasonal"
    spike = "spike"
    plateau = "plateau"

class Significance(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class Pattern(BaseModel):
    """A detected pattern in metric data."""
    type: PatternType
    description: str
    significance: Significance
    insights: str
    recommendations: list[str]

class OverallTrend(str, Enum):
    improving = "improving"
    declining = "declining"
    stable = "stable"

class PatternsOutput(BaseModel):
    """Output schema for pattern analysis."""
    patterns: list[Pattern]
    overallTrend: OverallTrend
    confidence: float = Field(ge=0, le=1)

class AnomalySeverity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class AnomalyType(str, Enum):
    spike = "spike"
    drop = "drop"
    outlier = "outlier"

class AnomalyOutput(BaseModel):
    """Output schema for anomaly detection."""
    isAnomaly: bool
    anomalyType: Optional[AnomalyType] = None
    severity: AnomalySeverity
    possibleCauses: list[str]
    recommendations: list[str]
    requiresAttention: bool
    confidence: float = Field(ge=0, le=1)

class CorrelationStrength(str, Enum):
    weak = "weak"
    moderate = "moderate"
    strong = "strong"

class CorrelationType(str, Enum):
    positive = "positive"
    negative = "negative"

class MetricCorrelation(BaseModel):
    """A correlation between metrics."""
    metricName: str
    correlationType: CorrelationType
    strength: CorrelationStrength
    description: str
    insights: str
    actionable: bool

class CorrelationsOutput(BaseModel):
    """Output schema for correlation analysis."""
    correlations: list[MetricCorrelation]
    overallInsights: str
    confidence: float = Field(ge=0, le=1)

class PredictionOutput(BaseModel):
    """Output schema for trajectory prediction."""
    projectedValue: float
    projectedDate: str
    confidence: float = Field(ge=0, le=1)
    riskFactors: list[str]
    milestones: list[dict]
```

---

## Prompt Templates

```python
# src/ai/prompts/system.py
SYSTEM_PROMPT = """You are an AI assistant specialized in personal productivity and task management. You help users organize their tasks, projects, and goals across six life areas: Health, Wealth, Love, Happiness, Operations, and DayJob.

Available Areas: Health, Wealth, Love, Happiness, Operations, DayJob
Available Priorities: P1, P2, P3, P4 (P1 = highest urgency)

Subcategories by Area:
- Health: Physical, Mental, Spiritual, Nutrition, Sleep, Exercise
- Wealth: Income, Expenses, Investments, Debt, NetWorth
- Love: Romantic, Family, Friends, Social
- Happiness: Joy, Gratitude, Purpose, Peace
- Operations: Productivity, Organization, Systems, Habits
- DayJob: Career, Skills, Projects, Performance

Always respond with valid JSON matching the requested format. Be concise and actionable."""

# src/ai/prompts/tasks.py
def get_parse_task_prompt(text: str) -> str:
    return f"""Parse the following natural language input into a structured task. Extract the title, description, area, subcategory, priority, due date, and any other relevant fields.

Input: "{text}"

Analyze the text carefully and extract:
1. A clear, actionable task title
2. Any descriptive details
3. The most appropriate life area
4. Priority based on urgency/importance cues
5. Any mentioned dates or deadlines
6. Estimated effort if mentioned or inferable"""

def get_task_breakdown_prompt(title: str, description: str | None, area: str) -> str:
    return f"""Break down the following task into smaller, actionable subtasks:

Task: {title}
{f'Description: {description}' if description else ''}
Area: {area}

Create 2-5 concrete subtasks that together complete the main task. Each subtask should be independently actionable and have a clear definition of done."""

def get_priority_advisor_prompt(
    title: str,
    description: str | None,
    current_priority: str,
    other_tasks: list[dict]
) -> str:
    other_tasks_text = "\n".join([
        f"- {t['title']} (Priority: {t['priority']}, Due: {t.get('dueDate', 'None')})"
        for t in other_tasks[:10]
    ])

    return f"""Analyze this task and recommend an appropriate priority level:

Task: {title}
{f'Description: {description}' if description else ''}
Current Priority: {current_priority}

Other active tasks:
{other_tasks_text}

Consider:
1. Urgency (time-sensitivity, deadlines)
2. Impact (consequences of delay, importance)
3. Dependencies (does this block other tasks?)
4. Effort required
5. Alignment with goals"""
```

---

## AI Feature Implementation

### Task AI Service

```python
# src/ai/features/task_ai.py
from src.ai.config import get_api_key, has_api_key
from src.ai.providers import create_provider
from src.ai.schemas.task_schemas import (
    ParseTaskOutput,
    TaskBreakdownOutput,
    PriorityAdvisorOutput,
    EffortEstimationOutput,
    TaskCategorizationOutput
)
from src.ai.prompts.system import SYSTEM_PROMPT
from src.ai.prompts.tasks import (
    get_parse_task_prompt,
    get_task_breakdown_prompt,
    get_priority_advisor_prompt
)
from src.core.config import settings

# Default provider and model (can be made configurable)
DEFAULT_PROVIDER = "anthropic"
DEFAULT_MODEL = "claude-sonnet-4-20250514"

async def parse_task(text: str) -> dict:
    """Parse natural language into structured task."""
    api_key = get_api_key(DEFAULT_PROVIDER)
    if not api_key:
        raise ValueError(f"API key not configured for {DEFAULT_PROVIDER}")

    provider = create_provider(DEFAULT_PROVIDER, api_key, DEFAULT_MODEL)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": get_parse_task_prompt(text)}
    ]

    result = await provider.invoke_structured(ParseTaskOutput, messages)

    return {
        "task": {
            "title": result.title,
            "description": result.description,
            "area": result.area.value,
            "subCategory": result.subCategory,
            "priority": result.priority.value,
            "dueDate": result.dueDate,
            "scheduledDate": result.scheduledDate,
            "size": result.size,
        },
        "confidence": result.confidence,
        "provider": DEFAULT_PROVIDER,
        "model": DEFAULT_MODEL
    }

async def breakdown_task(title: str, description: str | None, area: str) -> dict:
    """Break task into subtasks."""
    api_key = get_api_key(DEFAULT_PROVIDER)
    if not api_key:
        raise ValueError(f"API key not configured for {DEFAULT_PROVIDER}")

    provider = create_provider(DEFAULT_PROVIDER, api_key, DEFAULT_MODEL)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": get_task_breakdown_prompt(title, description, area)}
    ]

    result = await provider.invoke_structured(TaskBreakdownOutput, messages)

    return {
        "subtasks": [
            {
                "title": st.title,
                "description": st.description,
                "estimatedSize": st.estimatedSize,
                "order": st.order,
                "area": area
            }
            for st in result.subtasks
        ],
        "reasoning": result.reasoning,
        "confidence": result.confidence,
        "provider": DEFAULT_PROVIDER,
        "model": DEFAULT_MODEL
    }

async def advise_priority(
    title: str,
    description: str | None,
    current_priority: str,
    other_tasks: list[dict]
) -> dict:
    """Get priority recommendation."""
    api_key = get_api_key(DEFAULT_PROVIDER)
    if not api_key:
        raise ValueError(f"API key not configured for {DEFAULT_PROVIDER}")

    provider = create_provider(DEFAULT_PROVIDER, api_key, DEFAULT_MODEL)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": get_priority_advisor_prompt(
            title, description, current_priority, other_tasks
        )}
    ]

    result = await provider.invoke_structured(PriorityAdvisorOutput, messages)

    return {
        "recommendedPriority": result.recommendedPriority.value,
        "reasoning": result.reasoning,
        "urgencyScore": result.urgencyScore,
        "impactScore": result.impactScore,
        "factors": result.factors,
        "confidence": result.confidence,
        "provider": DEFAULT_PROVIDER,
        "model": DEFAULT_MODEL
    }
```

---

## API Routes

```python
# src/api/routes/ai.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from src.core.security import get_current_user
from src.ai.features import task_ai, goal_ai, metric_ai, habit_ai
from src.ai.config import has_api_key

router = APIRouter()

class ParseTaskRequest(BaseModel):
    input: str

class BreakdownTaskRequest(BaseModel):
    title: str
    description: str | None = None
    area: str

class PriorityAdvisorRequest(BaseModel):
    title: str
    description: str | None = None
    currentPriority: str
    otherTasks: list[dict] = []

@router.post("/tasks/parse")
async def parse_task(
    request: ParseTaskRequest,
    user: dict = Depends(get_current_user)
):
    """Parse natural language into structured task."""
    if not has_api_key("anthropic"):
        raise HTTPException(
            status_code=503,
            detail="LLM not configured. Please add API key in settings."
        )

    try:
        result = await task_ai.parse_task(request.input)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.post("/tasks/breakdown")
async def breakdown_task(
    request: BreakdownTaskRequest,
    user: dict = Depends(get_current_user)
):
    """Break task into subtasks."""
    try:
        result = await task_ai.breakdown_task(
            request.title,
            request.description,
            request.area
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.post("/tasks/prioritize")
async def advise_priority(
    request: PriorityAdvisorRequest,
    user: dict = Depends(get_current_user)
):
    """Get priority recommendation."""
    try:
        result = await task_ai.advise_priority(
            request.title,
            request.description,
            request.currentPriority,
            request.otherTasks
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

# Add more endpoints for other AI features...
```

---

## Dependencies

Add to `requirements.txt`:

```
# LangChain
langchain>=0.3.0
langchain-core>=0.3.0
langchain-anthropic>=0.3.0
langchain-openai>=0.3.0
langchain-google-genai>=2.0.0
langchain-groq>=0.2.0

# Pydantic (for structured output)
pydantic>=2.0.0

# AWS
boto3>=1.35.0
```

---

## Caching AI Results

For expensive AI operations (pattern analysis, correlations), cache results in DynamoDB:

```python
# src/ai/cache.py
from datetime import datetime, timedelta
from src.db.dynamodb import get_table
from src.utils.ids import generate_id

CACHE_DURATION_HOURS = 24

async def get_cached_insight(
    metric_id: str,
    insight_type: str
) -> dict | None:
    """Get cached AI insight if not expired."""
    table = get_table()

    # Query for latest insight of this type
    response = table.query(
        KeyConditionExpression="pk = :pk AND begins_with(sk, :sk_prefix)",
        ExpressionAttributeValues={
            ":pk": f"METRIC#{metric_id}",
            ":sk_prefix": f"INSIGHT#{insight_type}#"
        },
        ScanIndexForward=False,  # Latest first
        Limit=1
    )

    if not response['Items']:
        return None

    item = response['Items'][0]

    # Check if expired
    expires_at = datetime.fromisoformat(item['expiresAt'].replace('Z', '+00:00'))
    if datetime.now(expires_at.tzinfo) > expires_at:
        return None

    return item['content']

async def cache_insight(
    metric_id: str,
    insight_type: str,
    content: dict,
    user_id: str
) -> None:
    """Cache AI insight with TTL."""
    table = get_table()
    now = datetime.utcnow()
    expires_at = now + timedelta(hours=CACHE_DURATION_HOURS)
    ttl = int(expires_at.timestamp())

    item = {
        "pk": f"METRIC#{metric_id}",
        "sk": f"INSIGHT#{insight_type}#{now.isoformat()}Z",
        "entityType": "METRIC_INSIGHT",
        "type": insight_type,
        "content": content,
        "cachedAt": now.isoformat() + "Z",
        "expiresAt": expires_at.isoformat() + "Z",
        "ttl": ttl,
        "userId": user_id
    }

    table.put_item(Item=item)
```

---

## Frontend Updates

Frontend reference (current implementation in `src/lib/llm/api-llm-adapter.ts`):

```typescript
// src/lib/llm/api-llm-adapter.ts
import { apiClient } from '../api-client';

export class APILLMAdapter implements ILLMAdapter {
  async parseNaturalLanguageTask(input: ParseTaskInput): Promise<LLMResponse<ParseTaskOutput>> {
    const response = await apiClient.post<{ data: AIResponse<ParseTaskOutput> }>(
      '/ai/tasks/parse',
      { input: input.text }
    );

    if (response.success && response.data) {
      const aiResponse = response.data.data;
      return { data: aiResponse.result, error: null, success: true, usage: undefined };
    }

    return { data: null, error: response.error?.message || 'AI request failed', success: false };
  }

  async breakdownTask(input: TaskBreakdownInput): Promise<LLMResponse<TaskBreakdownOutput>> {
    const response = await apiClient.post('/ai/tasks/breakdown', {
      title: input.task.title,
      description: input.task.description,
      area: input.task.area,
    });
    return response;
  }

  // ... other AI features map to /ai/* endpoints and unwrap data.result
}
```

The adapter expects backend responses shaped like:

```typescript
// src/lib/llm/llm-config.ts
{
  "success": true,
  "data": {
    "result": { ... },
    "confidence": 0.92,
    "reasoning": "Based on the analysis...",
    "provider": "anthropic",
    "model": "claude-sonnet-4-20250514",
    "cached": false
  }
}
```
