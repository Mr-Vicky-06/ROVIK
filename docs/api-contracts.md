# API Contract Standards

## Principles

- All public APIs are versioned under `/api/v1`.
- Schemas are typed with Pydantic.
- APIs must support tenant-aware authorization.
- List endpoints must support pagination.
- Mutating endpoints should emit operational events when state changes.
- Error responses use `{ "code": "...", "message": "..." }` inside `detail`.

## Core API Surfaces

| Area | Endpoint | Purpose |
| --- | --- | --- |
| Health | `GET /api/v1/health` | Liveness check |
| Readiness | `GET /api/v1/ready` | Readiness check |
| Optimization | `POST /api/v1/optimizations` | Solve route optimization request |
| Dispatch | `POST /api/v1/dispatch/plans` | Create dispatch plan and emit route event |
| Deliveries | `POST /api/v1/deliveries` | Intake delivery |
| Deliveries | `GET /api/v1/deliveries` | List delivery queue |
| Riders | `POST /api/v1/riders` | Create rider |
| Riders | `GET /api/v1/riders` | List riders |
| Locations | `POST /api/v1/riders/locations` | Update rider location |
| Events | `GET /api/v1/events/types` | List operational event types |
| Intelligence | `POST /api/v1/intelligence/predict` | Predict ETA and delay risk from selected operational model |
| Tracking | `WS /api/v1/tracking/ws/{tenant_id}` | Tenant realtime channel |

## Required Future API Enhancements

- `GET /api/v1/routes`
- `POST /api/v1/routes/{route_id}/reoptimize`
- `POST /api/v1/assignments`
- `PATCH /api/v1/deliveries/{delivery_id}/status`
- `GET /api/v1/analytics/operations`
- `POST /api/v1/ai/insights`
- `POST /api/v1/media/proof-of-delivery`
