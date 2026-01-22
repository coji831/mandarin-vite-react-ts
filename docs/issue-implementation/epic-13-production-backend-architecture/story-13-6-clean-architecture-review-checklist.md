# Story 13-6: Clean Architecture Review Checklist

**Epic:** 13 - Production Backend Architecture  
**Story:** 13-6 - Clean Architecture Preparation for .NET Migration  
**Created:** 2026-01-22  
**Purpose:** Validate clean architecture implementation across all backend layers

---

## 📋 Overview

Use this checklist to review backend code for clean architecture compliance. Each section includes validation criteria and minimal reference templates following SOLID principles.

**Key Principles:**

- ✅ Core layer has ZERO framework dependencies (no Express, Prisma, Redis)
- ✅ All dependencies flow inward (api → core ← infrastructure)
- ✅ Interfaces define contracts in core/, implementations in infrastructure/
- ✅ Controllers only map HTTP ↔ services (no business logic)
- ✅ Services contain pure business logic (framework-agnostic)

---

## 🎯 Layer Dependency Rules

```
┌─────────────────────────────────────────┐
│  API Layer (Framework-Dependent)        │
│  - controllers/ routes/ middleware/     │
│  - Can import: Express, core/, utils/   │
│  - Cannot import: Prisma, infrastructure│
└──────────────────┬──────────────────────┘
                   │ depends on
                   ▼
┌─────────────────────────────────────────┐
│  Core Layer (Framework-Agnostic)        │
│  - services/ interfaces/ domain/        │
│  - Can import: core/interfaces only     │
│  - Cannot import: Express, Prisma, etc. │
└──────────────────┬──────────────────────┘
                   │ depends on
                   ▼
┌─────────────────────────────────────────┐
│  Infrastructure (Framework-Dependent)   │
│  - repositories/ external/ cache/       │
│  - Can import: Prisma, Redis, GCS, etc. │
│  - Implements: core/interfaces/         │
└─────────────────────────────────────────┘
```

---

## 📂 API Layer Review Checklist

### `api/controllers/*.js`

**Validation Criteria:**

- [ ] Class-based with constructor accepting services via DI
- [ ] Methods are async with (req, res) signature
- [ ] No business logic (only request/response mapping)
- [ ] No database queries (delegates to services)
- [ ] HTTP status codes consistent (200, 400, 401, 404, 500)
- [ ] Error handling wrapped in try/catch
- [ ] All imports from core/services or utils/ (never infrastructure/)

**Reference Template:**

```javascript
// apps/backend/src/api/controllers/ExampleController.js

/**
 * HTTP controller for Example domain
 * Responsibilities: Request validation, response formatting, status codes
 * Does NOT contain: Business logic, database queries, external API calls
 */
export class ExampleController {
  /**
   * @param {ExampleService} exampleService - Injected from core layer
   * @param {OtherService} otherService - Additional dependency
   */
  constructor(exampleService, otherService) {
    this.exampleService = exampleService;
    this.otherService = otherService;
  }

  /**
   * GET /api/v1/examples
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   */
  async listExamples(req, res) {
    try {
      const { query, filters } = req.query;

      // Delegate to service (no business logic here)
      const examples = await this.exampleService.searchExamples(query, filters);

      // Only HTTP mapping
      res.status(200).json(examples);
    } catch (error) {
      res.status(500).json({
        error: error.message,
        code: "EXAMPLE_FETCH_ERROR",
      });
    }
  }

  /**
   * POST /api/v1/examples
   */
  async createExample(req, res) {
    try {
      const { name, data } = req.body;

      // Basic validation (complex validation in service)
      if (!name) {
        return res.status(400).json({
          error: "Name is required",
          code: "VALIDATION_ERROR",
        });
      }

      const example = await this.exampleService.createExample(name, data);
      res.status(201).json(example);
    } catch (error) {
      res.status(500).json({
        error: error.message,
        code: "EXAMPLE_CREATE_ERROR",
      });
    }
  }
}
```

**Common Violations to Avoid:**

