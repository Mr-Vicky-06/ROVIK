# Stage 1 Modules

## Authentication

Supabase-compatible JWT validation lives in `routeiq.security`. Local development can disable auth through `AUTH_DISABLED=true`; production should set Supabase JWT secret, audience, and tenant/role claims.

## Delivery Management

Delivery APIs accept operational order intake and emit `order_created` events. Persistence currently has API and schema boundaries ready for repository-backed storage.

## Rider Management

Rider APIs support fleet creation, fleet listing, and location updates. Location updates emit `rider_location_updated` events and are ready to flow into WebSocket fanout and PostGIS storage.

## Optimization Engine

`OptimizationService` is the stable contract. `OrToolsOptimizationService` solves vehicle-capacity route assignment and falls back to `HeuristicOptimizationService` if OR-Tools is unavailable.

## Dispatch Engine

Dispatch plans coordinate optimization, event storage, and event publication. The dispatch use case emits `route_generated` for dashboards and downstream workers.

## Routing Engine

`RoutingService` currently uses haversine distance. OSRM matrix routing belongs behind the same port.

## Realtime Event Infrastructure

Operational events are represented by domain contracts and published through Redis Pub/Sub-compatible adapters. This preserves a later migration path to Kafka or another streaming backbone.

## Dashboard

The Next.js operations console has map visualization, dispatch controls, fleet telemetry, route plans, order queue, and a WebSocket-backed event stream.
