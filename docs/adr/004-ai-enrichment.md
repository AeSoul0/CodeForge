# Architecture Decision Record: AI Enrichment

## Context
Writing and maintaining high-quality project descriptions is time-consuming. We want to automate this process.

## Decision
Integrate Google Gemini/Vertex AI via the `@google/genai` SDK or standard Gemini APIs in the Fastify backend, accessible via an authenticated admin route.

## Rationale
- Allows generating comprehensive technical descriptions from a few bullet points.
- Background execution ensures the main thread isn't blocked.
- Admin-only endpoint prevents abuse and cost overruns.

## Consequences
- Requires valid API keys and strict rate limiting (implemented).
- Enhances portfolio quality dramatically without manual effort.
