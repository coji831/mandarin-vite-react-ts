# Shared / Kernel Layer in a Modular Monolith

**KB Category:** Architecture Patterns
**Last Updated:** June 13, 2026

When building a Modular Monolith, deciding where to put cross-cutting concerns like authentication, caching, databases, and third-party APIs is the ultimate test of the architecture. If you get this wrong, your modules will accidentally tangle together, defeating the whole purpose of the Modulith.

To handle this cleanly, you introduce a **Shared / Kernel Layer**.

Here is the industry-standard way to structure these shared pieces without ruining your module boundaries.

---

## 1. The High-Level Architecture View

Your project should be split into three main top-level directories:

1. `app/` (The entry point, global routing, and global middleware)
2. `modules/` (Your isolated business domains)
3. `shared/` (The technical foundation that all modules can import from)

---

## 2. Structuring the `shared/` Directory

The `shared/` folder should **never contain business logic**. It should only contain technical infrastructure, utilities, and abstract contracts.

Here is how you organize it:

```text
src/
├── shared/
│   ├── infrastructure/        # Shared technical tools
│   │   ├── cache/             # Redis client wrapper, caching decorators
│   │   ├── database/          # Global DB connection pool, migration files
│   │   └── storage/           # S3/Cloud Storage driver wrappers
│   │
│   ├── middleware/            # Core HTTP middlewares
│   │   ├── auth.middleware.ts # Extracts JWT, attaches user to request context
│   │   ├── error.middleware.ts# Global catch-all error handling
│   │   └── logger.middleware.ts
│   │
│   └── utils/                 # Pure helper functions
│       ├── crypto.ts          # Hashing, password salting
│       └── date.ts            # Date formatting helpers

```

### The Golden Rule of `shared/`:

> Code inside `shared/` is **passive**. It provides tools, but it doesn't make business decisions. Modules can import _from_ `shared/`, but `shared/` can **never** import anything from the `modules/` folder.

---

## 3. How Specific Shared Layers Should Be Handled

Let's look at how the trickier pieces function across the application:

### A. Authentication & Core Security

- **Where it lives:** The JWT verification logic and token parsing live in `shared/middleware/auth.middleware.ts`.
- **How it works:** The global API server applies this middleware to incoming HTTP requests. It extracts the token, verifies it, and attaches a lightweight `CurrentTenant` or `CurrentUser` object (usually just an `id` and a list of `roles`) to the request context.
- **Important Note:** Do not confuse _Authentication_ (verifying who a user is) with _User Management_ (updating profiles, creating accounts). User Management belongs inside a specific `modules/users/` domain, not in shared.

### B. Caching & Storage (Infrastructure)

- **Where it lives:** The technical setup (e.g., initializing a Redis client or an AWS S3 client) lives in `shared/infrastructure/`.
- **How modules use it:** Modules import the initialized client or interface to do their own work.
- **The Boundary Rule:** If the `Orders` module caches an order status, it must use its own cache key prefix (e.g., `orders:1234`). The `Billing` module must never read or write to cache keys belonging to the `Orders` module.

### C. External Services (Third-Party APIs)

How you structure external services depends entirely on **who uses them**:

- **Scenario 1: Used by a single module.** If you use Stripe _only_ for billing, the Stripe SDK wrapper belongs completely inside `modules/billing/infrastructure/gateways/StripeGateway.ts`. Keep it hidden there.
- **Scenario 2: Used by multiple modules.** If you use SendGrid to send emails from `Orders`, `Billing`, and `Support`, you have two choices:

1. _The Infrastructure Way:_ Put a generic `EmailClient` helper inside `shared/infrastructure/email/`.
2. _The Modulith Way (Recommended):_ Create a dedicated `modules/notifications/` module. Other modules don't call SendGrid directly; they fire an internal in-memory event (`OrderPlacedEvent`), and the `notifications` module listens to it and handles the email delivery.

---

## 4. Visualizing the Dependency Flow

To keep the system highly maintainable, dependencies must strictly flow downward.

```text
       ┌────────────────────────┐
       │   app/ (Entrypoint)    │
       └───────────┬────────────┘
                   │ (Registers routes & global middlewares)
                   ▼
       ┌────────────────────────┐
       │   modules/ (Domains)   │◄────┐
       └───────────┬────────────┘     │ (Can call other modules
                   │                  │  via their public APIs)
                   │ (Imports tools)  │
                   ▼                  │
       ┌────────────────────────┐     │
       │    shared/ (Kernel)    ├─────┘
       └────────────────────────┘

```

By separating your system into **Business Modules** and **Technical Shared Tools**, you prevent code rot. If you ever need to swap your database ORM or change your caching provider, you only modify the code inside `shared/`, leaving your core business workflows completely untouched.

# Handling Multiple Connections to the Same Service

When you need different modules to connect to different cache clusters or separate cloud storage buckets, you cannot just export a single, global client from your `shared/` layer.

