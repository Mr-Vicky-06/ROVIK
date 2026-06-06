# Module Dependency Graph

```mermaid
flowchart TD
  API["API Routes"] --> Auth["Security / RBAC"]
  API --> UseCases["Application Use Cases"]
  UseCases --> Domain["Domain Model"]
  UseCases --> Ports["Application Ports"]
  Ports --> Optimizer["Optimization Adapter"]
  Ports --> Routing["Routing Adapter"]
  Ports --> Events["Event Publisher"]
  Ports --> Store["Repositories / Event Store"]
  Optimizer --> ORTools["Google OR-Tools"]
  Routing --> Haversine["Haversine Fallback"]
  Routing -.future.-> OSRM["OSRM Matrix + Geometry"]
  Events --> Redis["Redis Pub/Sub"]
  Store --> PostGIS["PostgreSQL + PostGIS"]
  Realtime["WebSocket Gateway"] --> Redis
  Web["Next.js Operations Console"] --> API
  Web --> Realtime
```

## Dependency Rules

- Domain imports no framework-specific modules.
- Application use cases depend on ports, schemas, and domain types.
- Infrastructure implements ports.
- API routes depend on schemas, security, and use cases.
- Realtime infrastructure consumes events, not database internals.
- Frontend consumes typed API and realtime contracts, not backend implementation details.
