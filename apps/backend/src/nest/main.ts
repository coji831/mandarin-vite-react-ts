/**
 * @file apps/backend/src/nest/main.ts
 * @description NestJS 11 production entrypoint (Story 24-15 cutover).
 *
 * Maps the Express `src/app/index.ts` middleware 1:1 onto a NestJS 11 app on
 * the Express platform adapter. Since 24-15 this is the PRODUCTION entry —
 * `railway.toml`/`Procfile`/`start` run `node dist/nest/main.js`; the Express
 * surface (`src/app/*`) was deleted at the cutover.
 *
 * Story 24-2 — NestJS 11 Shell Scaffold + Reference-Module Proof-of-Pattern.
 * Story 24-3 — HTTP-Layer Parity: global ExceptionFilter (APP_FILTER), requestId
 * middleware + body parsers + words rate-limit (configure-app.ts), Express error
 * bridge (mountExpressErrorBridge).
 * Story 24-15 — production flip: Nest entry is `start`; `/api-docs` +
 * `/api-docs.json` mounted in configure-app.ts; graceful shutdown via
 * `app.enableShutdownHooks()` (DatabaseModule + SharedModule hooks).
 */

import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { createLogger } from "../shared/utils/logger.js";
import { config, validateConfig } from "../shared/config/index.js";
import { configureNestShellApp } from "./configure-app.js";
import { mountExpressErrorBridge } from "./exception.filter.js";
import { AppModule } from "./app.module.js";

const logger = createLogger("NestShell");

// Same fail-fast config validation as the former Express entry.
validateConfig();

// bodyParser: false — the body parsers are mounted explicitly in
// configure-app.ts with the SAME options/limits as the former app/index.ts
// (parity).
const app = await NestFactory.create(AppModule, { bufferLogs: false, bodyParser: false });

// Express-adapter parity with the former src/app/index.ts — trust proxy 1, /api
// global prefix, CORS allowlist, body parsers, cookie parsing, requestId
// middleware, per-route rate limiters, /api-docs swagger (see configure-app.ts),
// then the Express error bridge LAST so pre-router middleware errors
// (body-parser 413) emit the same {code, message, requestId} envelope.
configureNestShellApp(app);
mountExpressErrorBridge(app);

// Start server — bind to 0.0.0.0 as required by Railway's edge proxy.
await app.listen(config.port, "0.0.0.0");
logger.info(`Nest production server running on port ${config.port}`);
