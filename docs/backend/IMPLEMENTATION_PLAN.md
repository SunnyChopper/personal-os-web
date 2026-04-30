# Backend Implementation Plan

> **Superseded for infra/deploy:** Canonical backend lives in **`personal-os-backend/`** with Terraform **`infrastructure/envs-api/`** and **`npm run deploy:*`**. See monorepo [`docs/backend/DEPLOYMENT.md`](../../../docs/backend/DEPLOYMENT.md).

**Objective:** Build a production-ready backend API for Personal OS  
**Timeline Estimate:** 4-6 weeks (solo developer, part-time)  
**Approach:** Phased rollout with vertical slices

---

## Overview

The implementation is divided into 6 phases, each delivering a working vertical slice that can be tested end-to-end. This approach allows for:

- Early validation of architecture decisions
- Incremental value delivery
- Easier debugging and testing
- Flexibility to adjust scope

---

## Phase 0: Project Setup & Infrastructure (Days 1-2)

**Goal:** Establish project structure, deploy infrastructure, verify connectivity.

### Tasks

- [ ] Create backend repository with project structure
- [ ] Configure API routes (`infrastructure/envs-api/data/http_routes.json`) and Terraform `envs-api/`
- [ ] Set up Python virtual environment and dependencies
- [ ] Deploy DynamoDB table (empty)
- [ ] Deploy Cognito User Pool
- [ ] Request and validate ACM certificate
- [ ] Configure custom domain DNS (CNAME records)
- [ ] Create LLM API keys secret in Secrets Manager
- [ ] Create initial admin user in Cognito
- [ ] Deploy empty Lambda functions (smoke test)
- [ ] Verify API Gateway endpoint responds (health check)

### Deliverables

- [ ] Infrastructure deployed to `dev` environment
- [ ] `GET /health` endpoint returns 200
- [ ] DNS configured for `dev-api.sunnysingh.tech`

### Prompt Template

```
Create the initial project structure for personal-os-api backend with:
1. FastAPI application skeleton with health check endpoint
2. src/main.py with Mangum handler
3. handlers/health_handler.py
4. src/core/config.py with pydantic-settings for environment variables
5. .env.example with all required variables
6. Basic HTTP route map + health Lambda wired in Terraform

The health endpoint should return:
{ "status": "healthy", "stage": "{stage}", "timestamp": "..." }
```

---

## Phase 1: Authentication (Days 3-5)

**Goal:** Implement complete auth flow with Cognito.

### Tasks

- [ ] Implement `/auth/signup` endpoint
- [ ] Implement `/auth/login` endpoint
- [ ] Implement `/auth/refresh` endpoint
- [ ] Implement `/auth/me` endpoint
- [ ] Create JWT validation middleware (`src/core/security.py`)
- [ ] Add `get_current_user` dependency
- [ ] Test auth flow with curl/Postman
- [ ] Update frontend `AuthContext.tsx` to use API
- [ ] Test frontend login flow

### Deliverables

- [ ] All auth endpoints working
- [ ] JWT validation on protected routes
- [ ] Frontend can login and access protected resources

### Prompt Template

```
Implement authentication for personal-os-api:

1. src/api/routes/auth.py with endpoints:
   - POST /auth/signup (create Cognito user)
   - POST /auth/login (authenticate, return tokens)
   - POST /auth/refresh (refresh access token)
   - GET /auth/me (get current user from JWT)

2. src/api/schemas/auth.py with Pydantic models:
   - SignupRequest, SignupResponse
   - LoginRequest, LoginResponse
   - RefreshRequest, RefreshResponse
   - UserResponse

3. src/core/security.py with:
   - JWT validation using PyJWT and Cognito JWKS
   - get_current_user FastAPI dependency
   - Cached JWKS client for performance

Use boto3 cognito-idp client for Cognito operations.
Handle all Cognito exceptions with appropriate HTTP errors.
```

---