```javascript
// ❌ BAD: Business logic in controller
async createExample(req, res) {
  const score = req.body.value * 0.8 + Math.random() * 0.2; // NO!
  await this.service.save(score);
}

// ✅ GOOD: Delegate to service
async createExample(req, res) {
  const result = await this.service.createExample(req.body);
  res.json(result);
}

// ❌ BAD: Direct database access
async getExample(req, res) {
  const example = await prisma.example.findUnique({ ... }); // NO!
}

// ✅ GOOD: Use service
async getExample(req, res) {
  const example = await this.service.getExampleById(req.params.id);
  res.json(example);
}
```

---

### `api/routes/*.js`

**Validation Criteria:**

- [ ] Instantiates controllers with injected services
- [ ] All routes wrapped with asyncHandler
- [ ] Controller methods bound with .bind(controller)
- [ ] Auth middleware applied where needed
- [ ] Routes grouped logically by domain
- [ ] OpenAPI JSDoc annotations present (for documented endpoints)
- [ ] Exports single router instance

**Reference Template:**

```javascript
// apps/backend/src/api/routes/exampleRoutes.js

import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { ExampleController } from "../controllers/ExampleController.js";
import { ExampleService } from "../../core/services/ExampleService.js";
import { ExampleRepository } from "../../infrastructure/repositories/ExampleRepository.js";

const router = Router();

// Dependency injection setup
const exampleRepository = new ExampleRepository();
const exampleService = new ExampleService(exampleRepository);
const exampleController = new ExampleController(exampleService);

/**
 * @openapi
 * /api/v1/examples:
 *   get:
 *     summary: Get all examples
 *     tags: [Examples]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of examples
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Example'
 */
router.get(
  "/api/v1/examples",
  asyncHandler(exampleController.listExamples.bind(exampleController)),
);

/**
 * @openapi
 * /api/v1/examples/{id}:
 *   get:
 *     summary: Get example by ID
 *     tags: [Examples]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Example details
 *       404:
 *         description: Example not found
 */
router.get(
  "/api/v1/examples/:id",
  asyncHandler(exampleController.getExample.bind(exampleController)),
);

/**
 * @openapi
 * /api/v1/examples:
 *   post:
 *     summary: Create new example
 *     tags: [Examples]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Example created
 */
router.post(
  "/api/v1/examples",
  requireAuth,
  asyncHandler(exampleController.createExample.bind(exampleController)),
);

export default router;
```

---

### `api/middleware/*.js`

**Validation Criteria:**

- [ ] Middleware functions follow (req, res, next) signature
- [ ] Error handling middleware has (err, req, res, next) signature
- [ ] No business logic (only cross-cutting concerns)
- [ ] Imports from utils/ or config/ (never core/ or infrastructure/)
- [ ] Properly calls next() or sends response

**Reference Template:**

```javascript
// apps/backend/src/api/middleware/exampleMiddleware.js

import { logger } from "../../utils/logger.js";

/**
 * Example middleware for cross-cutting concern
 * Responsibilities: Request validation, logging, transformation
 * Does NOT contain: Business logic, service calls
 */
export function validateExample(req, res, next) {
  try {
    const { requiredField } = req.body;

    if (!requiredField) {
      return res.status(400).json({
        error: "requiredField is required",
        code: "VALIDATION_ERROR",
      });
    }

    // Transform request if needed
    req.body.requiredField = requiredField.trim();

    next();
  } catch (error) {
    logger.error("Validation error:", error);
    next(error);
  }
}

/**
 * Error handling middleware (must have 4 parameters)
 */
export function handleExampleError(err, req, res, next) {
  if (err.name === "ExampleNotFoundError") {
    return res.status(404).json({
      error: err.message,
      code: "EXAMPLE_NOT_FOUND",
    });
  }

  next(err); // Pass to default error handler
}
```

---

### `api/docs/openapi.js`

**Validation Criteria:**

- [ ] OpenAPI version 3.1.0
- [ ] Server URLs defined (dev + production)
- [ ] Security schemes configured (bearerAuth, cookieAuth)
- [ ] Component schemas defined for reuse
- [ ] APIs array points to route files
- [ ] Export swaggerSpec for use in index.js

**Reference Template:**

