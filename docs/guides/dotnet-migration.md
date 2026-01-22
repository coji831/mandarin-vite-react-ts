# .NET Migration Guide

**Epic:** 14 - .NET Backend Migration  
**Preparation:** Story 13-6 Clean Architecture  
**Created:** 2026-01-22

---

## 📋 Overview

This guide provides a roadmap for migrating the Node.js/Express backend to .NET 8+ with C# while maintaining the clean architecture established in Story 13-6. The current TypeScript/JavaScript implementation serves as a reference implementation that can be directly translated to C#.

**Migration Benefits:**

- **Type Safety**: Strong typing with C# eliminates runtime type errors
- **Performance**: 2-3x faster API response times with compiled .NET code
- **Ecosystem**: Rich .NET libraries for enterprise features (logging, monitoring, security)
- **Maintainability**: Better IDE support, refactoring tools, and team scalability
- **Cost**: Lower Railway hosting costs due to reduced memory/CPU usage

---

## 🏗️ Architecture Layer Mapping

### Current Structure (Node.js/Express)

```
apps/backend/src/
├── api/                    # HTTP layer (controllers, routes, middleware)
├── core/                   # Business logic (services, interfaces, domain)
├── infrastructure/         # External dependencies (repositories, clients, cache)
├── config/                 # Configuration
├── utils/                  # Shared utilities
└── index.js               # Application entry point
```

### Target Structure (.NET 8)

```
Mandarin.Api/              # ASP.NET Core Web API project
├── Controllers/           # API controllers (maps to api/controllers)
├── Middleware/            # Custom middleware (maps to api/middleware)
└── Program.cs            # Application entry point

Mandarin.Core/             # Class library (business logic)
├── Services/             # Business logic services
├── Interfaces/           # Repository & service interfaces
├── Domain/               # Domain models & entities
└── Exceptions/           # Custom exceptions

Mandarin.Infrastructure/   # Class library (external dependencies)
├── Repositories/         # Data access (EF Core)
├── ExternalClients/      # External API clients (Gemini, TTS, GCS)
├── Cache/                # Redis cache implementation
└── Database/             # EF Core DbContext

Mandarin.Shared/           # Class library (shared types)
├── Constants/            # API routes, enums
└── DTOs/                 # Data transfer objects
```

---

## 🔄 Code Translation Patterns

### 1. Repository Interface → EF Core Repository

**TypeScript (Current):**

```javascript
// apps/backend/src/core/interfaces/IProgressRepository.js
/**
 * @typedef {Object} IProgressRepository
 * @property {(userId: string) => Promise<Array>} findByUser
 * @property {(userId: string, wordId: string) => Promise<object|null>} findByUserAndWord
 * @property {(data: object) => Promise<object>} create
 * @property {(userId: string, wordId: string, data: object) => Promise<object>} update
 */
export default {};
```

**C# (.NET):**

```csharp
// Mandarin.Core/Interfaces/IProgressRepository.cs
public interface IProgressRepository
{
    Task<List<Progress>> FindByUserAsync(string userId);
    Task<Progress?> FindByUserAndWordAsync(string userId, string wordId);
    Task<Progress> CreateAsync(Progress progress);
    Task<Progress> UpdateAsync(string userId, string wordId, Progress progress);
    Task DeleteAsync(string userId, string wordId);
}
```

**EF Core Implementation:**

```csharp
// Mandarin.Infrastructure/Repositories/ProgressRepository.cs
public class ProgressRepository : IProgressRepository
{
    private readonly MandarinDbContext _context;

    public ProgressRepository(MandarinDbContext context)
    {
        _context = context;
    }

    public async Task<List<Progress>> FindByUserAsync(string userId)
    {
        return await _context.Progress
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.UpdatedAt)
            .ToListAsync();
    }

    public async Task<Progress?> FindByUserAndWordAsync(string userId, string wordId)
    {
        return await _context.Progress
            .FirstOrDefaultAsync(p => p.UserId == userId && p.WordId == wordId);
    }

    // ... other methods
}
```

---

### 2. Service Class → C# Service

**TypeScript (Current):**

```javascript
// apps/backend/src/core/services/ProgressService.js
export class ProgressService {
  constructor(repository) {
    this.repository = repository;
  }

  async getUserProgress(userId) {
    return this.repository.findByUser(userId);
  }

  async calculateMasteryStats(userId, listId, wordIds) {
    const progress = await this.repository.findByUser(userId);
    const listProgress = progress.filter((p) => wordIds.includes(p.wordId));

    const distribution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    listProgress.forEach((p) => distribution[p.confidenceLevel]++);

    return {
      totalWords: wordIds.length,
      masteredCount: distribution[4],
      confidenceDistribution: distribution,
    };
  }
}
```

**C# (.NET):**

