# Backend Context Rules

**Auto-activated when working in**: `apps/backend/`

---

## Clean Architecture Pattern

### Layered Structure
```
apps/backend/src/
├── api/                    # Presentation layer
│   ├── controllers/        # HTTP handlers
│   ├── routes/            # Route definitions
│   └── middleware/        # Request/response middleware
├── core/                   # Business logic layer
│   ├── services/          # Business logic services
│   └── interfaces/        # Abstract contracts
└── infrastructure/         # External concerns
    ├── repositories/      # Database access
    ├── cache/            # Redis caching
    └── external/         # Third-party APIs
```

### Dependency Flow
```
Controllers → Services → Repositories
    ↓           ↓            ↓
Interfaces ← Interfaces ← Interfaces
```

**Rule**: Higher layers depend on abstractions (interfaces), not concrete implementations.

---

## Service Layer Pattern

### Service Structure
```typescript
// core/services/VocabularyService.js
import { IVocabularyRepository } from '../interfaces/IVocabularyRepository.js';

export class VocabularyService {
  constructor(repository) {
    this.repository = repository; // Dependency injection
  }

  async getWordsByList(listId, userId) {
    // Business logic here
    const words = await this.repository.findByListId(listId, userId);
    return this.enrichWords(words);
  }

  enrichWords(words) {
    // Domain logic, no I/O
    return words.map(w => ({ ...w, difficulty: this.calculateDifficulty(w) }));
  }
}
```

### Dependency Injection
```typescript
// api/controllers/VocabularyController.js
import { VocabularyService } from '../../core/services/VocabularyService.js';
import { VocabularyRepository } from '../../infrastructure/repositories/VocabularyRepository.js';

export class VocabularyController {
  constructor() {
    const repository = new VocabularyRepository();
    this.service = new VocabularyService(repository);
  }

  async getWords(req, res) {
    try {
      const { listId } = req.params;
      const userId = req.user.id; // From JWT middleware

      const words = await this.service.getWordsByList(listId, userId);
      res.json({ words });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

---

## Express Patterns

### Route Definition
```typescript
// api/routes/vocabulary.js
import express from 'express';
import { VocabularyController } from '../controllers/VocabularyController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();
const controller = new VocabularyController();

router.get('/lists/:listId/words',
  authenticate,
  (req, res) => controller.getWords(req, res)
);

export default router;
```

### Middleware Pattern
```typescript
// api/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

export async function authenticate(req, res, next) {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId, email: decoded.email };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Error Handling
```typescript
// api/middleware/errorHandler.js
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Operational errors (expected)
  if (err.isOperational) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }

  // Programming errors (unexpected)
  res.status(500).json({ error: 'Internal server error' });
}

// Usage in server.js
app.use(errorHandler);
```

---

## Database Layer (Prisma)

### Repository Pattern
```typescript
// infrastructure/repositories/ProgressRepository.js
import { prisma } from '../database/client.js';
import { IProgressRepository } from '../../core/interfaces/IProgressRepository.js';

export class ProgressRepository {
  async findByUserId(userId) {
    return prisma.progress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async upsert(userId, wordId, data) {
    return prisma.progress.upsert({
      where: { userId_wordId: { userId, wordId } },
      update: data,
      create: { userId, wordId, ...data },
    });
  }

  async delete(userId, wordId) {
    return prisma.progress.delete({
      where: { userId_wordId: { userId, wordId } },
    });
  }
}
```

### Schema Conventions
```prisma
// prisma/schema.prisma
model Progress {
  id           String   @id @default(cuid())
  userId       String
  wordId       String
  confidence   Float    @default(0)
  studyCount   Int      @default(0)
  correctCount Int      @default(0)
  nextReview   DateTime
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, wordId])
  @@index([userId])
  @@index([nextReview])
}
```

---

## Authentication Patterns

### JWT with Refresh Tokens
```typescript
// core/services/AuthService.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class AuthService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async login(email, password) {
    const user = await this.userRepository.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new Error('Invalid credentials');
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken, user };
  }

  async refreshAccessToken(refreshToken) {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return accessToken;
  }
}
```

### Cookie Configuration
```typescript
// api/controllers/authController.js
res.cookie('accessToken', accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 15 * 60 * 1000, // 15 minutes
});

res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

---

## Caching Strategy (Redis)

### Cache Service Pattern
```typescript
// infrastructure/cache/CacheService.js
import { ICacheService } from '../../core/interfaces/ICacheService.js';

export class CacheService {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  async get(key) {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null; // Fail-open strategy
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
      // Fail-open: don't throw, just log
    }
  }
}
```

### Cache Key Generation
```typescript
// utils/hashUtils.js
import crypto from 'crypto';

export function generateCacheKey(prefix, params) {
  const paramString = JSON.stringify(params);
  const hash = crypto.createHash('sha256').update(paramString).digest('hex');
  return `${prefix}:${hash}`;
}

// Usage
const cacheKey = generateCacheKey('tts', { text, voice });
```

---

## API Response Patterns

### Success Response
```typescript
res.status(200).json({
  data: result,
  meta: {
    timestamp: new Date().toISOString(),
    requestId: req.id,
  },
});
```

### Error Response
```typescript
res.status(400).json({
  error: {
    code: 'INVALID_INPUT',
    message: 'Missing required field: wordId',
    details: validationErrors,
  },
  meta: {
    timestamp: new Date().toISOString(),
    requestId: req.id,
  },
});
```

---

## Environment Configuration

```typescript
// config/index.js
export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  },

  redis: {
    url: process.env.REDIS_URL,
  },

  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
};
```

---

## Testing Patterns

### Service Tests
```javascript
import { VocabularyService } from '../services/VocabularyService.js';

describe('VocabularyService', () => {
  let service;
  let mockRepository;

  beforeEach(() => {
    mockRepository = {
      findByListId: jest.fn(),
    };
    service = new VocabularyService(mockRepository);
  });

  test('getWordsByList enriches words with difficulty', async () => {
    mockRepository.findByListId.mockResolvedValue([mockWord]);

    const result = await service.getWordsByList('list-1', 'user-1');

    expect(result[0]).toHaveProperty('difficulty');
    expect(mockRepository.findByListId).toHaveBeenCalledWith('list-1', 'user-1');
  });
});
```

---

## Common Pitfalls

### ❌ Don't
```typescript
// Business logic in controllers
app.get('/words', async (req, res) => {
  const words = await prisma.word.findMany();
  // Complex calculations here ❌
});

// Direct database calls in controllers
const user = await prisma.user.findUnique({ where: { id } });

// Missing user isolation
await prisma.progress.findMany(); // Returns ALL users' progress ❌
```

### ✅ Do
```typescript
// Business logic in services
const words = await vocabularyService.getWords(userId);

// Use repositories
const user = await userRepository.findById(id);

// Always filter by userId
await prisma.progress.findMany({ where: { userId } });
```

---

## Related Documentation

- Backend architecture: @docs/knowledge-base/backend-architecture.md
- Advanced patterns: @docs/knowledge-base/backend-advanced-patterns.md
- Authentication: @docs/knowledge-base/backend-authentication.md
- Caching strategies: @docs/knowledge-base/integration-caching.md
- Backend setup: @docs/guides/backend-setup-guide.md
- Database guides: @docs/knowledge-base/backend-database-postgres.md