```javascript
// apps/backend/src/api/docs/openapi.js

import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "Mandarin Learning Platform API",
      version: "1.0.0",
      description: "Clean architecture REST API",
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development server",
      },
      {
        url: "https://your-app.railway.app",
        description: "Production server (Railway)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "refreshToken",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            code: { type: "string" },
          },
        },
        // Add domain schemas here or import from schemas.js
      },
    },
  },
  apis: ["./apps/backend/src/api/routes/*.js", "./apps/backend/src/api/controllers/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
```

---

## 🧠 Core Layer Review Checklist

### `core/services/*.js`

**Validation Criteria:**

- [ ] Class-based with constructor accepting interfaces (NOT concrete implementations)
- [ ] ZERO imports from Express, Prisma, Redis, or any framework
- [ ] Only imports from core/interfaces/ or pure utility functions
- [ ] All external dependencies injected via constructor
- [ ] Methods contain pure business logic (portable to any language)
- [ ] No HTTP status codes, request/response objects
- [ ] JSDoc comments document business rules

**Reference Template:**

```javascript
// apps/backend/src/core/services/ExampleService.js

/**
 * Example business logic service
 * Framework-agnostic - can be ported to .NET line-by-line
 *
 * Responsibilities:
 * - Business rule validation
 * - Domain logic orchestration
 * - Data transformation
 *
 * Does NOT:
 * - Access database directly (uses repository interface)
 * - Handle HTTP requests (controller's job)
 * - Call external APIs directly (uses injected clients)
 */
export class ExampleService {
  /**
   * @param {IExampleRepository} repository - Repository interface (NOT Prisma)
   * @param {IExternalClient} externalClient - External API client interface
   */
  constructor(repository, externalClient) {
    // Only accept interfaces, never concrete implementations
    this.repository = repository;
    this.externalClient = externalClient;
  }

  /**
   * Business logic: Search examples with filters
   * Pure logic - no framework dependencies
   *
   * @param {string} query - Search query
   * @param {object} filters - Filter criteria
   * @returns {Promise<Array>} Filtered examples
   */
  async searchExamples(query, filters) {
    // Delegate data access to repository
    let examples = await this.repository.findAll();

    // Business logic: filtering
    if (query) {
      examples = examples.filter((ex) => ex.name.toLowerCase().includes(query.toLowerCase()));
    }

    if (filters.status) {
      examples = examples.filter((ex) => ex.status === filters.status);
    }

    // Business logic: sorting by score
    examples.sort((a, b) => this.calculateScore(b) - this.calculateScore(a));

    return examples;
  }

  /**
   * Business rule: Calculate score based on metrics
   * Pure function - easily testable, portable to .NET
   *
   * @param {object} example - Example entity
   * @returns {number} Calculated score
   */
  calculateScore(example) {
    const { views, likes, age } = example;

    // Business rule formula
    const recencyBoost = Math.max(0, 1 - age / 30);
    const engagementScore = (likes * 2 + views) * recencyBoost;

    return engagementScore;
  }

  /**
   * Business logic: Create example with validation
   */
  async createExample(name, data) {
    // Business rule: validate name length
    if (name.length < 3 || name.length > 100) {
      throw new Error("Name must be between 3 and 100 characters");
    }

    // Business rule: normalize data
    const normalizedData = this.normalizeData(data);

    // Delegate persistence to repository
    return this.repository.create(name, normalizedData);
  }

  /**
   * Pure business logic: data normalization
   */
  normalizeData(data) {
    return {
      ...data,
      createdAt: new Date(),
      score: this.calculateScore(data),
    };
  }
}
```

**Common Violations to Avoid:**

```javascript
// ❌ BAD: Direct Prisma import in core service
import { prisma } from "../../infrastructure/database/client.js"; // NO!

export class ExampleService {
  async getExamples() {
    return prisma.example.findMany(); // VIOLATION!
  }
}

// ✅ GOOD: Use repository interface
export class ExampleService {
  constructor(repository) {
    this.repository = repository; // Interface, not Prisma
  }

  async getExamples() {
    return this.repository.findAll();
  }
}

// ❌ BAD: HTTP concerns in service
async createExample(req, res) { // NO!
  res.status(201).json(...); // VIOLATION!
}

// ✅ GOOD: Return data, let controller handle HTTP
async createExample(name, data) {
  return this.repository.create(name, data);
}
```