```csharp
// Mandarin.Core/Services/ProgressService.cs
public class ProgressService : IProgressService
{
    private readonly IProgressRepository _repository;

    public ProgressService(IProgressRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<Progress>> GetUserProgressAsync(string userId)
    {
        return await _repository.FindByUserAsync(userId);
    }

    public async Task<MasteryStats> CalculateMasteryStatsAsync(
        string userId, 
        string listId, 
        List<string> wordIds)
    {
        var progress = await _repository.FindByUserAsync(userId);
        var listProgress = progress.Where(p => wordIds.Contains(p.WordId)).ToList();

        var distribution = new Dictionary<int, int>
        {
            { 0, 0 }, { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }
        };

        foreach (var p in listProgress)
        {
            distribution[p.ConfidenceLevel]++;
        }

        return new MasteryStats
        {
            TotalWords = wordIds.Count,
            MasteredCount = distribution[4],
            ConfidenceDistribution = distribution
        };
    }
}
```

---

### 3. Controller → ASP.NET Core Controller

**TypeScript (Current):**

```javascript
// apps/backend/src/api/controllers/progressController.js
export class ProgressController {
  constructor(progressService) {
    this.progressService = progressService;
  }

  async getAllProgress(req, res) {
    const userId = req.userId; // from auth middleware
    const progress = await this.progressService.getUserProgress(userId);
    res.json(progress);
  }
}
```

**C# (.NET):**

```csharp
// Mandarin.Api/Controllers/ProgressController.cs
[ApiController]
[Route("api/v1/progress")]
[Authorize] // JWT authentication
public class ProgressController : ControllerBase
{
    private readonly IProgressService _progressService;

    public ProgressController(IProgressService progressService)
    {
        _progressService = progressService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<Progress>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<Progress>>> GetAllProgress()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var progress = await _progressService.GetUserProgressAsync(userId);
        return Ok(progress);
    }
}
```

---

### 4. Middleware Translation

**TypeScript (Current):**

```javascript
// apps/backend/src/api/middleware/authMiddleware.js
export function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
}
```

**C# (.NET):**

```csharp
// Mandarin.Api/Middleware/JwtAuthenticationMiddleware.cs
public class JwtAuthenticationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConfiguration _configuration;

    public JwtAuthenticationMiddleware(RequestDelegate next, IConfiguration configuration)
    {
        _next = next;
        _configuration = configuration;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var token = context.Request.Headers["Authorization"]
            .FirstOrDefault()?.Split(" ").Last();

        if (token != null)
        {
            AttachUserToContext(context, token);
        }

        await _next(context);
    }

    private void AttachUserToContext(HttpContext context, string token)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Secret"]);

        tokenHandler.ValidateToken(token, new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        }, out SecurityToken validatedToken);

        var jwtToken = (JwtSecurityToken)validatedToken;
        var userId = jwtToken.Claims.First(x => x.Type == "userId").Value;

        context.Items["UserId"] = userId;
    }
}
```

**Note:** ASP.NET Core has built-in JWT authentication that's simpler:

```csharp
// Program.cs
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"])),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });
```

---

## 🗄️ Database Migration

### Prisma Schema → EF Core Entity

**Prisma (Current):**

```prisma
model Progress {
  id               String   @id @default(uuid())
  userId           String
  wordId           String
  confidenceLevel  Int      @default(0)
  reviewCount      Int      @default(0)
  lastReviewedAt   DateTime?
  nextReviewAt     DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@unique([userId, wordId])
  @@index([userId])
  @@index([wordId])
}
```

**C# Entity:**

```csharp
// Mandarin.Infrastructure/Database/Entities/Progress.cs
public class Progress
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = null!;
    public string WordId { get; set; } = null!;
    public int ConfidenceLevel { get; set; } = 0;
    public int ReviewCount { get; set; } = 0;
    public DateTime? LastReviewedAt { get; set; }
    public DateTime? NextReviewAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

**EF Core DbContext:**

```csharp
// Mandarin.Infrastructure/Database/MandarinDbContext.cs
public class MandarinDbContext : DbContext
{
    public DbSet<Progress> Progress { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Progress>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserId, e.WordId }).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.WordId);

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("NOW()");
        });
    }
}
```

---

## 📦 Dependency Injection Setup

**Program.cs Configuration:**

```csharp
var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<MandarinDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Repositories (Infrastructure Layer)
builder.Services.AddScoped<IProgressRepository, ProgressRepository>();
builder.Services.AddScoped<IVocabularyRepository, VocabularyRepository>();
builder.Services.AddScoped<IAuthRepository, AuthRepository>();

// Services (Core Layer)
builder.Services.AddScoped<IProgressService, ProgressService>();
builder.Services.AddScoped<IVocabularyService, VocabularyService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// External Clients (Infrastructure Layer)
builder.Services.AddSingleton<IGeminiClient, GeminiClient>();
builder.Services.AddSingleton<IGoogleTTSClient, GoogleTTSClient>();
builder.Services.AddSingleton<IGCSClient, GCSClient>();

