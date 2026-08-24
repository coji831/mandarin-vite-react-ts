/**
 * @file apps/backend/src/nest/main.ts
 * @description NestJS 11 production entrypoint (Story 24-15 cutover).
 *
 * Applies the Express-platform-adapter middleware configuration via
 * `configureNestShellApp` + `mountExpressErrorBridge`. Since 24-15 this is the
 * PRODUCTION entry — `railway.toml`/`Procfile`/`start` run
 * `node dist/nest/main.js`. Graceful shutdown via `app.enableShutdownHooks()`
 * (DatabaseModule + SharedModule hooks).
 */

import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { createLogger } from "../shared/utils/logger.js";
import { config, validateConfig } from "../shared/config/index.js";
import { configureNestShellApp } from "./configure-app.js";
import { mountExpressErrorBridge } from "./exception.filter.js";
import { AppModule } from "./app.module.js";

const logger = createLogger("NestShell");

// Fail-fast config validation on boot.
validateConfig();

// bodyParser: false — the body parsers are mounted explicitly in
// configure-app.ts (single authoritative config).
const app = await NestFactory.create(AppModule, { bufferLogs: false, bodyParser: false });

// Express-adapter app configuration — trust proxy 1, /api global prefix, CORS
// allowlist, body parsers, cookie parsing, requestId middleware, per-route rate
// limiters, /api-docs swagger (see configure-app.ts), then the Express error
// bridge LAST so pre-router middleware errors (body-parser 413) emit the same
// {code, message, requestId} envelope.
configureNestShellApp(app);
mountExpressErrorBridge(app);

// Start server — bind to 0.0.0.0 as required by Railway's edge proxy.
await app.listen(config.port, "0.0.0.0");
logger.info(`Nest production server running on port ${config.port}`);