---

### `core/interfaces/*.js`

**Validation Criteria:**

- [ ] JSDoc @typedef or @interface annotations
- [ ] Method signatures documented with @param and @returns
- [ ] No implementation code (only contracts)
- [ ] TypeScript-style interface definitions in JSDoc

**Reference Template:**

```javascript
// apps/backend/src/core/interfaces/IExampleRepository.js

/**
 * Repository interface for Example domain
 * Defines data access contract without implementation details
 *
 * @interface IExampleRepository
 */

/**
 * Find all examples
 * @function
 * @name IExampleRepository#findAll
 * @returns {Promise<Array<Example>>} All examples
 */

/**
 * Find example by ID
 * @function
 * @name IExampleRepository#findById
 * @param {string} id - Example ID
 * @returns {Promise<Example|null>} Example or null if not found
 */

/**
 * Create new example
 * @function
 * @name IExampleRepository#create
 * @param {string} name - Example name
 * @param {object} data - Example data
 * @returns {Promise<Example>} Created example
 */

/**
 * Update existing example
 * @function
 * @name IExampleRepository#update
 * @param {string} id - Example ID
 * @param {object} updates - Fields to update
 * @returns {Promise<Example>} Updated example
 */

/**
 * Delete example
 * @function
 * @name IExampleRepository#delete
 * @param {string} id - Example ID
 * @returns {Promise<void>}
 */

/**
 * Search examples by filters
 * @function
 * @name IExampleRepository#search
 * @param {object} filters - Search criteria
 * @returns {Promise<Array<Example>>} Matching examples
 */

// Type definition for Example entity
/**
 * @typedef {object} Example
 * @property {string} id - Unique identifier
 * @property {string} name - Example name
 * @property {string} status - Status (active, inactive)
 * @property {number} views - View count
 * @property {number} likes - Like count
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */
```

---

### `core/domain/*.js` (Optional)

**Validation Criteria:**

- [ ] Domain entities with business rules
- [ ] No database annotations (Prisma models stay in infrastructure)
- [ ] Value objects for complex types
- [ ] Domain events if using event-driven architecture

**Reference Template:**

```javascript
// apps/backend/src/core/domain/Example.js

/**
 * Example domain entity
 * Contains business rules and domain logic
 */
export class Example {
  constructor(id, name, status, metrics) {
    this.id = id;
    this.name = name;
    this.status = status;
    this.metrics = metrics;
  }

  /**
   * Domain rule: Can only publish if validated
   */
  canPublish() {
    return this.status === "validated" && this.metrics.score >= 0.8;
  }

  /**
   * Domain logic: Transition to published state
   */
  publish() {
    if (!this.canPublish()) {
      throw new Error("Cannot publish: validation required");
    }
    this.status = "published";
  }
}
```

---

## 🏗️ Infrastructure Layer Review Checklist

### `infrastructure/repositories/*.js`

**Validation Criteria:**

- [ ] Implements interface from core/interfaces/
- [ ] Imports Prisma client or database client
- [ ] Contains ONLY data access logic (no business rules)
- [ ] Handles database-specific operations (transactions, queries)
- [ ] Maps database models to domain entities if needed
- [ ] Error handling for database failures

**Reference Template:**

