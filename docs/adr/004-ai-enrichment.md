# ADR 004 — Isolate AI Enrichment Behind a Service Boundary

- **Status:** Accepted
- **Date:** 2026-08-26
- **Decision:** External AI functionality is isolated behind backend service
  logic.
- **Scope:** AI-assisted content enrichment and external provider integration.

## Context

CodeForge may use external generative AI providers for content enrichment.

External providers introduce:

- network latency;
- credentials;
- provider-specific SDKs/APIs;
- external failures;
- malformed or unexpected responses;
- provider availability dependencies.

The core application should not depend directly on provider-specific behavior.

## Decision

Keep AI integration inside the backend service layer.

The architecture is:

```text
Controller
   ↓
Service
   ↓
AI provider integration
   ↓
Validated application result
```

Provider credentials remain server-side.

## Implementation

`backend/src/utils/ai.ts`:

1. reads the project's GitHub repository (metadata, README, `package.json`)
   through the GitHub API (`GITHUB_TOKEN` optional, for rate limits);
2. asks OpenAI (`OPENAI_API_KEY`) first and falls back to Gemini
   (`GEMINI_API_KEY`);
3. stores the generated Markdown in the project's `descrizioneLunga`.

Generation runs in the background after a project is created without
documentation, at startup for any project still missing it, or on demand (`POST /api/projects/:id/generate-ai`,
`regenerateAI: true` on update, both answering `202 Accepted`). Existing
documentation is never overwritten unless regeneration is requested. AI calls
are disabled when `NODE_ENV=test`.

## Alternatives Considered

### Calling the AI provider directly from the browser

Rejected because credentials must not be exposed to the client.

### Embedding provider logic directly in controllers

Rejected because this couples HTTP transport logic to an external provider.

### Building a full provider abstraction platform

Rejected as unnecessary complexity for the current project scale.

## Trade-offs

### Benefits

* credentials remain server-side;
* provider failures can be isolated;
* business logic remains cleaner;
* provider changes are easier to contain;
* external responses can be validated before entering the domain layer.

### Costs

* an additional service boundary;
* external provider behavior still affects request latency and availability.

## Failure Handling

External provider failures must not expose provider credentials or internal
implementation details.

The application should surface safe application-level errors.

## Testing

The backend test suite includes service and integration coverage around
external-service behavior.

## Consequences

Future AI provider changes should remain localized to the integration/service
boundary rather than propagating into routes, controllers or persistence.