## Phase 2: Core CRUD - Tasks & Goals (Days 6-12)

**Goal:** Implement Tasks and Goals with full CRUD and relationships.

### Tasks

#### DynamoDB Layer

- [ ] Create `src/db/dynamodb.py` with table client wrapper
- [ ] Create `src/db/models.py` with entity helpers
- [ ] Create `src/utils/ids.py` for ID generation (ULID)

#### Tasks Service

- [ ] Implement `TasksService` with CRUD operations
- [ ] Implement task dependencies (separate items)
- [ ] Implement task completion (points calculation)
- [ ] Create task routes with all endpoints
- [ ] Test task CRUD via API

#### Goals Service

- [ ] Implement `GoalsService` with CRUD operations
- [ ] Implement success criteria (embedded)
- [ ] Implement goal-task linking (separate items)
- [ ] Create goal routes with all endpoints
- [ ] Test goal CRUD via API

#### Goal Progress

- [ ] Implement `GoalProgressService`
- [ ] Calculate progress from criteria, tasks
- [ ] Cache progress on goal entity
- [ ] Trigger recalculation on task completion

#### Frontend Integration

- [ ] Update `APIStorageAdapter` to include auth headers
- [ ] Test Tasks page against API
- [ ] Test Goals page against API

### Deliverables

- [ ] Tasks CRUD working end-to-end
- [ ] Goals CRUD working end-to-end
- [ ] Goal progress calculation working
- [ ] Frontend Tasks/Goals pages functional

### Prompt Template (Tasks)

```
Implement Tasks service for personal-os-api:

1. src/db/dynamodb.py:
   - get_table() function returning DynamoDB table resource
   - Generic query helpers

2. src/db/models.py:
   - TaskModel with to_dict() and from_dict()
   - DynamoDB key patterns for tasks

3. src/services/tasks.py (TasksService):
   - list_tasks(user_id, filters) -> list[Task]
   - get_task(user_id, task_id) -> Task
   - create_task(user_id, data) -> Task
   - update_task(user_id, task_id, data) -> Task
   - delete_task(user_id, task_id) -> bool
   - complete_task(user_id, task_id) -> Task (calculates points)

4. src/api/routes/tasks.py:
   - All CRUD endpoints
   - Dependency endpoints
   - Use get_current_user for user_id

5. src/api/schemas/tasks.py:
   - CreateTaskRequest, UpdateTaskRequest
   - TaskResponse, TaskListResponse

Use single-table design with:
- PK: USER#{userId}
- SK: TASK#{taskId}

Include GSI attributes for status/area queries.
```

---

## Phase 3: Metrics & Habits (Days 13-18)

**Goal:** Implement Metrics and Habits with time-series logs.

### Tasks

#### Metrics Service

- [ ] Implement `MetricsService` with CRUD
- [ ] Implement metric logs (separate items, time-sorted SK)
- [ ] Implement milestone detection
- [ ] Implement analytics calculations (trend, progress)
- [ ] Create metric routes with all endpoints

#### Habits Service

- [ ] Implement `HabitsService` with CRUD
- [ ] Implement habit logs (date-based SK)
- [ ] Implement streak calculation
- [ ] Create habit routes with all endpoints
- [ ] Create `/habits/today` endpoint

#### Goal Progress Extension

- [ ] Add metrics progress to goal calculation
- [ ] Add habits progress to goal calculation
- [ ] Implement goal-metric and goal-habit linking

#### Frontend Integration

- [ ] Test Metrics page against API
- [ ] Test Habits page against API

### Deliverables

- [ ] Metrics CRUD + logs working
- [ ] Habits CRUD + logs working
- [ ] Milestones detected on metric log
- [ ] Complete goal progress calculation

### Prompt Template (Metrics)