```javascript
// apps/backend/src/infrastructure/repositories/ExampleRepository.js

import { prisma } from "../database/client.js";

/**
 * Prisma implementation of IExampleRepository
 * Handles all database operations for Example domain
 *
 * @implements {IExampleRepository}
 */
export class ExampleRepository {
  /**
   * Find all examples
   * @returns {Promise<Array>} All examples from database
   */
  async findAll() {
    return prisma.example.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find example by ID
   * @param {string} id - Example ID
   * @returns {Promise<object|null>} Example or null
   */
  async findById(id) {
    return prisma.example.findUnique({
      where: { id },
    });
  }

  /**
   * Create new example
   * @param {string} name - Example name
   * @param {object} data - Example data
   * @returns {Promise<object>} Created example
   */
  async create(name, data) {
    return prisma.example.create({
      data: {
        name,
        ...data,
        createdAt: new Date(),
      },
    });
  }

  /**
   * Update existing example
   * @param {string} id - Example ID
   * @param {object} updates - Fields to update
   * @returns {Promise<object>} Updated example
   */
  async update(id, updates) {
    return prisma.example.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete example
   * @param {string} id - Example ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    await prisma.example.delete({
      where: { id },
    });
  }

  /**
   * Search examples by filters
   * @param {object} filters - Search criteria
   * @returns {Promise<Array>} Matching examples
   */
  async search(filters) {
    const where = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.minScore) {
      where.score = { gte: filters.minScore };
    }

    return prisma.example.findMany({
      where,
      orderBy: { score: "desc" },
    });
  }
}
```

---

### `infrastructure/external/*.js`

**Validation Criteria:**

- [ ] Wraps external API/service (Google Cloud, Gemini, etc.)
- [ ] Contains ONLY I/O operations (no business logic)
- [ ] Handles authentication/credentials
- [ ] Error handling for network failures
- [ ] Exports simple interface for core services

**Reference Template:**

```javascript
// apps/backend/src/infrastructure/external/ExampleApiClient.js

import { config } from "../../config/index.js";
import { logger } from "../../utils/logger.js";

/**
 * External API client for Example service
 * Handles low-level HTTP requests and authentication
 *
 * Responsibilities:
 * - API authentication
 * - HTTP request/response handling
 * - Error parsing
 *
 * Does NOT contain: Business logic
 */
export class ExampleApiClient {
  constructor() {
    this.apiKey = config.exampleApiKey;
    this.baseUrl = "https://api.example.com/v1";
  }

  /**
   * Fetch data from external API
   * @param {string} endpoint - API endpoint
   * @param {object} params - Query parameters
   * @returns {Promise<object>} API response
   */
  async fetchData(endpoint, params) {
    try {
      const url = new URL(`${this.baseUrl}${endpoint}`);
      Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      logger.error("ExampleApiClient error:", error);
      throw error;
    }
  }

  /**
   * Post data to external API
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body
   * @returns {Promise<object>} API response
   */
  async postData(endpoint, data) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      logger.error("ExampleApiClient post error:", error);
      throw error;
    }
  }
}

// Module exports pattern (alternative to class)
export async function fetchExampleData(id) {
  const client = new ExampleApiClient();
  return client.fetchData(`/examples/${id}`, {});
}
```

---

### `infrastructure/cache/*.js`

**Validation Criteria:**

- [ ] Implements ICacheService interface
- [ ] Redis client wrapped with error handling
- [ ] Graceful fallback if cache unavailable
- [ ] TTL configuration per cache key type
- [ ] Namespace keys to avoid collisions

**Reference Template:**

```javascript
// apps/backend/src/infrastructure/cache/RedisCacheService.js

import { redisClient } from "./RedisClient.js";
import { logger } from "../../utils/logger.js";

/**
 * Redis cache implementation
 * @implements {ICacheService}
 */
export class RedisCacheService {
  constructor() {
    this.namespace = "mandarin:";
    this.defaultTTL = 3600; // 1 hour
  }

  /**
   * Generate namespaced cache key
   */
  getKey(key) {
    return `${this.namespace}${key}`;
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Cached value or null
   */
  async get(key) {
    try {
      const value = await redisClient.get(this.getKey(key));
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error("Cache get error:", error);
      return null; // Graceful fallback
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live (seconds)
   * @returns {Promise<void>}
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      await redisClient.setex(this.getKey(key), ttl, JSON.stringify(value));
    } catch (error) {
      logger.error("Cache set error:", error);
      // Don't throw - cache failures shouldn't break app
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {Promise<void>}
   */
  async del(key) {
    try {
      await redisClient.del(this.getKey(key));
    } catch (error) {
      logger.error("Cache del error:", error);
    }
  }
}
```

---

### `infrastructure/parsers/*.js`

**Validation Criteria:**

