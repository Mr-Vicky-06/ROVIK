# ADR 0003: Google OR-Tools as Optimization Core

## Status

Accepted

## Context

The optimization engine is the heart of ROVIK. It must support vehicle routing, capacity constraints, multi-rider assignment, order priority, workload balancing, and future time-window constraints.

## Decision

Use Google OR-Tools as the Stage 1 optimization engine behind the `OptimizationService` port. Keep a deterministic heuristic fallback for local resilience and failure handling.

## Consequences

- ROVIK gains a credible VRP foundation.
- Optimization logic stays isolated behind an application port.
- OSRM routing matrices can feed OR-Tools later without changing API contracts.
- More advanced constraints should be added as dimensions, penalties, and solver policies rather than ad hoc post-processing.