```
Implement Metrics service for personal-os-api:

1. src/services/metrics.py (MetricsService):
   - CRUD operations for metrics
   - add_log(user_id, metric_id, value, notes) -> MetricLog
   - get_logs(metric_id, start_date, end_date) -> list[MetricLog]
   - get_analytics(metric_id) -> dict (trend, progress, streak)

2. src/services/metric_milestones.py:
   - detect_milestones(metric, logs) -> list[Milestone]
   - Check: target_reached, streak_7/30/100, improvement_10/25/50
   - Award points via wallet service

3. Metric logs use separate items:
   - PK: METRIC#{metricId}
   - SK: LOG#{timestamp}

4. Milestones use:
   - PK: METRIC#{metricId}
   - SK: MILESTONE#{milestoneId}

5. Include analytics calculations:
   - Trend (velocity, acceleration)
   - Progress toward target
   - Streak count
```

---

## Phase 4: Projects, Logbook, Rewards (Days 19-24)

**Goal:** Complete remaining entity types.

### Tasks

#### Projects Service

- [ ] Implement `ProjectsService` with CRUD
- [ ] Implement project-task linking
- [ ] Implement project health calculation
- [ ] Create project routes

#### Logbook Service

- [ ] Implement `LogbookService` with CRUD
- [ ] Implement entity linking (embedded arrays)
- [ ] Create logbook routes

#### Rewards Service

- [ ] Implement `RewardsService` with CRUD
- [ ] Implement `WalletService`
- [ ] Implement reward redemption
- [ ] Create rewards and wallet routes

#### Frontend Integration

- [ ] Test Projects page
- [ ] Test Logbook page
- [ ] Test Rewards page

### Deliverables

- [ ] All entity types implemented
- [ ] Complete CRUD for all domains
- [ ] Wallet system working

---

## Phase 5: AI Features (Days 25-32)

**Goal:** Port LangChain implementation to backend.

### Tasks

#### AI Infrastructure

- [ ] Implement Secrets Manager integration (`src/ai/config.py`)
- [ ] Implement provider factory (`src/ai/providers/`)
- [ ] Create base provider abstract class
- [ ] Implement Anthropic, OpenAI, Gemini, Groq providers

#### AI Schemas

- [ ] Port all Zod schemas to Pydantic (`src/ai/schemas/`)
- [ ] Task schemas (parse, breakdown, priority, effort, categorize)
- [ ] Goal schemas (refine, criteria, cascade, forecast)
- [ ] Metric schemas (patterns, anomalies, correlations, predict)
- [ ] Habit schemas (design, stack, recovery)

#### AI Features

- [ ] Implement Task AI features (7 features)
- [ ] Implement Goal AI features (7 features)
- [ ] Implement Metric AI features (6 features)
- [ ] Implement Habit AI features (6 features)
- [ ] Implement Project AI features (3 features)
- [ ] Implement Logbook AI features (6 features)

#### AI Routes

- [ ] Create `/ai/*` routes
- [ ] Implement caching for expensive operations

#### Frontend Integration

- [ ] Update `llm-config.ts` to use API adapter
- [ ] Create `APILLMAdapter` implementation
- [ ] Test AI features via UI

### Deliverables

- [ ] All 33 AI features working via backend
- [ ] API keys securely stored in Secrets Manager
- [ ] AI results cached where appropriate
- [ ] Frontend using backend for all AI calls

### Prompt Template (AI)

```
Implement AI features for personal-os-api:

1. src/ai/config.py:
   - get_llm_keys() from Secrets Manager (cached)
   - get_api_key(provider) -> str
   - has_api_key(provider) -> bool

2. src/ai/providers/:
   - base.py: BaseLLMProvider abstract class
   - anthropic.py, openai.py, gemini.py, groq.py
   - Factory function: create_provider(type, api_key, model)
   - Use LangChain with structured output

3. src/ai/schemas/:
   - task_schemas.py: ParseTaskOutput, TaskBreakdownOutput, etc.
   - goal_schemas.py: GoalRefinementOutput, SuccessCriteriaOutput, etc.
   - Port from frontend Zod schemas to Pydantic

4. src/ai/features/task_ai.py:
   - parse_task(text) -> dict
   - breakdown_task(title, desc, area) -> dict
   - advise_priority(title, desc, current, others) -> dict
   - estimate_effort(title, desc, similar) -> dict
   - categorize_task(title, desc) -> dict

5. src/api/routes/ai.py:
   - POST /ai/tasks/parse
   - POST /ai/tasks/breakdown
   - POST /ai/tasks/prioritize
   - etc.

Use same prompts as frontend (port from llm-prompts.ts).
```

