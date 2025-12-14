# Backend Architecture Patterns

**Category:** Backend Development  
**Last Updated:** December 9, 2025

---

## Clean Architecture (Controllers → Services → Repositories)

**When Adopted:** Epic 13 (Production Backend Architecture)  
**Why:** Separation of concerns, testability, maintainability  
**Use Case:** Scaling backend logic without spaghetti code

### Minimal Example

```typescript
// 1. Repository Layer (Data Access)
class ProgressRepository {
  async findByUserId(userId: string): Promise<Progress[]> {
    return prisma.progress.findMany({ where: { userId } });
  }

  async create(data: CreateProgressDTO): Promise<Progress> {
    return prisma.progress.create({ data });
  }
}

// 2. Service Layer (Business Logic)
class ProgressService {
  constructor(private repo: ProgressRepository) {}

  async updateProgress(userId: string, wordId: string): Promise<Progress> {
    // Business logic: calculate mastery level, update stats
    const current = await this.repo.findByUserId(userId);
    const mastery = this.calculateMastery(current, wordId);

    return this.repo.create({
      userId,
      wordId,
      mastery,
      lastReviewed: new Date(),
    });
  }

  private calculateMastery(progress: Progress[], wordId: string): number {
    // Complex business logic here
    return 0.75;
  }
}

// 3. Controller Layer (HTTP Handling)
app.post("/api/progress", async (req, res) => {
  try {
    const { userId, wordId } = req.body;
    const service = new ProgressService(new ProgressRepository());
    const result = await service.updateProgress(userId, wordId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Folder Structure

```
backend/
├── controllers/       # HTTP handlers (Express routes)
│   └── progressController.ts
├── services/          # Business logic
│   └── progressService.ts
├── repositories/      # Database access
│   └── progressRepository.ts
└── types/
    └── dto.ts         # Data Transfer Objects
```

### Key Lessons

- Controllers: thin, validate input, call services
- Services: business logic, orchestrate repositories
- Repositories: CRUD operations only
- DTOs: explicit types for request/response

### When to Use

Complex business logic, multiple data sources, testability required

---

**Related Guides:**

- [Database & ORM](./backend-database.md) — Prisma repository pattern
- [Authentication](./backend-authentication.md) — Auth middleware
