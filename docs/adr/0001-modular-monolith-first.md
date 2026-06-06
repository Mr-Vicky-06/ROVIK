# ADR 0001: Modular Monolith First

## Status

Accepted

## Context

ROVIK needs to move quickly while preserving a credible path to enterprise-scale logistics infrastructure. Premature microservices would increase local development cost, deployment complexity, and coordination overhead before operational workflows are proven.

## Decision

ROVIK starts as a modular monolith with strict internal boundaries:

- API layer
- Application use cases
- Domain model
- Infrastructure adapters
- Realtime gateway
- Optimization engine
- Routing provider
- Event ports

Future service directories exist for extracted services, but Stage 1 implementation remains inside the FastAPI backend and Next.js frontend.

## Consequences

- Local development remains simple.
- Domain and application code can move into services later.
- Interfaces must stay clean enough for extraction.
- Shared state must be accessed through repositories and ports, not direct cross-module coupling.
