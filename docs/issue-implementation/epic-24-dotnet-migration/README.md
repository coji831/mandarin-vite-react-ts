# Epic 18: .NET Backend Migration & Service Consolidation

## Epic Summary

**Goal:** Migrate all backend services from Node.js/Express to ASP.NET Core 8 with clean architecture, achieving production-grade .NET implementation while validating performance improvements and team learning objectives.

**Key Points:**

- ASP.NET Core 8 Web API with clean architecture (Controllers â†’ Services â†’ Repositories â†’ Infrastructure)
- Entity Framework Core 8 connects to existing PostgreSQL database (shared with Node.js during migration)
- JWT authentication compatible with Node.js tokens (same secret, HS256 algorithm) for seamless cutover
- Service-by-service migration: Progress (learning) â†’ TTS (Google SDK) â†’ Conversation (Gemini) â†’ Auth (ASP.NET Identity)
- Blue-green deployment with traffic routing (10% â†’ 50% â†’ 100%) and automated rollback on error spikes

**Status:** Planned

**Last Update:** February 2, 2026

## Technical Overview

This epic executes a gradual migration from Node.js backend to ASP.NET Core 8, prioritizing team learning through hands-on implementation of the most complex service first (Progress Service). The migration strategy minimizes risk by running both backends in parallel with traffic routing, enabling instant rollback.

**Migration Philosophy:**

- **Learn by doing**: Progress Service chosen first for maximum learning (spaced repetition algorithm, complex business logic)
- **Validate incrementally**: Each service cutover proves approach before proceeding
- **Measure everything**: Performance, error rates, latency tracked before/after migration
- **Zero downtime**: Blue-green deployment with gradual traffic shift

**Current Node.js Architecture:**

```
apps/backend/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ controllers/          # HTTP layer
â”‚   â”œâ”€â”€ core/
â”‚   â”‚   â””â”€â”€ services/         # Business logic (framework-agnostic)
â”‚   â”œâ”€â”€ repositories/         # Data access
â”‚   â””â”€â”€ routes/               # Express routes
â”œâ”€â”€ services/                 # External integrations (TTS, Gemini)
â””â”€â”€ prisma/                   # Database ORM
```

**Target .NET Architecture:**

```
apps/backend-dotnet/          # New ASP.NET Core 8 project
â”œâ”€â”€ Controllers/              # HTTP layer (ASP.NET Core MVC)
â”œâ”€â”€ Services/                 # Business logic (C# interfaces + impl)
â”œâ”€â”€ Repositories/             # Data access (EF Core)
â”œâ”€â”€ Models/                   # EF Core entities
â”œâ”€â”€ Infrastructure/           # External integrations (Google SDK)
â”œâ”€â”€ Middleware/               # JWT validation, error handling
â””â”€â”€ Program.cs                # Startup configuration
```

**Key Technical Challenges:**

1. **EF Core Schema Mapping**: Must match existing Prisma schema exactly (zero migration downtime)
2. **JWT Token Compatibility**: .NET must validate tokens issued by Node.js (same secret + algorithm)
3. **Google Cloud SDK Integration**: C# SDK differs from Node.js (different API patterns)
4. **Gemini API Integration**: No official C# SDK (use HttpClient with manual serialization)
5. **Performance Validation**: Prove .NET faster than Node.js (justifies migration effort)

## Architecture Decisions

1. **ASP.NET Core 8 over .NET Framework 4.8** â€” Cross-platform, modern async patterns, active development, free hosting options (Azure/Railway/Render); runs on Linux containers

2. **Entity Framework Core 8 over Dapper** â€” Easier learning curve (similar to Prisma ORM), type-safe LINQ queries, migrations management; tradeoff: 10-20% slower than Dapper (acceptable for current scale)

3. **Clean Architecture pattern** â€” Controllers â†’ Services â†’ Repositories mirrors Node.js Epic 13 structure; business logic in Services layer portable to other frameworks

4. **Service-by-service migration** â€” Lower risk than big bang rewrite; validates approach incrementally; allows per-service rollback; both backends run in parallel 4-8 weeks

5. **ASP.NET Identity vs Custom JWT (TBD)** â€” Decision deferred to Story 18.8; Identity provides full user management framework, Custom JWT lightweight but requires manual implementation

6. **Blue-green deployment strategy** â€” Both backends deployed simultaneously; traffic routed via environment variable or load balancer; instant rollback on error spikes

