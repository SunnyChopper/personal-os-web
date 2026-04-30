# Backend Scaffold Prompt Template

> **Superseded for IaC:** The backend repo uses **Terraform** + **`npm run deploy:*`** (monorepo [`docs/backend/DEPLOYMENT.md`](../../docs/backend/DEPLOYMENT.md)). This file is **historical** scaffolding text.

**Purpose:** This document serves as the primary prompt template for scaffolding the Personal OS backend API. Use this with an AI coding assistant to generate the complete backend project structure.

**Last Updated:** January 2026

---

## Project Overview

Create a Python backend API for **Personal OS** (FastAPI on AWS Lambda), a personal productivity and growth tracking system. The backend replaces localStorage-based persistence with production-grade AWS infrastructure.

### Technical Stack

| Component          | Technology              | Rationale                                            |
| ------------------ | ----------------------- | ---------------------------------------------------- |
| **Runtime**        | Python 3.12             | LangChain native support, AWS Lambda compatibility   |
| **Framework**      | FastAPI + Mangum        | Modern async API, auto OpenAPI docs, Lambda adapter  |
| **IaC**            | Terraform (`infrastructure/envs-api/`) + deploy scripts | API resources + Lambda code |
| **Database**       | DynamoDB (single-table) | Pay-per-use, scales to zero              |
| **Authentication** | AWS Cognito User Pool   | Managed auth, JWT tokens, email/password             |
| **Secrets**        | AWS Secrets Manager     | Secure LLM API key storage                           |
| **API Gateway**    | HTTP API (v2)           | Lower cost, faster than REST API                     |
| **Domain**         | api.sunnysingh.tech     | Custom domain via ACM + API Gateway                  |

### Environments

| Environment | Purpose             | API Endpoint                                     |
| ----------- | ------------------- | ------------------------------------------------ |
| **dev**     | Development/testing | `dev-api.sunnysingh.tech` or API Gateway default |
| **prod**    | Production          | `api.sunnysingh.tech`                            |

---

## Prompt: Scaffold Backend Project

````
You are an expert Python backend developer. Create a complete Lambda-hosted backend project for Personal OS with the following specifications:

### Project Structure

personal-os-api/
├── infrastructure/envs-api/     # Terraform API stack (monorepo layout)
├── requirements.txt            # Python dependencies
├── requirements-dev.txt        # Dev dependencies (pytest, black, mypy)
├── pyproject.toml             # Python project config
├── .env.example               # Environment variables template
├── .gitignore
├── README.md
│
├── src/
│   ├── __init__.py
│   ├── main.py                # FastAPI app entry point
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py            # Shared dependencies (auth, db)
│   │   │
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py        # Auth endpoints (signup, login, refresh)
│   │   │   ├── tasks.py       # Tasks CRUD
│   │   │   ├── goals.py       # Goals CRUD + progress
│   │   │   ├── metrics.py     # Metrics CRUD + logs
│   │   │   ├── habits.py      # Habits CRUD + logs
│   │   │   ├── projects.py    # Projects CRUD
│   │   │   ├── logbook.py     # Logbook entries CRUD
│   │   │   ├── rewards.py     # Rewards + wallet
│   │   │   ├── knowledge.py   # Knowledge Vault endpoints
│   │   │   └── ai.py          # LLM proxy endpoints
│   │   │
│   │   └── schemas/
│   │       ├── __init__.py
│   │       ├── common.py      # Shared Pydantic models
│   │       ├── auth.py
│   │       ├── tasks.py
│   │       ├── goals.py
│   │       ├── metrics.py
│   │       ├── habits.py
│   │       ├── projects.py
│   │       ├── logbook.py
│   │       ├── rewards.py
│   │       ├── knowledge.py
│   │       └── ai.py
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py          # Settings management (pydantic-settings)
│   │   ├── security.py        # JWT validation, Cognito integration
│   │   └── exceptions.py      # Custom exception handlers
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── dynamodb.py        # DynamoDB client wrapper
│   │   ├── models.py          # Entity models with DynamoDB operations
│   │   └── queries.py         # Complex query patterns
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── tasks.py
│   │   ├── goals.py
│   │   ├── goal_progress.py   # Progress calculation (cached)
│   │   ├── metrics.py
│   │   ├── metric_milestones.py
│   │   ├── habits.py
│   │   ├── projects.py
│   │   ├── logbook.py
│   │   ├── rewards.py
│   │   ├── wallet.py
│   │   └── knowledge.py
│   │
│   ├── ai/
│   │   ├── __init__.py
│   │   ├── config.py          # LLM provider configuration
│   │   ├── providers/
│   │   │   ├── __init__.py
│   │   │   ├── base.py        # Abstract base provider
│   │   │   ├── anthropic.py
│   │   │   ├── openai.py
│   │   │   ├── gemini.py
│   │   │   └── groq.py
│   │   ├── schemas/           # Zod-equivalent Pydantic schemas for AI outputs
│   │   │   ├── __init__.py
│   │   │   ├── task_schemas.py
│   │   │   ├── goal_schemas.py
│   │   │   ├── metric_schemas.py
│   │   │   └── habit_schemas.py
│   │   ├── prompts/
│   │   │   ├── __init__.py
│   │   │   ├── system.py      # System prompts
│   │   │   ├── tasks.py       # Task-related prompts
│   │   │   ├── goals.py
│   │   │   ├── metrics.py
│   │   │   └── habits.py
│   │   └── features/
│   │       ├── __init__.py
│   │       ├── task_ai.py     # 7 task AI features
│   │       ├── goal_ai.py     # 7 goal AI features
│   │       ├── metric_ai.py   # 6 metric AI features
│   │       ├── habit_ai.py    # 6 habit AI features
│   │       ├── project_ai.py  # 3 project AI features
│   │       └── logbook_ai.py  # 6 logbook AI features
│   │
│   └── utils/
│       ├── __init__.py
│       ├── ids.py             # ID generation (ULID or similar)
│       ├── dates.py           # Date utilities
│       └── analytics.py       # Metric analytics (trend, correlation, prediction)
│
├── handlers/
│   ├── __init__.py
│   ├── auth_handler.py        # Lambda handler for auth domain
│   ├── tasks_handler.py       # Lambda handler for tasks domain
│   ├── goals_handler.py       # Lambda handler for goals domain
│   ├── metrics_handler.py     # Lambda handler for metrics domain
│   ├── habits_handler.py      # Lambda handler for habits domain
│   ├── projects_handler.py    # Lambda handler for projects domain
│   ├── logbook_handler.py     # Lambda handler for logbook domain
│   ├── rewards_handler.py     # Lambda handler for rewards domain
│   ├── knowledge_handler.py   # Lambda handler for knowledge vault
│   └── ai_handler.py          # Lambda handler for AI/LLM features
│
└── tests/
    ├── __init__.py
    ├── conftest.py            # Pytest fixtures
    ├── test_auth.py
    ├── test_tasks.py
    ├── test_goals.py
    ├── test_metrics.py
    ├── test_habits.py
    └── test_ai.py