Instead, your `shared/` layer should act as a **Factory** or a provider of **Configurations**. The modules then use these factory tools to instantiate or inject their own dedicated, isolated instances.

Here is how to structure this cleanly using two common patterns: **The Configuration Factory Pattern** (great for standard setups) and **Dependency Injection** (standard in frameworks like Spring Boot, NestJS, or .NET).

---

## 1. The Multi-Bucket Storage Architecture (S3 Example)

You want your `shared/` layer to own the low-level SDK client logic, but let each module declare its own bucket name and credentials.

### In the `shared/` layer:

Create a reusable storage service factory or base class that expects a configuration block.

```typescript
// src/shared/infrastructure/storage/StorageService.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export interface StorageConfig {
  bucketName: string;
  region: string;
  credentials: { accessKeyId: string; secretAccessKey: string };
}

// A reusable class that modules can instantiate
export class ModuleStorageService {
  private client: S3Client;
  private bucketName: string;

  constructor(config: StorageConfig) {
    this.bucketName = config.bucketName;
    this.client = new S3Client({
      region: config.region,
      credentials: config.credentials,
    });
  }

  async uploadFile(key: string, fileBuffer: Buffer): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
      }),
    );
    return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }
}
```

### Inside the Module (e.g., `catalog`):

The `catalog` module reads its own environment variables, creates its unique storage instance, and uses it inside its Clean Architecture infrastructure layer.

```typescript
// src/modules/catalog/infrastructure/storage/CatalogStorage.ts
import { ModuleStorageService } from "../../../../shared/infrastructure/storage/StorageService";

// Created specifically for the catalog bucket
export const catalogStorage = new ModuleStorageService({
  bucketName: process.env.CATALOG_S3_BUCKET || "my-app-products-bucket",
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.CATALOG_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CATALOG_AWS_SECRET_ACCESS_KEY!,
  },
});
```

---

## 2. The Multi-Endpoint Cache Architecture (Redis Example)

Sometimes a single Redis instance isn't enough. You might want the `analytics` module using a high-memory Redis instance while the `orders` module uses a fast, low-latency Redis instance on a completely different cluster endpoint.

The best way to handle this without duplicating connection logic is a **Named Instance Manager** inside your `shared/` layer.

### In the `shared/` layer:

Build a connection registry that acts as a pool for different Redis clients.

```typescript
// src/shared/infrastructure/cache/CacheFactory.ts
import { createClient, RedisClientType } from "redis";

export class CacheFactory {
  private static instances: Map<string, RedisClientType> = new Map();

  // Modules call this to get or create their specific connection
  static createInstance(moduleName: string, connectionString: string): RedisClientType {
    if (this.instances.has(moduleName)) {
      return this.instances.get(moduleName)!;
    }
    }

    const client = createClient({ url: connectionString });
    client.connect().catch((err) => console.error(`${moduleName} Redis Connection Error`, err));

    this.instances.set(moduleName, client as RedisClientType);
    return client as RedisClientType;
  }
}
```

### Inside the Modules:

Now, each module requests its connection using its specific configuration variables.

```typescript
// src/modules/orders/infrastructure/cache/OrdersCache.ts
import { CacheFactory } from "../../../../shared/infrastructure/cache/CacheFactory";

// Points to orders-redis.internal.net
export const ordersCache = CacheFactory.createInstance(
  "orders",
  process.env.ORDERS_REDIS_URL || "redis://localhost:6379/0",
);
```

```typescript
// src/modules/analytics/infrastructure/cache/AnalyticsCache.ts
import { CacheFactory } from "../../../../shared/infrastructure/cache/CacheFactory";

// Points to heavy-analytics-redis.cloud.net
export const analyticsCache = CacheFactory.createInstance(
  "analytics",
  process.env.ANALYTICS_REDIS_URL || "redis://localhost:6380/0",
);
```

---

## 3. If You Are Using Dependency Injection (NestJS / Spring Boot / .NET)

If you are using a framework with built-in Dependency Injection (DI), you don't need manual factories. You handle this via **Named/Keyed Injections** inside your configuration/module files.

For example, in **NestJS**, you would configure separate providers inside your root `AppModule`, but inject them locally by a specific string token:

```typescript
// Inside Orders Module Infrastructure
constructor(
  @Inject('ORDERS_REDIS_CLIENT') private readonly cache: RedisClient,
  @Inject('ORDERS_S3_BUCKET') private readonly storage: S3Client
) {}

```

The underlying framework handles spinning up the unique connection pools based on those string names, ensuring the code within the module remains decoupled from how the connection is created.

---

## Why this setup pays off: Future-Proof Slicing

By forcing modules to instantiate their own storage or caching clients (even if they happen to point to the same local Redis or S3 bucket on day one), you achieve **true structural independence**.

If the `analytics` module ever needs to scale out into its own microservice next year, you won't have to rewrite any code inside the module. You simply change its environment variable (`ANALYTICS_REDIS_URL`) to point to a new standalone cluster, and the module is successfully decoupled without touching a single line of your shared codebase.