// Cache
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
});
builder.Services.AddSingleton<ICacheService, RedisCacheService>();

// Controllers
builder.Services.AddControllers();

// Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
```

---

## 🔐 Authentication Migration

### JWT Token Generation

**TypeScript (Current):**

```javascript
const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
  expiresIn: "15m",
});
```

**C# (.NET):**

```csharp
private string GenerateJwtToken(User user)
{
    var tokenHandler = new JwtSecurityTokenHandler();
    var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Secret"]);

    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email)
        }),
        Expires = DateTime.UtcNow.AddMinutes(15),
        SigningCredentials = new SigningCredentials(
            new SymmetricSecurityKey(key),
            SecurityAlgorithms.HmacSha256Signature)
    };

    var token = tokenHandler.CreateToken(tokenDescriptor);
    return tokenHandler.WriteToken(token);
}
```

---

## 📚 OpenAPI Spec Reuse

The OpenAPI 3.1 spec generated in Phase 6 can be reused with minimal changes:

1. **Copy**: `apps/backend/src/api/docs/openapi.js` → reference documentation
2. **Generate**: Use Swashbuckle in .NET to auto-generate from C# attributes
3. **Validate**: Ensure response schemas match between Node and .NET implementations

**Swashbuckle Setup:**

```csharp
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Mandarin Learning Platform API",
        Version = "1.0.0",
        Description = "Backend API for Mandarin vocabulary learning"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "JWT Authorization header using the Bearer scheme"
    });
});
```

---

## 🚀 Deployment Notes

### Railway Configuration

**Dockerfile (.NET):**

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app
COPY . .
RUN dotnet restore
RUN dotnet publish -c Release -o out

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/out .
EXPOSE 3001
ENTRYPOINT ["dotnet", "Mandarin.Api.dll"]
```

**Environment Variables (Unchanged):**

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `GCS_CREDENTIALS_RAW` - Google Cloud credentials
- `GEMINI_API_CREDENTIALS_RAW` - Gemini API credentials

---

## ✅ Migration Checklist

### Phase 1: Project Setup

- [ ] Create .NET 8 solution structure
- [ ] Set up project references (Api → Core → Infrastructure)
- [ ] Install NuGet packages:
  - [ ] `Npgsql.EntityFrameworkCore.PostgreSQL`
  - [ ] `StackExchange.Redis`
  - [ ] `Microsoft.AspNetCore.Authentication.JwtBearer`
  - [ ] `Google.Cloud.Storage.V1`
  - [ ] `Google.Cloud.TextToSpeech.V1`
  - [ ] `Swashbuckle.AspNetCore`

### Phase 2: Core Layer Migration

- [ ] Translate interfaces (IProgressRepository, IVocabularyRepository, etc.)
- [ ] Translate domain models (Progress, User, etc.)
- [ ] Translate services (ProgressService, VocabularyService, AuthService)
- [ ] Port spaced repetition algorithm (ensure identical behavior)

### Phase 3: Infrastructure Layer Migration

- [ ] Implement EF Core repositories
- [ ] Port external clients (GeminiClient, GoogleTTSClient, GCSClient)
- [ ] Implement Redis cache service
- [ ] Configure EF Core migrations from Prisma schema

### Phase 4: API Layer Migration

- [ ] Translate controllers (ProgressController, VocabularyController, etc.)
- [ ] Port middleware (authentication, error handling, async wrapper)
- [ ] Configure CORS policy
- [ ] Set up Swagger/OpenAPI

### Phase 5: Testing & Validation

- [ ] Port existing Jest tests to xUnit
- [ ] Write integration tests for API endpoints
- [ ] Validate OpenAPI spec matches Node implementation
- [ ] Performance benchmarking (Node vs .NET)

### Phase 6: Deployment

- [ ] Deploy to Railway staging environment
- [ ] Run database migrations
- [ ] Test with production data
- [ ] Gradual rollout (canary deployment)

---

## 📊 Performance Expectations

Based on typical Node.js → .NET migrations:

- **API Response Time**: 50-70% faster (150ms → 50ms avg)
- **Memory Usage**: 30-40% lower (250MB → 150MB)
- **CPU Usage**: 20-30% lower under load
- **Startup Time**: Comparable (2-3 seconds)
- **Cold Start**: Faster (Railway instance wake-up)

---

## 🔗 Resources

- [ASP.NET Core Documentation](https://learn.microsoft.com/en-us/aspnet/core/)
- [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/)
- [Clean Architecture in .NET](https://github.com/jasontaylordev/CleanArchitecture)
- [Railway .NET Deployment](https://docs.railway.app/guides/dotnet)

---

**Migration Timeline Estimate:** 40-50 hours (Epic 14)  
**Risk Level:** Low (clean architecture enables parallel development)  
**Rollback Plan:** Keep Node.js backend running; switch via environment variable
