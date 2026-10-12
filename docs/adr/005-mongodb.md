# ADR 005 — Use MongoDB with Mongoose for Persistence

- **Status:** Accepted
- **Date:** 2026-08-26
- **Decision:** Use MongoDB Atlas with Mongoose.
- **Scope:** Application persistence.

## Context

CodeForge stores portfolio-oriented entities such as:

- projects;
- experiences;
- administrative data.

The application benefits from a flexible document-oriented data model while
remaining small enough that a relational schema would add more structure than
the current domain requires.

## Decision

Use MongoDB Atlas as the production database and Mongoose as the application
data layer.

Persistence access is isolated behind repositories.

```text
Service
  ↓
Repository
  ↓
Mongoose
  ↓
MongoDB Atlas
```

## Alternatives Considered

### PostgreSQL

A strong alternative, especially for highly relational domains, but not
required by the current data model.

### SQLite

Not suitable as the production persistence layer for the deployed architecture.

### Direct MongoDB driver without Mongoose

Possible, but Mongoose provides useful schema/model abstractions for the
project's current structure.

## Trade-offs

### Benefits

* flexible document model;
* straightforward content storage;
* MongoDB Atlas operational tooling;
* Mongoose schema/model support;
* repository abstraction.

### Costs

* query/index discipline remains important;
* relational constraints are not provided in the same way as a relational
  database.

## Data Access Policy

Business services must not contain uncontrolled direct database access.

Repositories own persistence operations.

## Testing

Database behavior is included in the backend test suite.

The latest backend suite reports:

```text
161/161 tests passed
```

## Consequences

Future schema/query changes should be reviewed for:

* indexes;
* pagination;
* sorting;
* query cost;
* projection;
* data growth.
