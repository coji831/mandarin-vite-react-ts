/**
 * @file apps/backend/src/nest/main.ts
 * @description NestJS 11 shell entrypoint (dev-only proof-of-pattern).
 *
 * Maps the Express `src/app/index.ts` middleware 1:1 onto a NestJS 11 app on
 * the Express platform adapter, WITHOUT touching the production Express entry.
 * Express remains the production entry (`node dist/app/index.js` via
 * `railway.toml`/`Procfile`/`start`); this shell compiles to `dist/nest/main.js`
 * as a side artifact of the same `tsc` pass.
 *
 * Story 24-2 — NestJS 11 Shell Scaffold + Reference-Module Proof-of-Pattern.
 * Story 24-3 — HTTP-Layer Parity: global ExceptionFilter (APP_FILTER), requestId
 * middleware + body parsers + words rate-limit (configure-app.ts), Express error
 * bridge (mountExpressErrorBridge).
 * Deferred to later stories: Swagger (24-15). `uncaughtException`/
 * `unhandledRejection`/SIGTERM/SIGINT handlers stay on the Express entry
 * (untouched).
 */

import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { createLogger } from "../shared/utils/logger.js";
import { config, validateConfig } from "../shared/config/index.js";
import { configureNestShellApp } from "./configure-app.js";
import { mountExpressErrorBridge } from "./exception.filter.js";
import { AppModule } from "./app.module.js";

const logger = createLogger("NestShell");

// Same fail-fast config validation as the Express entry.
validateConfig();

// bodyParser: false — the body parsers are mounted explicitly in
// configure-app.ts with the SAME options/limits as app/index.ts (parity).
const app = await NestFactory.create(AppModule, { bufferLogs: false, bodyParser: false });

// Express-adapter parity with src/app/index.ts — trust proxy 1, /api global
// prefix, CORS allowlist, body parsers, cookie parsing, requestId middleware,
// words rate-limit (see configure-app.ts; shared with the route-parity
// harness), then the Express error bridge LAST so pre-router middleware errors
// (body-parser 413) emit the same {code, message, requestId} envelope.
configureNestShellApp(app);
mountExpressErrorBridge(app);

// Start server — bind to 0.0.0.0 as required by Railway's edge proxy.
await app.listen(config.port, "0.0.0.0");
logger.info(`Nest shell running on port ${config.port}`);