- [ ] Parses external data format (CSV, XML, etc.)
- [ ] Validates input data structure
- [ ] Returns normalized domain objects
- [ ] Error handling for malformed data

**Reference Template:**

```javascript
// apps/backend/src/infrastructure/parsers/CsvParser.js

import { parse } from "csv-parse/sync";

/**
 * CSV parser for data files
 * Converts CSV text to JavaScript objects
 */
export class CsvParser {
  /**
   * Parse CSV text to array of objects
   * @param {string} csvText - CSV file contents
   * @param {object} options - Parsing options
   * @returns {Array<object>} Parsed records
   */
  static parseCsvText(csvText, options = {}) {
    try {
      const records = parse(csvText, {
        columns: true, // Use first row as headers
        skip_empty_lines: true,
        trim: true,
        ...options,
      });

      return records;
    } catch (error) {
      throw new Error(`CSV parsing failed: ${error.message}`);
    }
  }

  /**
   * Validate CSV structure
   * @param {Array<object>} records - Parsed records
   * @param {Array<string>} requiredColumns - Required column names
   * @returns {boolean} True if valid
   */
  static validateStructure(records, requiredColumns) {
    if (!records || records.length === 0) {
      throw new Error("CSV is empty");
    }

    const columns = Object.keys(records[0]);
    const missingColumns = requiredColumns.filter((col) => !columns.includes(col));

    if (missingColumns.length > 0) {
      throw new Error(`Missing columns: ${missingColumns.join(", ")}`);
    }

    return true;
  }
}
```

---

## ⚙️ Configuration & Utilities Review

### `config/index.js`

**Validation Criteria:**

- [ ] Centralized environment variable loading
- [ ] Default values for optional configs
- [ ] No secrets hardcoded (use env vars)
- [ ] Validation for required configs
- [ ] Exports single config object

**Reference Template:**

```javascript
// apps/backend/src/config/index.js

import dotenv from "dotenv";

// Load .env.local for local development
dotenv.config({ path: ".env.local" });

export const config = {
  // Server
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || "development",

  // Database
  databaseUrl: process.env.DATABASE_URL,

  // JWT
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production",
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || "15m",
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",

  // Redis
  redisUrl: process.env.REDIS_URL,
  cacheEnabled: process.env.CACHE_ENABLED === "true",
  cacheTtlTts: parseInt(process.env.CACHE_TTL_TTS || "86400"),
  cacheTtlConversation: parseInt(process.env.CACHE_TTL_CONVERSATION || "3600"),

  // Google Cloud
  gcsBucketName: process.env.GCS_BUCKET_NAME,
  gcsEnabled: process.env.GCS_ENABLED === "true",
  googleTtsCredentials: process.env.GOOGLE_TTS_CREDENTIALS_RAW,
  geminiApiCredentials: process.env.GEMINI_API_CREDENTIALS_RAW,

  // Gemini
  geminiModel: process.env.GEMINI_MODEL || "models/gemini-2.0-flash-lite",
  geminiTemperature: parseFloat(process.env.GEMINI_TEMPERATURE || "0.7"),
  geminiMaxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || "1000"),

  // Logging
  enableDetailedLogs: process.env.ENABLE_DETAILED_LOGS === "true",
};

// Validation: throw early if critical configs missing
if (!config.databaseUrl && config.nodeEnv === "production") {
  throw new Error("DATABASE_URL is required in production");
}

if (!config.jwtSecret || config.jwtSecret === "dev-secret-change-in-production") {
  console.warn("⚠️ WARNING: Using default JWT secret. Set JWT_SECRET in production!");
}
```

---

### `utils/*.js`

**Validation Criteria:**

- [ ] Pure utility functions (no side effects)
- [ ] No dependencies on core/infrastructure layers
- [ ] Well-documented with JSDoc
- [ ] Easily testable

**Reference Template:**

```javascript
// apps/backend/src/utils/exampleUtils.js

/**
 * Utility functions for Example domain
 * Pure functions with no side effects
 */

/**
 * Format example name
 * @param {string} name - Raw name
 * @returns {string} Formatted name
 */
export function formatExampleName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

/**
 * Calculate age in days
 * @param {Date} date - Date to calculate from
 * @returns {number} Age in days
 */
export function calculateAge(date) {
  const now = new Date();
  const diffMs = now - date;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
```

