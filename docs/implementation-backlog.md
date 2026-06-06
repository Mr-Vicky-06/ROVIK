# Implementation Backlog

## Now: Stage 1 Hardening

- Replace in-memory rider and delivery stores with repository-backed PostgreSQL adapters.
- Persist operational events through `OperationalEventModel`.
- Bridge Redis Pub/Sub events into WebSocket tenant channels.
- Add route entities and route persistence.
- Add standardized API response envelopes where useful.
- Add API tests for auth, deliveries, riders, dispatch, and events.
- Add WebSocket tests for tenant fanout.
- Add OSRM provider interface and local fallback behavior.
- Add frontend API client package and typed route contracts.

## Next: Optimization and Routing

- Add OSRM matrix provider.
- Add route geometry provider.
- Add OR-Tools time dimension.
- Add priority penalties and SLA windows.
- Add workload balance objective.
- Add route explanation output.
- Add reoptimization endpoint.
- Add route diff model for dispatcher approval.

## Next: Realtime Operations

- Create Redis subscriber lifecycle in FastAPI lifespan.
- Add connection heartbeat and reconnect semantics.
- Add event replay endpoint from event store.
- Add rider location throttling and deduplication.
- Add operational alert rules.
- Add frontend realtime store with Zustand.

## Next: Product Experience

- Add dispatch center route.
- Add rider management route.
- Add delivery management route.
- Add AI insight drawer.
- Add mobile rider route.
- Add simulation workspace.
- Add settings and integrations screens.
- Add design-system primitives for buttons, panels, badges, command menus, and status indicators.

## Later: AI and Voice

- Build structured AI context builder.
- Add operational insight generation endpoint.
- Add route explanation endpoint.
- Add AI recommendation review workflow.
- Add LiveKit voice transport.
- Add voice command event model.
- Add audit logs for AI decisions.

## Later: Enterprise Scale

- Extract optimization worker.
- Introduce Kafka-compatible event bus.
- Add Kubernetes manifests.
- Add Prometheus metrics.
- Add Grafana dashboards.
- Add Loki log pipeline.
- Add distributed simulation workload.
- Add multi-tenant organization management.