### DynamoDB Single-Table Design

Use a single DynamoDB table with composite primary key:

Table Name: `personal-os-{stage}` (e.g., personal-os-dev, personal-os-prod)

Primary Key:
- PK (Partition Key): String
- SK (Sort Key): String

Access Patterns:

| Access Pattern | PK | SK | Notes |
|----------------|----|----|-------|
| Get user | `USER#{userId}` | `PROFILE` | User profile data |
| List user's tasks | `USER#{userId}` | `TASK#{taskId}` | All tasks for user |
| Get single task | `USER#{userId}` | `TASK#{taskId}` | Specific task |
| List user's goals | `USER#{userId}` | `GOAL#{goalId}` | All goals for user |
| Get goal | `USER#{userId}` | `GOAL#{goalId}` | Specific goal |
| List goal's linked tasks | `GOAL#{goalId}` | `TASK#{taskId}` | Junction: goal→tasks |
| List task's dependencies | `TASK#{taskId}` | `DEP#{dependsOnTaskId}` | Task dependencies |
| List metric logs | `METRIC#{metricId}` | `LOG#{timestamp}` | Time-series logs |
| List habit logs | `HABIT#{habitId}` | `LOG#{date}` | Daily completion logs |
| List logbook entries | `USER#{userId}` | `LOGBOOK#{date}` | Daily entries |
| List rewards | `USER#{userId}` | `REWARD#{rewardId}` | Available rewards |
| Get wallet | `USER#{userId}` | `WALLET` | Points balance |
| List metric milestones | `METRIC#{metricId}` | `MILESTONE#{milestoneId}` | Achievements |
| List AI insights (cached) | `METRIC#{metricId}` | `INSIGHT#{type}#{timestamp}` | Cached AI results |

Global Secondary Index (GSI1):
- GSI1PK: `{entityType}` (e.g., "TASK", "GOAL")
- GSI1SK: `{status}#{createdAt}`
- Purpose: Query all entities of a type by status

Global Secondary Index (GSI2):
- GSI2PK: `{area}` (e.g., "Health", "Wealth")
- GSI2SK: `{entityType}#{createdAt}`
- Purpose: Query entities by life area

### Entity Attributes