## Technical Implementation

### Architecture

```
Frontend (React + Axios)
    â†“
API Gateway / Environment Variable (USE_DOTNET_BACKEND=true/false)
    â†“
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   Node.js Backend (Current)  â”‚   .NET Backend (Target)    â”‚
â”‚   Express + Prisma           â”‚   ASP.NET Core + EF Core   â”‚
â”‚   Port 3001                  â”‚   Port 5000                â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                    â†“
            PostgreSQL Database
            (Shared during migration)
```

**Service Migration Flow:**

```
Phase 1: Foundation (Stories 18.1-18.4)
    Create ASP.NET Core project
    â†“
    Configure EF Core with scaffold-dbcontext (reverse engineer from PostgreSQL)
    â†“
    Implement JWT validation middleware (same secret as Node.js)
    â†“
    Implement Progress Service in C# (ProgressController â†’ ProgressService â†’ ProgressRepository)
    â†“
    Unit tests + integration tests
    â†“
    Deploy to staging, smoke tests

Phase 2: Production Cutover (Story 18.5)
    Deploy .NET Progress Service to production
    â†“
    Route 10% traffic to .NET (environment variable or load balancer)
    â†“
    Monitor 24 hours (error rate, latency, throughput)
    â†“
    Increase to 50% if stable
    â†“
    Increase to 100% if stable
    â†“
    Deprecate Node.js Progress Service

Phase 3: Additional Services (Stories 18.6-18.8)
    Repeat Phase 1-2 for TTS Service
    â†“
    Repeat Phase 1-2 for Conversation Service
    â†“
    Repeat Phase 1-2 for Auth Service (most complex, last)

Phase 4: Node.js Sunset (Story 18.9)
    100% traffic to .NET backend
    â†“
    Archive Node.js code (git tag: nodejs-final-v1.0)
    â†“
    Remove Node.js deployment from Railway/Render
    â†“
    Update frontend to remove USE_DOTNET_BACKEND flag
```

### API Endpoints

**All endpoints maintain identical contract to Node.js version** (OpenAPI spec must match exactly):

**Progress Service:**

