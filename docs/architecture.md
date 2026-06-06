# ROVIK Architecture

## Product Intent

ROVIK is a realtime logistics intelligence platform for dispatch teams that need to assign orders, optimize routes, track fleets, and react to real-world operating conditions. The system is designed to grow from a low-cost local deployment into an AI-native logistics operating system.

## Service Boundaries

- **API Gateway Layer:** FastAPI controllers, validation, Supabase JWT authentication boundary, RBAC, and versioned REST contracts.
- **Application Layer:** Use cases that coordinate repositories, optimization providers, routing providers, and realtime events.
- **Domain Layer:** Logistics entities and business rules independent of frameworks.
- **Optimization Engine:** Pluggable VRP/TSP engine. Stage 1 includes Google OR-Tools with a heuristic fallback for local resilience.
- **Routing Engine:** Pluggable road network provider. Phase 1 uses haversine distance; OSRM distance matrices fit behind the provider contract.
- **Realtime Layer:** WebSocket endpoints and Redis Pub/Sub-compatible events for live vehicle state, route updates, and dispatch events.
- **Persistence Layer:** PostgreSQL with PostGIS for geospatial entities and analytics-ready operational records.

## Scaling Path

1. **Stage 1:** Modular monolith with clean internal modules, PostGIS, Redis, OR-Tools, RBAC, and realtime event contracts.
2. **Stage 2-5:** OSRM-backed routing matrices, WebSocket tracking, Redis event fanout, dynamic rerouting jobs.
3. **Stage 6-10:** Premium operational frontend, rider experience, AI copilot, voice workflows, predictive analytics.
4. **Stage 11-12:** Investor polish, observability, service extraction, distributed optimization workers, Kafka event streams, Kubernetes.

## Design Principles

- Keep the API contract stable while optimization internals evolve.
- Prefer low-cost open infrastructure: OpenStreetMap, OSRM, PostGIS, Redis.
- Make operational state observable: structured logs, request IDs, health/readiness probes.
- Use async boundaries where latency or workload spikes are expected.
- Model logistics concepts explicitly rather than leaking database or API shapes into domain logic.
- Keep AI workflows grounded in structured operational context and auditable decisions.
