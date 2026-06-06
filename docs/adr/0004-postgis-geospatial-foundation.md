# ADR 0004: PostgreSQL and PostGIS as Operational State Foundation

## Status

Accepted

## Context

ROVIK stores operational state with geospatial semantics: riders, delivery destinations, route geometry, heatmaps, spatial filters, geofences, and future simulations.

## Decision

Use PostgreSQL with PostGIS as the primary database foundation.

## Consequences

- Operational and geospatial data live in one reliable transactional store.
- Spatial indexes support rider and delivery proximity queries.
- Future analytics can build from the same canonical operational records.
- High-volume telemetry may later move to time-series or streaming stores, but PostGIS remains the source for current operational state.