---

## Phase 6: Knowledge Vault & Polish (Days 33-40)

**Goal:** Implement Knowledge Vault and production hardening.

### Tasks

#### Knowledge Vault

- [ ] Implement courses service
- [ ] Implement flashcards service
- [ ] Implement skill tree service
- [ ] Create knowledge routes

#### Production Hardening

- [ ] Add comprehensive error handling
- [ ] Add request validation
- [ ] Add rate limiting
- [ ] Add request logging
- [ ] Add monitoring (CloudWatch metrics)
- [ ] Security audit

#### Testing

- [ ] Write unit tests for services
- [ ] Write integration tests for routes
- [ ] Load testing

#### Production Deployment

- [ ] Deploy to `prod` environment
- [ ] Configure `api.sunnysingh.tech`
- [ ] Update frontend to use prod API
- [ ] Smoke test all features

### Deliverables

- [ ] Knowledge Vault working
- [ ] Production-ready API
- [ ] Deployed to production
- [ ] Frontend using production backend

---

## Implementation Checklist Summary

### Phase 0: Setup

- [ ] Project structure created
- [ ] Infrastructure deployed (DynamoDB, Cognito)
- [ ] Custom domain configured
- [ ] Health check working

### Phase 1: Auth

- [ ] Signup/Login/Refresh working
- [ ] JWT validation working
- [ ] Frontend auth integrated

### Phase 2: Tasks & Goals

- [ ] Tasks CRUD working
- [ ] Goals CRUD working
- [ ] Task-Goal linking working
- [ ] Goal progress calculation working

### Phase 3: Metrics & Habits

- [ ] Metrics CRUD + logs working
- [ ] Habits CRUD + logs working
- [ ] Milestones + wallet working
- [ ] Complete goal progress

### Phase 4: Projects, Logbook, Rewards

- [ ] Projects working
- [ ] Logbook working
- [ ] Rewards + wallet working

### Phase 5: AI Features

- [ ] 33 AI features ported
- [ ] Secrets Manager integration
- [ ] Frontend using API for AI

### Phase 6: Knowledge Vault & Production

- [ ] Knowledge Vault working
- [ ] Production deployed
- [ ] All features tested

---

## Risk Mitigation

| Risk               | Mitigation                                         |
| ------------------ | -------------------------------------------------- |
| Cold start latency | Use provisioned concurrency for critical functions |
| LLM API costs      | Implement caching, use cost-optimized model mix    |
| DynamoDB costs     | Start with on-demand, monitor usage                |
| Scope creep        | Stick to phased plan, defer nice-to-haves          |
| Auth complexity    | Use Cognito managed service, minimal custom code   |

---

## Success Criteria

The backend is complete when:

1. **All frontend features work** against the API (no localStorage fallback)
2. **Data persists** across devices and sessions
3. **Authentication is secure** with proper JWT handling
4. **AI features work** with backend-proxied LLM calls
5. **Performance is acceptable** (< 500ms for CRUD, < 5s for AI)
6. **Costs are reasonable** (< $20/month for solo user)

---

## Next Steps After MVP

1. **Task Scheduler Agent** - LangGraph-based intelligent scheduling
2. **Goal Builder Agent** - Guided goal creation workflow
3. **Enhanced Weekly Review** - AI-powered insights
4. **Mobile Push Notifications** - Habit reminders
5. **Data Export/Import** - Backup functionality
