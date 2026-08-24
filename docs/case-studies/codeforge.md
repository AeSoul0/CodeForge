# Case Study: CodeForge

## Problem
Gestione manuale dei contenuti del portfolio tramite modifiche del codice, con conseguente lentezza e rischio di introdurre bug durante l'aggiornamento.

## Constraints
- Deve essere altamente performante (Astro).
- Nessun CMS di terze parti costoso.
- Gestione dati strutturata.

## Architecture
Architettura divisa in Frontend (Astro + React Islands) e Backend REST API (Fastify + MongoDB) con una Admin Dashboard autenticata.

## Implementation
- **Frontend**: TailwindCSS, ParticleCanvas interattivo.
- **Backend**: Endpoint protetti da JWT.

## Security
- JWT in cookie HttpOnly.
- CORS strict.
- CSP e Rate Limiting implementato globalmente e su route sensibili.

## Performance
- Interfaccia ottimizzata, zero-JS per i contenuti statici.
- Generazione immagini WebP/AVIF.
- API con Cache-Control headers.

## Results
Un portfolio non solo visivamente impattante, ma che dimostra solide competenze ingegneristiche, dall'autenticazione alla CI/CD, fino all'infrastruttura backend.