All entities include:
- `pk`: Partition key
- `sk`: Sort key
- `entityType`: "TASK" | "GOAL" | "METRIC" | etc.
- `userId`: Owner user ID
- `createdAt`: ISO timestamp
- `updatedAt`: ISO timestamp
- `ttl`: Optional TTL for cached data

### Cognito Integration

1. Create Cognito User Pool with email/password authentication
2. Lambda validates JWT from Authorization header
3. Extract `sub` claim as `userId`
4. All queries scoped to authenticated user's data

### Terraform + routes (monorepo)

Define API resources in **`infrastructure/envs-api/`** and HTTP routes in **`data/http_routes.json`**. Legacy scaffold expected:
- Provider: aws, runtime: python3.12, region: us-east-1
- Custom domain: api.sunnysingh.tech (prod), dev-api.sunnysingh.tech (dev)
- Environment variables: STAGE, TABLE_NAME, COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID
- IAM permissions: DynamoDB, Secrets Manager, Cognito
- HTTP API with JWT authorizer (Cognito)
- Multiple Lambda functions + Docker-built layer (`docs/backend/DEPLOYMENT.md`)

### FastAPI App Structure

Each domain has a FastAPI router. The main app includes all routers:

```python
# src/main.py
from fastapi import FastAPI
from mangum import Mangum
from src.api.routes import auth, tasks, goals, metrics, habits, projects, logbook, rewards, knowledge, ai

app = FastAPI(title="Personal OS API", version="1.0.0")

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
app.include_router(goals.router, prefix="/goals", tags=["Goals"])
app.include_router(metrics.router, prefix="/metrics", tags=["Metrics"])
app.include_router(habits.router, prefix="/habits", tags=["Habits"])
app.include_router(projects.router, prefix="/projects", tags=["Projects"])
app.include_router(logbook.router, prefix="/logbook", tags=["Logbook"])
app.include_router(rewards.router, prefix="/rewards", tags=["Rewards"])
app.include_router(knowledge.router, prefix="/knowledge", tags=["Knowledge"])
app.include_router(ai.router, prefix="/ai", tags=["AI"])

# Lambda handler
handler = Mangum(app)
````

### API Endpoints

See docs/backend/API_ENDPOINTS.md for complete endpoint specifications.

### LLM Integration

1. Store API keys in AWS Secrets Manager: `personal-os/{stage}/llm-keys`
2. Create provider factory pattern (similar to frontend)
3. Use LangChain Python SDK for structured outputs
4. Cache expensive AI results in DynamoDB with TTL

### Goal Progress Calculation (Backend)

Move progress calculation to backend:

1. When task completes → trigger progress recalculation
2. When metric logged → check milestones + update goal progress
3. Store `cachedProgress` on Goal entity
4. Return cached value on read, recalculate on write

Generate the complete project with all files. Use type hints throughout. Follow Python best practices (Black formatting, type annotations, docstrings).

````

---

## Supporting Documentation

The following documents provide detailed specifications for each component:

| Document | Purpose |
|----------|---------|
| [`docs/backend/API_ENDPOINTS.md`](./backend/API_ENDPOINTS.md) | Complete REST API specification |
| [`docs/backend/DATA_MODELS.md`](./backend/DATA_MODELS.md) | DynamoDB schema and entity definitions |
| [`docs/backend/AUTH_INTEGRATION.md`](./backend/AUTH_INTEGRATION.md) | Cognito setup and JWT validation |
| [`docs/backend/LLM_INTEGRATION.md`](./backend/LLM_INTEGRATION.md) | Python LangChain port guide |
| [`docs/backend/DEPLOYMENT_GUIDE.md`](./backend/DEPLOYMENT_GUIDE.md) | Step-by-step deployment instructions |
| [`docs/backend/IMPLEMENTATION_PLAN.md`](./backend/IMPLEMENTATION_PLAN.md) | Phased implementation strategy |

---

## Quick Start Commands

After scaffolding, use these commands:

```bash
# Install dependencies
cd personal-os-api
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Local development
uvicorn src.main:app --reload --port 8000

# Deploy to dev (from monorepo root)
npm run deploy:dev

# Deploy to prod
npm run deploy:prod

# View logs (example)
aws logs tail /aws/lambda/personal-os-api-dev-api --follow

# Run tests
pytest tests/ -v
````

---

## Frontend Integration

After backend deployment, update the frontend:

1. Set `VITE_API_URL=https://api.sunnysingh.tech` in `.env`
2. Switch storage adapter: `storageConfig.setStorageType('api')`
3. Implement Cognito auth in `AuthContext.tsx`
4. Update `APIStorageAdapter` to include JWT in Authorization header

See [`PERSONAL_OS_ARCHITECTURE.md`](./PERSONAL_OS_ARCHITECTURE.md) for current frontend architecture.
