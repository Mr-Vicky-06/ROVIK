# ROVIK Staged Roadmap

## Stage 0: Product Vision and Platform Identity

**Goal:** Define what ROVIK is and what it must become.

**Deliverables:**

- Product positioning and platform philosophy
- Engineering principles
- AI-native operating model
- Realtime logistics vision
- Investor-grade product narrative

**Current status:** Captured in `docs/platform-blueprint.md`.

## Stage 1: System Blueprint and Engineering Architecture

**Goal:** Define the foundational architecture before major scale investments.

**Deliverables:**

- Monorepo architecture
- Backend and frontend module boundaries
- Event architecture
- WebSocket architecture
- Domain model
- API contracts
- Database schema
- Operational workflow diagrams

**Current status:** In progress through `docs/architecture.md`, `docs/stage-1-modules.md`, and the initial FastAPI/Next.js implementation.

## Stage 2: Infrastructure Foundation

**Goal:** Make development reproducible and deployment-ready.

**Deliverables:**

- Docker Compose local platform
- PostgreSQL/PostGIS service
- Redis service
- Backend and frontend containers
- Environment templates
- CI pipeline
- Linting, typechecking, test commands
- Shared package layout

**Current status:** Partially implemented. Docker Compose, CI, env templates, and frontend verification exist. Backend Python verification depends on a Python-capable local or container runtime.

## Stage 3: Core Backend Operational Systems

**Goal:** Build the operational backend core.

**Deliverables:**

- Supabase JWT authentication
- RBAC policies
- User and tenant boundaries
- Rider management
- Delivery management
- Route management
- Dispatch workflows
- Repository-backed operational state
- Standardized errors and response contracts

**Next implementation focus:** Replace in-memory delivery and rider storage with repository-backed PostgreSQL/PostGIS adapters.

## Stage 4: Optimization and Routing Engine

**Goal:** Build the operational intelligence core.

**Deliverables:**

- OR-Tools VRP implementation
- Multi-rider assignment
- Capacity constraints
- Priority-aware routing
- Workload balancing
- ETA estimation
- OSRM matrix provider
- Route geometry provider
- Route score explanations

**Next implementation focus:** Add OSRM adapter behind `RoutingService` and improve OR-Tools dimensions for time, capacity, priority, and SLA windows.

## Stage 5: Realtime Operational Infrastructure

**Goal:** Make the platform low-latency and event-driven.

**Deliverables:**

- Redis Pub/Sub event bus
- WebSocket tenant rooms
- Rider location streaming
- Dispatch event fanout
- Route update events
- Reconnect strategy
- Event persistence
- WebSocket tests

**Next implementation focus:** Bridge Redis Pub/Sub into WebSocket fanout so API-created events reach connected dashboards.

## Stage 6: Frontend Operational Platform

**Goal:** Build the premium dispatch command center.

**Deliverables:**

- Realtime operational dashboard
- Dispatch control center
- Fleet monitoring
- Route visualization
- Rider tracking
- Event center
- Analytics surfaces
- AI insight surfaces
- Responsive layouts

**Current status:** Premium command-center shell implemented in the Next.js app.

## Stage 7: Rider Experience Platform

**Goal:** Build a mobile-first rider operational experience.

**Deliverables:**

- Active delivery workflow
- Route progression
- Navigation state
- Delivery actions
- Proof-of-delivery media
- Operational alerts
- Earnings overview
- Offline/online mode

**Next implementation focus:** Add `/rider` responsive route with delivery execution state machine.

## Stage 8: AI Operational Intelligence Layer

**Goal:** Build AI-assisted operational reasoning.

**Deliverables:**

- AI operational assistant
- Dispatch recommendations
- Route explanations
- Risk summaries
- Natural language operational queries
- Decision audit trail
- Structured tool contracts for AI workflows

**Design rule:** AI must behave as a logistics copilot, not a generic chatbot.

## Stage 9: Conversational Intelligence and Voice AI

**Goal:** Add realtime conversation and voice workflows.

**Deliverables:**

- LiveKit integration
- Voice command streaming
- Dispatcher voice workflows
- Rider voice copilot
- Low-latency operational context injection
- Conversation event logging

**Constraint:** Do not implement until operational state and event contracts are stable.

## Stage 10: Analytics and Predictive Intelligence

**Goal:** Convert operational data into predictions and decisions.

**Deliverables:**

- Delivery analytics
- Rider analytics
- SLA analytics
- Fuel and cost analytics
- Predictive ETA
- Delay prediction
- Efficiency scoring
- Operational insight generation

## Stage 11: Investor and Production Readiness

**Goal:** Make ROVIK presentation-ready and operationally credible.

**Deliverables:**

- Demo data scenarios
- Polished workflows
- Performance tuning
- Observability stack
- Deployment guides
- Architecture diagrams
- Product narrative
- Reliability hardening

## Stage 12: Enterprise Scaling and Autonomous AI

**Goal:** Evolve into globally scalable logistics intelligence infrastructure.

**Deliverables:**

- Kubernetes deployment
- Kafka event backbone
- Distributed optimization
- Microservice extraction
- AI orchestration platform
- Autonomous dispatch policies
- Simulation and stress testing
- Multi-region realtime infrastructure

**Trigger:** Begin only when product-market workflows and operational contracts are proven.
