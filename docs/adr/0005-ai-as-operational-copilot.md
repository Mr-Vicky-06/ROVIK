# ADR 0005: AI as Operational Copilot, Not Chatbot

## Status

Accepted

## Context

ROVIK is AI-native, but a generic chatbot would not be operationally credible. Dispatchers need contextual reasoning, recommendations, explanations, and safe action workflows.

## Decision

ROVIK AI features must operate as a logistics copilot:

- Consume structured operational state.
- Explain optimization decisions.
- Recommend dispatch actions.
- Respect RBAC and tenant boundaries.
- Preserve audit trails for AI-assisted decisions.
- Prefer embedded workflow surfaces over standalone chat windows.

## Consequences

- AI integration waits for reliable operational state and event contracts.
- AI actions need tool contracts and approval policies.
- Voice workflows must share the same operational context and authorization layer.
