# Epic 14: .NET Backend Migration & Service Consolidation

## Epic Summary

**Goal:** Migrate all backend services from Node.js to ASP.NET Core 8, establishing a production-grade .NET architecture for long-term maintainability and performance.

**Key Points:**

- Build ASP.NET Core 8 project with clean architecture mirroring Epic 13 Node.js structure
- Migrate Progress Service first (deepest learning opportunity, heaviest business logic)
- Migrate TTS Service (Google Cloud TTS SDK in C#), Conversation Service (Gemini integration), and Auth Service progressively
- Use gradual rollout strategy (service-by-service cutover with traffic routing and rollback safety)
- Sunset Node.js backend completely after all services migrated and stabilized in production

**Status:** Planned

**Last Update:** December 9, 2025

## Background

After delivering Epic 13 (production Node.js backend with multi-user support), the strategic decision is to **fully migrate to .NET** rather than maintain dual backends long-term. This epic prioritizes team learning and establishes a robust, enterprise-ready backend architecture.

**Why .NET Migration:**

1. **Learning Objective**: Team needs practical .NET experience through real production code (not tutorials). $1000 customer project provides perfect learning opportunity.

2. **Performance Requirements**: Node.js single-threaded nature limits CPU-intensive operations. Future features (pronunciation analysis with FFT, tone detection) require compiled language performance.

3. **Enterprise Architecture**: .NET ecosystem provides mature patterns (ASP.NET Identity, EF Core, dependency injection) and better tooling for large-scale applications.

4. **Single Stack**: Maintaining both Node.js and .NET long-term creates unnecessary maintenance burden. Better to migrate fully and focus on one technology.

**Current Pain Points:**

- Node.js single-threaded nature limits concurrent request handling for CPU-heavy tasks
- Team has zero production .NET experience (blocks future enterprise contracts)
- Uncertainty about .NET performance benefits without real-world testing
- Risk of big-bang rewrite (need gradual, safe migration path)

**Strategic Approach:**

- Build .NET API **in parallel** with Node.js (no disruption to Epic 13 production system)
- Migrate **one service at a time** starting with Progress Service (most complex business logic, best learning)
- Use **traffic routing** (environment variable or API gateway) for gradual cutover
- **Measure everything** (latency, throughput, error rates, resource usage)
- Make **data-driven decisions** on rollout pace and rollback triggers

## User Stories

This epic consists of the following user stories:

1. **Story 14.1: ASP.NET Core Project Setup & Configuration**

   - As a developer, I want to create a new ASP.NET Core 8 Web API project with clean architecture, so that I can build .NET services following best practices.

2. **Story 14.2: Entity Framework Core Database Setup**

   - As a developer, I want to configure EF Core to connect to the same PostgreSQL database, so that .NET and Node.js share the same data source during migration.

3. **Story 14.3: JWT Authentication Implementation**

   - As a developer, I want to implement JWT validation in ASP.NET Core, so that .NET endpoints can authenticate users using tokens issued by Node.js.

4. **Story 14.4: Progress Service Migration (Implementation)**

   - As a developer, I want to implement Progress Service in C# with identical OpenAPI spec, so that I learn .NET patterns through the most complex business logic.

5. **Story 14.5: Progress Service Cutover (Production)**

   - As a user, I want my progress API calls handled by .NET backend, so that I benefit from improved performance without noticing any changes.

6. **Story 14.6: TTS Service Migration**

   - As a developer, I want to migrate Google Cloud TTS integration to C#, so that audio generation runs on .NET backend.

7. **Story 14.7: Conversation Service Migration**

   - As a developer, I want to migrate Gemini AI integration to C#, so that conversation generation runs on .NET backend.

8. **Story 14.8: Auth Service Migration (ASP.NET Identity)**

   - As a developer, I want to migrate authentication to ASP.NET Identity or custom JWT service, so that all auth logic is consolidated in .NET.

9. **Story 14.9: Node.js Backend Sunset & Production Cutover**
   - As a developer, I want to retire Node.js backend completely, so that we have a single, maintainable .NET codebase.

## Story Breakdown Logic

This epic is divided into stories based on the following approach:

- **Stories 14.1-14.4 (Phase 1)** focus on foundation and learning (Planned) — Set up .NET infrastructure and implement first service (Progress) to learn patterns deeply
- **Story 14.5 (Phase 2)** focuses on production cutover (Planned) — First service goes live, validates migration approach
- **Stories 14.6-14.7 (Phase 2)** focus on core services (Planned) — Migrate TTS and Conversation (smaller services, apply learned patterns)
- **Story 14.8 (Phase 3)** focuses on authentication (Planned) — Migrate auth last (riskiest, requires all other services stable)
- **Story 14.9 (Phase 3)** focuses on completion (Planned) — Sunset Node.js, finalize .NET as primary backend

Migration order prioritizes learning (Progress is most complex), then risk mitigation (TTS/Conversation before Auth), then completion (Node.js sunset).

## Acceptance Criteria

- [ ] All services running on .NET: Progress, TTS, Conversation, Auth migrated and production-stable (verify: /health endpoint shows all services active)
- [ ] Node.js backend retired: Frontend exclusively calls .NET endpoints, Node.js code archived (verify: no Node.js API calls in network tab)
- [ ] Production stable: .NET backend serves 100% traffic with <0.1% error rate, 99.9% uptime (verify: monitoring dashboard, error logs)
- [ ] Performance validated: .NET meets or exceeds Node.js baseline (latency p95 <200ms, throughput >100 req/s) (verify: load testing comparison report)
- [ ] Learning achieved: Team proficient in ASP.NET Core, EF Core, C# async patterns (verify: code review, team self-assessment)
- [ ] Zero data loss: All user data intact, no migration-related bugs (verify: database audit, user progress unchanged)
- [ ] Documentation complete: Architecture docs reflect .NET stack, .NET coding conventions documented, deployment runbooks tested (verify: docs/architecture.md updated)
- [ ] Maintainable codebase: Clean architecture preserved, test coverage >80%, ready for future features (verify: SonarQube analysis, unit test report)

## Architecture Decisions

- **Decision:** ASP.NET Core 8 (not .NET Framework 4.8)

  - Rationale: Modern, cross-platform, better performance, active development, free hosting options
  - Alternatives considered: .NET Framework 4.8 (Windows-only, legacy), Node.js (staying with current stack)
  - Implications: Requires .NET 8 SDK installed, uses modern C# features (async/await, nullable reference types, records)

- **Decision:** Entity Framework Core 8 (not Dapper)

  - Rationale: Easier learning curve (similar to Prisma), type-safe LINQ queries, migrations management, excellent documentation
  - Alternatives considered: Dapper (faster but more boilerplate), ADO.NET (too low-level), raw SQL (no type safety)
  - Implications: Slightly slower than Dapper (~10-20%) but acceptable for current scale, can optimize with raw SQL later if needed

- **Decision:** Clean Architecture (Controllers → Services → Repositories)

  - Rationale: Mirrors Epic 13 Node.js structure (easier comparison), follows .NET best practices, testable in isolation
  - Alternatives considered: Vertical slice architecture (too different from current), MVC pattern (mixes concerns)
  - Implications: More folders/interfaces (standard .NET pattern), business logic in Services can be reused if switching frameworks

- **Decision:** Service-by-Service Migration (not Big Bang)

  - Rationale: Lower risk, allows rollback per service, validates approach incrementally, team learns progressively
  - Alternatives considered: Big bang rewrite (too risky), keep both backends forever (maintenance burden)
  - Implications: Requires traffic routing logic (environment variable or API gateway), both backends run simultaneously for 4-8 weeks

- **Decision:** ASP.NET Identity vs Custom JWT (TBD - Story 14.8)

  - Rationale: ASP.NET Identity provides full auth framework (user management, roles, claims), Custom JWT is lightweight
  - Alternatives considered: Auth0/Okta (external dependency, cost), IdentityServer (complex for MVP)
  - Implications: Decision deferred to Story 14.8 after learning .NET basics, can choose based on complexity vs features tradeoff

- **Decision:** Azure App Service vs Railway vs Render
  - Rationale: Azure has free tier (F1), integrates well with .NET, Azuredevops CI/CD. Railway/Render are simpler but cost $5+/month
  - Alternatives considered: AWS (complex), Heroku (no free tier), Vercel (limited .NET support)
  - Implications: Azure requires App Service Plan, Railway/Render easier setup. Final decision in Story 14.9 based on deployment testing.

## Implementation Plan

1. Phase 1: Foundation & Learning (Weeks 1-2) — Set up ASP.NET Core project, configure EF Core, implement JWT auth, migrate Progress Service (Stories 14.1-14.4)
2. Phase 2: Core Services Migration (Weeks 3-5) — Cutover Progress Service to production, migrate TTS Service, migrate Conversation Service (Stories 14.5-14.7)
3. Phase 3: Auth & Cutover (Weeks 6-7) — Migrate Auth Service, production cutover to 100% .NET, sunset Node.js backend (Stories 14.8-14.9)
4. Phase 4: Stabilization & Optimization (Week 8) — Monitor production metrics, performance tuning, documentation finalization, team knowledge transfer

**Timeline**: 7-8 weeks total (includes learning curve, progressive rollout, stabilization)

## Risks & mitigations

- **Risk:** .NET learning curve delays timeline — Severity: Medium

  - Mitigation: Start with simplest service migration (Progress), allocate time for tutorials (ASP.NET Core fundamentals, EF Core), pair programming, code reviews with .NET expert if available
  - Rollback: If Progress Service takes >2 weeks, pause Epic 14 and revisit timeline, consider staying with Node.js

- **Risk:** EF Core migration breaks database schema — Severity: High

  - Mitigation: Use EF Core reverse engineering (scaffold-dbcontext) to match existing Prisma schema, test migrations in staging, database backups before production rollout
  - Rollback: Restore database from backup, revert to Node.js endpoints via environment variable (USE_DOTNET_BACKEND=false)

- **Risk:** Token compatibility issues (Node.js JWT ≠ .NET JWT) — Severity: High

  - Mitigation: Use same JWT secret, same algorithm (HS256), validate token format in both backends, integration tests for token validation
  - Rollback: If JWT incompatible, use API gateway to re-sign tokens, worst case issue new tokens (requires user re-login)

- **Risk:** Performance regression (. NET slower than Node.js) — Severity: Medium

  - Mitigation: Load testing after each service migration, optimize queries (AsNoTracking, compiled queries), profile with dotTrace, compare p95 latency
  - Rollback: If .NET >2x slower, rollback service to Node.js, investigate bottleneck before continuing migration

- **Risk:** Production outage during cutover — Severity: High

  - Mitigation: Blue-green deployment (both backends running), gradual traffic shift (10% → 50% → 100%), health checks, automated rollback on error spike
  - Rollback: Instant rollback via environment variable or load balancer config, keep Node.js running for 2 weeks post-cutover

- **Risk:** Team lacks .NET maintenance skills after migration — Severity: Low
  - Mitigation: Document all architectural decisions, create .NET coding conventions guide, conduct knowledge transfer sessions, external .NET consultant on retainer
  - Rollback: N/A (mitigation only, this is long-term skill building)

## Implementation notes

- **Conventions**: Follow `docs/guides/code-conventions.md` (adapt for C# naming conventions: PascalCase for public members, camelCase for private)
- **SOLID Principles**: Apply `docs/guides/solid-principles.md` — dependency injection is native in ASP.NET Core, use interfaces for Services/Repositories
- **Testing**: Use xUnit (standard .NET testing framework), Moq for mocking, FluentAssertions for readable assertions
- **Database**: EF Core migrations (`dotnet ef migrations add`, `dotnet ef database update`), use `AsNoTracking()` for read-only queries
- **Async Patterns**: Use async/await everywhere (ASP.NET Core is async-first), avoid .Result or .Wait() (causes deadlocks)
- **Error Handling**: Use middleware for global exception handling, return ProblemDetails (RFC 7807) for API errors
- **Logging**: Use ILogger<T> (built-in dependency injection), structured logging with Serilog, log to Application Insights or Seq
- **API Versioning**: Match Node.js routes (`/api/v1/...`), use Swashbuckle for OpenAPI/Swagger documentation generation

**Migration Checklist per Service:**

1. Implement C# service (Controllers/Services/Repositories)
2. Write unit tests (>80% coverage)
3. OpenAPI spec matches Node.js spec exactly
4. Integration tests pass (Postman collection)
5. Load testing shows acceptable performance
6. Deploy to staging, smoke tests pass
7. Gradual production rollout (10% → 50% → 100%)
8. Monitor metrics for 48 hours, rollback trigger if errors >0.5%
9. Deprecate Node.js service (remove code after 30 days)

**Learning Resources:**

- ASP.NET Core Official Docs: https://learn.microsoft.com/en-us/aspnet/core/
- Entity Framework Core Docs: https://learn.microsoft.com/en-us/ef/core/
- Clean Architecture in .NET: https://github.com/jasontaylordev/CleanArchitecture
- .NET Dependency Injection: https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection

---

## Related Documentation

- [Architecture Overview](../../architecture.md)
- [Epic 13: Production Backend Architecture](../epic-13-production-backend-architecture/README.md)
- [Code Conventions](../../guides/code-conventions.md)
- [SOLID Principles](../../guides/solid-principles.md)
- [Git Convention Guide](../../guides/git-convention.md)
- [ROADMAP](../ROADMAP.md)
