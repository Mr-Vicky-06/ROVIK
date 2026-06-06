# ADR 0002: Redis Pub/Sub First for Realtime Events

## Status

Accepted

## Context

ROVIK needs realtime dashboard updates, rider location fanout, dispatch updates, and route recalculation events. Kafka is a likely future backbone, but it is too heavy for Stage 1 local development and investor demonstrations.

## Decision

Use Redis Pub/Sub as the initial operational event transport. Application code depends on event ports:

- `EventPublisher`
- `EventStore`

Kafka can replace Redis behind these ports when event volume, retention, replay, and consumer-group requirements justify it.

## Consequences

- Stage 1 realtime implementation stays low-cost and simple.
- Events must use durable envelope contracts from the start.
- Critical business events still need persistence because Redis Pub/Sub does not provide durable replay.
- WebSocket fanout can subscribe to Redis channels without coupling API handlers to frontend clients.
