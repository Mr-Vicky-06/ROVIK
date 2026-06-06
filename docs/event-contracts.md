# Event Contracts

## Current Event Types

- `order_created`
- `rider_assigned`
- `route_generated`
- `route_reoptimized`
- `rider_location_updated`
- `delivery_completed`
- `delivery_failed`
- `ETA_updated`

## Envelope

```json
{
  "event_id": "uuid",
  "event_type": "route_generated",
  "tenant_id": "uuid",
  "occurred_at": "2026-05-17T06:00:00Z",
  "payload": {}
}
```

## Event Bus Strategy

Stage 1 uses Redis Pub/Sub for low-cost local realtime distribution. The application depends on `EventPublisher` and `EventStore` ports so Kafka or another streaming backbone can replace Redis later.

## Event Design Rules

- Events describe business facts, not UI actions.
- Events must be tenant scoped.
- Payloads must be serializable and versionable.
- Events that change operational state should be persistable.
- Realtime dashboard updates should consume events, not poll domain services.

## Future Event Families

- Assignment events
- Route geometry events
- ETA prediction events
- AI recommendation events
- Voice command events
- Simulation events
- Alert and incident events