- `GET /api/progress` - Fetch user progress (EF Core LINQ query)
- `POST /api/progress/review` - Record review (spaced repetition calculation in C#)
- `POST /api/progress/update` - Update word progress
- `POST /api/progress/batch` - Batch updates

**TTS Service:**

- `POST /api/audio/generate` - Generate audio (Google.Cloud.TextToSpeech C# SDK)

**Conversation Service:**

- `POST /api/conversation/generate` - Generate conversation (HttpClient to Gemini API)
- `GET /api/conversation/:id` - Retrieve cached conversation

**Auth Service:**

- `POST /api/auth/login` - Login (ASP.NET Identity or custom JWT)
- `POST /api/auth/register` - Register
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Component Relationships

```
ASP.NET Core Web API (Program.cs)
    â†“
Middleware Pipeline:
    - Exception Handler Middleware (global error handling)
    - JWT Authentication Middleware (validates httpOnly cookie)
    - CORS Middleware (allow frontend origin)
    â†“
Controllers (ProgressController, TTSController, ConversationController, AuthController)
    â†“
Services (IProgressService, ITTSService, IConversationService, IAuthService)
    - Business logic (spaced repetition, conversation validation)
    - Framework-agnostic (pure C#)
    â†“
Repositories (IProgressRepository, IUserRepository)
    - EF Core DbContext
    - LINQ queries + async/await
    â†“
PostgreSQL Database
    - Same schema as Node.js (Prisma migrations)
    â†“
External Infrastructure:
    - Google Cloud TTS (Google.Cloud.TextToSpeech NuGet package)
    - Google Cloud Storage (Google.Cloud.Storage NuGet package)
    - Gemini API (HttpClient + manual JSON serialization)
```

### Dependencies

**New NuGet Packages:**

- `Microsoft.AspNetCore.App` (ASP.NET Core 8 metapackage)
- `Microsoft.EntityFrameworkCore` (^8.0.0) - ORM
- `Microsoft.EntityFrameworkCore.Design` (^8.0.0) - EF Core tools
- `Npgsql.EntityFrameworkCore.PostgreSQL` (^8.0.0) - PostgreSQL provider
- `Microsoft.AspNetCore.Authentication.JwtBearer` (^8.0.0) - JWT middleware
- `Google.Cloud.TextToSpeech.V1` (^3.0.0) - TTS SDK
- `Google.Cloud.Storage.V1` (^4.0.0) - GCS SDK
- `System.IdentityModel.Tokens.Jwt` (^7.0.0) - JWT token handling
- `Swashbuckle.AspNetCore` (^6.5.0) - Swagger/OpenAPI generation

**Testing Packages:**

- `xUnit` (^2.6.0) - Testing framework
- `Moq` (^4.20.0) - Mocking library
- `FluentAssertions` (^6.12.0) - Readable assertions
- `Microsoft.AspNetCore.Mvc.Testing` (^8.0.0) - Integration testing

**New Files:**

```
apps/backend-dotnet/
â”œâ”€â”€ Controllers/
â”‚   â”œâ”€â”€ ProgressController.cs
â”‚   â”œâ”€â”€ TTSController.cs
â”‚   â”œâ”€â”€ ConversationController.cs
â”‚   â””â”€â”€ AuthController.cs
â”œâ”€â”€ Services/
â”‚   â”œâ”€â”€ IProgressService.cs
â”‚   â”œâ”€â”€ ProgressService.cs
â”‚   â”œâ”€â”€ ITTSService.cs
â”‚   â”œâ”€â”€ TTSService.cs
â”‚   â”œâ”€â”€ IConversationService.cs
â”‚   â”œâ”€â”€ ConversationService.cs
â”‚   â”œâ”€â”€ IAuthService.cs
â”‚   â””â”€â”€ AuthService.cs
â”œâ”€â”€ Repositories/
â”‚   â”œâ”€â”€ IProgressRepository.cs
â”‚   â”œâ”€â”€ ProgressRepository.cs
â”‚   â”œâ”€â”€ IUserRepository.cs
â”‚   â””â”€â”€ UserRepository.cs
â”œâ”€â”€ Models/
â”‚   â”œâ”€â”€ User.cs
â”‚   â”œâ”€â”€ Progress.cs
â”‚   â””â”€â”€ StudyStreak.cs
â”œâ”€â”€ Infrastructure/
â”‚   â”œâ”€â”€ GoogleCloudTTSClient.cs
â”‚   â”œâ”€â”€ GoogleCloudStorageClient.cs
â”‚   â””â”€â”€ GeminiApiClient.cs
â”œâ”€â”€ Middleware/
â”‚   â”œâ”€â”€ ExceptionHandlerMiddleware.cs
â”‚   â””â”€â”€ JwtValidationMiddleware.cs
â”œâ”€â”€ DTOs/
â”‚   â”œâ”€â”€ ProgressDto.cs
â”‚   â”œâ”€â”€ ReviewDto.cs
â”‚   â””â”€â”€ UserDto.cs
â”œâ”€â”€ Data/
â”‚   â””â”€â”€ AppDbContext.cs
â”œâ”€â”€ Program.cs
â”œâ”€â”€ appsettings.json
â”œâ”€â”€ appsettings.Development.json
â””â”€â”€ backend-dotnet.csproj
```

### Testing Strategy

**Unit Tests (per service):**

- `ProgressServiceTests.cs` - Test spaced repetition algorithm in isolation
- `TTSServiceTests.cs` - Mock Google SDK, verify request formatting
- `ConversationServiceTests.cs` - Mock Gemini API, verify response parsing
- `AuthServiceTests.cs` - Test JWT generation/validation logic

**Integration Tests:**

- `ProgressControllerTests.cs` - Test HTTP endpoints with in-memory database
- `JwtAuthenticationTests.cs` - Test token validation middleware
- `DatabaseTests.cs` - Verify EF Core queries produce expected results

**Performance Tests:**

- `LoadTestComparison.cs` - Apache Bench or k6 load testing
  - Measure Node.js baseline (100 req/s, p95 latency)
  - Measure .NET performance (target: match or exceed Node.js)
  - Compare throughput, latency, error rates

**Manual Testing:**

- Deploy both backends to staging
- Use Postman to test all endpoints
- Verify JWT tokens work across both backends
- Test database writes from .NET visible in Node.js (shared DB)

### Performance Considerations

**Optimization Techniques:**

- `AsNoTracking()` on read-only EF Core queries (reduces memory overhead)
- Compiled queries for frequently-executed LINQ (reduce compilation time)
- Response caching middleware for GET endpoints (reduce database hits)
- Connection pooling (EF Core default, configure pool size)
- Async/await everywhere (ASP.NET Core async-first architecture)

**Expected Performance Improvements:**

- Compiled C# code faster than JavaScript V8 for CPU-intensive tasks (spaced repetition calculations)
- Better multi-threading for concurrent requests (Node.js single-threaded)
- Lower memory usage for large datasets (C# value types vs. JS objects)

**Monitoring Metrics:**

- Request latency (p50, p95, p99) - Target: <200ms p95
- Throughput (requests per second) - Target: >100 req/s
- Error rate - Target: <0.1%
- Memory usage - Target: <512MB
- CPU usage - Target: <50% average

**Benchmarking Tools:**

- Apache Bench (`ab -n 1000 -c 10 http://localhost:5000/api/progress`)
- k6 load testing (JavaScript-based load tester)
- dotTrace profiler (identify performance bottlenecks)
- Application Insights (production monitoring)

### Security Considerations

**JWT Token Validation:**

- Same secret key as Node.js (shared `JWT_SECRET` environment variable)
- Same algorithm (HS256) - verify in Node.js and .NET
- Validate expiry, issuer, audience claims
- httpOnly cookies prevent XSS attacks

**Database Security:**

- Connection string in environment variables (not appsettings.json)
- EF Core parameterized queries prevent SQL injection
- Use PostgreSQL roles for least-privilege access

**API Security:**

- CORS middleware configured with explicit origins (not wildcard)
- Rate limiting middleware (prevent abuse)
- Input validation with Data Annotations (`[Required]`, `[MaxLength]`)
- Output sanitization (prevent XSS in API responses)

### Migration Strategy

**Phase 1: Foundation & Learning (Weeks 1-2)**

- **Story 18.1**: Create ASP.NET Core 8 project with clean architecture folders
- **Story 18.2**: Scaffold EF Core models from existing PostgreSQL database
- **Story 18.3**: Implement JWT authentication middleware compatible with Node.js tokens
- **Story 18.4**: Implement Progress Service in C# with full business logic

**Phase 2: Production Validation (Week 3)**

- **Story 18.5**: Deploy Progress Service to production
  - 10% traffic for 24 hours â†’ monitor metrics
  - 50% traffic for 24 hours â†’ monitor metrics
  - 100% traffic for 48 hours â†’ deprecate Node.js Progress Service

**Phase 3: Additional Services (Weeks 4-5)**

- **Story 18.6**: Migrate TTS Service (Google Cloud TTS C# SDK)
- **Story 18.7**: Migrate Conversation Service (HttpClient to Gemini API)
- Follow same cutover process (10% â†’ 50% â†’ 100%)

**Phase 4: Auth & Sunset (Weeks 6-7)**

- **Story 18.8**: Migrate Auth Service (ASP.NET Identity or custom JWT)
- **Story 18.9**: 100% traffic to .NET backend, archive Node.js code

**Phase 5: Stabilization (Week 8)**

- Monitor production metrics (latency, error rates, throughput)
- Performance tuning (optimize slow queries, add caching)
- Documentation finalization (architecture, deployment runbooks)
- Team knowledge transfer (pair programming, code reviews)

**Rollback Plan (per service):**

1. Monitor error rate spike (>0.5% threshold)
2. Automated alert triggers rollback script
3. Update environment variable `USE_DOTNET_BACKEND=false`
4. Traffic instantly reverts to Node.js service
5. Investigate .NET issue in staging
6. Fix and redeploy before next cutover attempt

### Documentation Updates

- Update `docs/architecture.md` with .NET backend architecture diagram
- Create `docs/guides/dotnet-conventions.md` for C# coding standards
- Create `docs/deployment/dotnet-deployment.md` for production deployment
- Update API spec: `apps/backend-dotnet/docs/api-spec.md`

### Code Examples

**Node.js ProgressService (Current):**

```javascript
// apps/backend/src/core/services/ProgressService.js
class ProgressService {
  async recordReview(userId, wordId, confidence) {
    const nextReviewDate = this.calculateNextReview(confidence);
    return await this.progressRepository.save({ userId, wordId, nextReviewDate });
  }

  calculateNextReview(confidence) {
    const baseDelay = 1; // days
    const maxDelay = 30; // days
    return Math.min(maxDelay, baseDelay * Math.pow(2, confidence * 5));
  }
}
```

**C# ProgressService (Target):**

```csharp
// apps/backend-dotnet/Services/ProgressService.cs
public class ProgressService : IProgressService
{
    private readonly IProgressRepository _progressRepository;

    public ProgressService(IProgressRepository progressRepository)
    {
        _progressRepository = progressRepository;
    }

    public async Task<Progress> RecordReviewAsync(int userId, string wordId, int confidence)
    {
        var nextReviewDate = CalculateNextReview(confidence);
        return await _progressRepository.SaveAsync(userId, wordId, nextReviewDate);
    }

    private DateTime CalculateNextReview(int confidence)
    {
        const int baseDelay = 1; // days
        const int maxDelay = 30; // days
        var delay = Math.Min(maxDelay, baseDelay * Math.Pow(2, confidence * 5));
        return DateTime.UtcNow.AddDays(delay);
    }
}
```

**Key Differences:**

- C# uses interfaces for dependency injection (`IProgressRepository`)
- Async methods suffixed with `Async` (C# convention)
- `DateTime.UtcNow` vs. JavaScript `Date.now()`
- Strong typing (`int`, `string`) vs. JavaScript dynamic types

**EF Core DbContext:**

```csharp
// apps/backend-dotnet/Data/AppDbContext.cs
public class AppDbContext : DbContext
{
    public DbSet<User> Users { get; set; }
    public DbSet<Progress> Progress { get; set; }
    public DbSet<StudyStreak> StudyStreaks { get; set; }

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Match existing Prisma schema exactly
        modelBuilder.Entity<Progress>()
            .ToTable("progress")
            .HasKey(p => p.Id);

        modelBuilder.Entity<Progress>()
            .Property(p => p.UserId)
            .HasColumnName("user_id");

        // Configure relationships
        modelBuilder.Entity<Progress>()
            .HasOne(p => p.User)
            .WithMany(u => u.ProgressRecords)
            .HasForeignKey(p => p.UserId);
    }
}
```

**JWT Middleware Configuration:**

```csharp
// Program.cs
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]))
        };

        // Read token from httpOnly cookie (same as Node.js)
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                context.Token = context.Request.Cookies["token"];
                return Task.CompletedTask;
            }
        };
    });
```

---

**Related Documentation:**

- [Epic 18 BR](../../business-requirements/epic-18-dotnet-backend-migration/README.md)
- Story 18.1 Implementation *(not yet created)*
- Story 18.2 Implementation *(not yet created)*
- Story 18.3 Implementation *(not yet created)*
- Story 18.4 Implementation *(not yet created)*
- Story 18.5 Implementation *(not yet created)*
- Story 18.6 Implementation *(not yet created)*
- Story 18.7 Implementation *(not yet created)*
- Story 18.8 Implementation *(not yet created)*
- Story 18.9 Implementation *(not yet created)*
- [Architecture Overview](../../architecture.md)
- [Epic 13: Production Backend Architecture](../epic-13-production-backend-architecture/README.md)
- [Code Conventions](../../guides/conventions/backend.md)
- [.NET Migration Guide (Archived)](../../archive/dotnet-migration.md)

---

## Migration Success Criteria

**Technical Validation:**

- [ ] All EF Core queries match Prisma output (database audit)
- [ ] JWT tokens issued by Node.js validate in .NET (cross-backend test)
- [ ] Performance meets baseline: p95 latency <200ms, throughput >100 req/s
- [ ] Error rate <0.1% sustained for 7 days post-cutover
- [ ] Zero data loss or corruption (database integrity checks)

**Business Validation:**

- [ ] Team proficient in C# and ASP.NET Core (code review quality)
- [ ] No user-reported bugs related to backend migration
- [ ] $1000 customer contract continues without disruption
- [ ] Operational costs reduced (measure after 30 days)

**Documentation Validation:**

- [ ] New developers can set up .NET backend in <30 minutes
- [ ] All API endpoints documented with examples
- [ ] Deployment runbooks tested by 2+ team members
- [ ] Troubleshooting guide includes common .NET issues

**Production Readiness:**

- [ ] Monitoring dashboards show .NET metrics (latency, errors, throughput)
- [ ] Alerting configured for error spikes (>0.5% threshold)
- [ ] Backup/restore procedures tested
- [ ] Node.js code archived with rollback instructions

**Learning Objectives:**

- [ ] Team can implement new .NET endpoints without guidance
- [ ] Team understands EF Core migrations and LINQ queries
- [ ] Team can debug .NET performance issues with profiler
- [ ] Team confident in ASP.NET Core deployment pipeline