---

## 🎯 Root Files Review

### `index.js` (Application Entry Point)

**Validation Criteria:**

- [ ] Imports from api/routes/ (not controllers directly)
- [ ] Sets up middleware in correct order
- [ ] Mounts Swagger UI at /api-docs
- [ ] Error handling middleware last
- [ ] Database connection initialized
- [ ] Cache service initialized

**Reference Template:**

```javascript
// apps/backend/src/index.js

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";

import { config } from "./config/index.js";
import { swaggerSpec } from "./api/docs/openapi.js";
import routes from "./api/routes/index.js";
import { errorHandler } from "./api/middleware/errorHandler.js";
import { cacheMetrics } from "./api/middleware/cacheMetrics.js";
import { initializeCacheService } from "./infrastructure/cache/index.js";
import { logger } from "./utils/logger.js";

const app = express();

// Initialize cache service (Redis or NoOp)
await initializeCacheService();

// Middleware (order matters!)
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cacheMetrics); // Track cache hit/miss rates

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));

// API Routes
app.use(routes);

// Error handling (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📚 API docs: http://localhost:${PORT}/api-docs`);
});
```

---

## ✅ Final Validation Checklist

### Architecture Compliance

- [ ] **Zero framework imports in core/**: No Express, Prisma, Redis in `core/services/`
- [ ] **Dependency injection**: All services/controllers accept dependencies via constructor
- [ ] **Interface-based design**: Core depends on interfaces, infrastructure implements them
- [ ] **Single Responsibility**: Each class has one clear purpose
- [ ] **Open/Closed Principle**: Services extensible via interfaces, not modification

### Layer Separation

- [ ] **API Layer**: Only HTTP mapping, no business logic
- [ ] **Core Layer**: Pure business logic, framework-agnostic
- [ ] **Infrastructure Layer**: Only I/O operations, no business rules
- [ ] **Config/Utils**: Shared across layers, no layer-specific logic

### Documentation

- [ ] **OpenAPI spec**: All endpoints documented with JSDoc
- [ ] **Swagger UI**: Accessible at /api-docs
- [ ] **JSDoc comments**: All public methods documented
- [ ] **README updated**: Architecture section accurate

### Testing (When Phase 7 Implemented)

- [ ] **Unit tests**: Services testable without framework
- [ ] **Integration tests**: Endpoints match OpenAPI spec
- [ ] **Mocks**: Repository interfaces mockable for service tests
- [ ] **Coverage**: >90% on core/services/

### Deployment Readiness

- [ ] **Environment variables**: All configs via env vars, no hardcoded secrets
- [ ] **Error handling**: Graceful fallbacks for cache/external APIs
- [ ] **Logging**: Consistent logging for debugging
- [ ] **Health checks**: /api/health endpoint functional

---

## 🚀 .NET Migration Readiness

After passing this checklist, the codebase is ready for .NET migration:

- ✅ Core services can be ported line-by-line to C# (no framework dependencies)
- ✅ Repository interfaces translate to C# interfaces
- ✅ Prisma models map to EF Core entities
- ✅ OpenAPI spec reusable for C# client generation
- ✅ Controllers follow ASP.NET Core patterns already

**Estimated Migration Effort:** 40-50 hours (per docs/guides/dotnet-migration.md)

---

## 📚 References

- **Story BR**: `docs/business-requirements/epic-13-production-backend-architecture/story-13-6-clean-architecture.md`
- **Implementation Plan**: `docs/issue-implementation/epic-13-production-backend-architecture/story-13-6-implementation-plan.md`
- **Implementation Doc**: `docs/issue-implementation/epic-13-production-backend-architecture/story-13-6-clean-architecture.md`
- **Code Conventions**: `docs/guides/code-conventions.md`
- **SOLID Principles**: `docs/guides/solid-principles.md`
- **.NET Migration Guide**: `docs/guides/dotnet-migration.md`

---

**Review Checklist Version:** 1.0  
**Created:** 2026-01-22  
**Last Updated:** 2026-01-22
