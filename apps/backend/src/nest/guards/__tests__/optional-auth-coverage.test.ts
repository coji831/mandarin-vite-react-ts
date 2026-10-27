/**
 * @file apps/backend/src/nest/guards/__tests__/optional-auth-coverage.test.ts
 * @description Story 25-1 (P0-1 Guest Isolation) — the EXECUTABLE inventory of
 * every `OptionalAuthGuard` route and every optional-`userId`
 * repository/service signature.
 *
 * P0-1 is the class of bug where `where: { userId: undefined }` is silently
 * dropped by Prisma, turning a per-user read into a cross-tenant one. The
 * 2026-10-27 audit proved no `optionalAuth` route can reach `srsCardState`
 * today — but a prose list rots the moment someone adds a route. This test is
 * the anti-rot mechanism: it STATICALLY scans the source and fails unless the
 * discovered set EQUALS the reviewed table below.
 *
 * Scans (no Nest bootstrap, no DB — pure filesystem):
 *   1. `src/modules/**\/nest/*.controller.ts` for handlers decorated with
 *      `@UseGuards(OptionalAuthGuard)` → must equal `OPTIONAL_AUTH_ROUTES`
 *      (one row per route: verb + path, controller method, guest behaviour,
 *      repositories/services reached).
 *   2. `src/modules/**\/{repositories,services}/*.ts` for optional-`userId`
 *      parameters (`userId: string | undefined`, `userId?: string`,
 *      `userId: string | null`) → must equal `OPTIONAL_USER_ID_SIGNATURES`
 *      (each with a disposition + the live source line that proves it).
 *   3. Every `prisma.srsCardState` reference lives in the review repository,
 *      and the review controllers mount NO `OptionalAuthGuard` — the structural
 *      reason a guest cannot reach SRS state.
 *
 * ## Adding a route (the point of this file)
 * A new `@UseGuards(OptionalAuthGuard)` handler MUST be added to
 * `OPTIONAL_AUTH_ROUTES` with its guest behaviour ("what does a caller with
 * `req.userId === undefined` get?") and the repositories/services it reaches.
 * If that route's guest path threads an optional `userId` into a repository or
 * service, add a row to `OPTIONAL_USER_ID_SIGNATURES` too. The failure message
 * says exactly this — a new guest-reachable read cannot slip in unlisted.
 *
 * Story 25-1: P0-1 Guest Isolation — repository-level SRS rejection.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

// ── Roots ──────────────────────────────────────────────────────────────────

/** `apps/backend` — this file lives at `src/nest/guards/__tests__/`. */
const BACKEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const MODULES_ROOT = path.join(BACKEND_ROOT, "src", "modules");

// ── The reviewed table (source of truth) ───────────────────────────────────

/**
 * One row per handler decorated with `@UseGuards(OptionalAuthGuard)`.
 * Paths are the `ROUTE_PATTERNS` form (the shell mounts them under `/api`).
 */
interface OptionalAuthRouteRow {
  /** HTTP verb, upper case. */
  verb: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Full Nest route path, e.g. `/v1/mnemonics/:character`. */
  path: string;
  /** `<controller file>#<handler method>` — exactly as the scanner reports it. */
  handler: string;
  /** What a caller with `req.userId === undefined` receives. */
  guestBehaviour: string;
  /** Repositories/services the guest path actually reaches. */
  reaches: string;
}

const OPTIONAL_AUTH_ROUTES: OptionalAuthRouteRow[] = [
  {
    verb: "GET",
    path: "/v1/mnemonics/:character",
    handler: "src/modules/mnemonics/nest/mnemonics-nest.controller.ts#getMnemonic",
    guestBehaviour:
      "4-step lookup skips step 1 (user-edited): shared cache → shared AI story → pictograph note, else `{ mnemonic: null }` — never another user's edited story",
    reaches:
      "MnemonicsService.getMnemonic → MnemonicsRepository.findAnyByCharacter + getCharacterByGlyph (findByCharacterAndUser NOT reached — MnemonicsService.ts:55)",
  },
  {
    verb: "GET",
    path: "/v1/progression/foundation-progress",
    handler: "src/modules/progression/nest/progression-nest.controller.ts#getFoundationProgress",
    guestBehaviour: "`[]` — short-circuits before the service (`if (!userId) return []`)",
    reaches: "none (no repository read)",
  },
  {
    verb: "GET",
    path: "/v1/progression/phase-gate",
    handler: "src/modules/progression/nest/progression-nest.controller.ts#getPhaseGate",
    guestBehaviour: "`createGuestPhaseGate()` → `{ currentPhase: 1, isGuest: true }`",
    reaches: "none (no repository read)",
  },
  {
    verb: "GET",
    path: "/v1/progression/gates",
    handler: "src/modules/progression/nest/progression-nest.controller.ts#getGates",
    guestBehaviour: "hand-written Phase-1-only gate literal — all three gates `passed: false`",
    reaches: "none (no repository read)",
  },
  {
    verb: "GET",
    path: "/v1/progression/radical-progress",
    handler: "src/modules/progression/nest/progression-nest.controller.ts#getRadicalProgress",
    guestBehaviour: "`[]` — short-circuits before the service (`if (!userId) return []`)",
    reaches: "none (no repository read)",
  },
  {
    verb: "POST",
    path: "/v1/tts",
    handler: "src/modules/audio/nest/audio-nest.controller.ts#getTtsAudio",
    guestBehaviour:
      "identical to authed: cache-first signed URL `{ audioUrl, cached }` (guest cache MISS synthesizes today — cost gate is epic-29)",
    reaches:
      "AudioService.getTtsUrl → AudioSynthesizer/AudioPathCache (GCS exists-check, no per-user DB read)",
  },
  {
    verb: "POST",
    path: "/v1/quiz/attempts",
    handler: "src/modules/quiz/nest/quiz-nest.controller.ts#createQuizAttempt",
    guestBehaviour: "session-local mock attempt (201, `userId: null`, no persistence, no tracking)",
    reaches: "none (guest branch returns before QuizService)",
  },
  {
    verb: "POST",
    path: "/v1/quiz/attempts/:id/answers",
    handler: "src/modules/quiz/nest/quiz-nest.controller.ts#submitAnswer",
    guestBehaviour:
      "session-local mock answer (correctness computed in the controller, no persistence)",
    reaches: "none (guest branch returns before QuizService)",
  },
  {
    verb: "PUT",
    path: "/v1/quiz/attempts/:id/complete",
    handler: "src/modules/quiz/nest/quiz-nest.controller.ts#completeQuizAttempt",
    guestBehaviour:
      "session-local mock completion `{ totalScore: 0, maxScore: 0, passed: false, accuracy: 0 }`",
    reaches: "none (guest branch returns before QuizService)",
  },
  {
    verb: "GET",
    path: "/v1/quiz/questions",
    handler: "src/modules/quiz/nest/quiz-nest.controller.ts#getQuestions",
    guestBehaviour: "public strategy question pool (shuffled) — `req.userId` never read",
    reaches:
      "QuizService.generateQuestions → registered strategy (shared content, no per-user read)",
  },
  {
    verb: "GET",
    path: "/v1/quiz/config",
    handler: "src/modules/quiz/nest/quiz-nest.controller.ts#getConfig",
    guestBehaviour: "public strategy metadata — `req.userId` never read",
    reaches: "QuizService.getQuizConfig (static strategy config)",
  },
  {
    verb: "GET",
    path: "/v1/quiz/sandhi-drill/questions",
    handler: "src/modules/quiz/nest/sandhi-drill-nest.controller.ts#getQuestions",
    guestBehaviour: "public sandhi drill pool — `req.userId` never read",
    reaches: "SandhiDrillService.generateQuestions → Word table (shared content)",
  },
  {
    verb: "GET",
    path: "/v1/readers/passages",
    handler: "src/modules/readers/nest/readers-nest.controller.ts#listPassages",
    guestBehaviour:
      "passages filtered by `hskLevel` only — the own-generated exclusion is a no-op for a guest (no identity predicate)",
    reaches: "ReadersService.listPassages → ReadersRepository.findPassages (hskLevel only)",
  },
  {
    verb: "GET",
    path: "/v1/readers/passages/:id",
    handler: "src/modules/readers/nest/readers-nest.controller.ts#getPassage",
    guestBehaviour:
      "passage + segments + HSK profile; `knownWordIds === undefined` (no per-word known status)",
    reaches:
      "ReadersService.getPassage → ReadersRepository.findPassageById + incrementAccessCount; computeKnownWordIds skipped",
  },
  {
    verb: "POST",
    path: "/v1/readers/passages/:id/audio",
    handler: "src/modules/readers/nest/readers-nest.controller.ts#getPassageAudio",
    guestBehaviour: "identical to authed: per-sentence GCS/TTS audio URLs (cache-first)",
    reaches: "ReadersService.getPassageAudio → ReadersAudioService (no per-user read)",
  },
];

/**
 * One row per repository/service parameter that accepts an absent identity.
 *
 * - `structural-reject` — the callee returns empty/0 BEFORE any Prisma call.
 * - `guarded-unreachable` — an absent identity never reaches the callee
 *   (a guard line or an `if (userId)` wrap above it makes it unreachable).
 * - `guest-safe-no-user-scope` — guest-reachable, and the `undefined` path
 *   either skips the identity-scoped step or feeds a query with NO identity
 *   predicate: the userId can steer the result but never widen a query into
 *   another user's rows.
 */
type OptionalUserIdDisposition =
  | `structural-reject:${string}`
  | `guarded-unreachable:${string}`
  | `guest-safe-no-user-scope:${string}`;

interface OptionalUserIdRow {
  /** `<file>:<line>` of the optional `userId` parameter itself. */
  declaresAt: string;
  /** Literal (whitespace-normalized) parameter text asserted on `declaresAt`. */
  declares: string;
  /** `<kind>:<file>:<line>` — the line that justifies the disposition. */
  disposition: OptionalUserIdDisposition;
  /** Literal source snippet asserted on the disposition's cited line. */
  evidence: string;
}

const OPTIONAL_USER_ID_SIGNATURES: OptionalUserIdRow[] = [
  {
    declaresAt: "src/modules/review/repositories/ReviewRepository.ts:83",
    declares: "userId: string | undefined",
    disposition: "structural-reject:src/modules/review/repositories/ReviewRepository.ts:86",
    evidence: "if (userId === undefined) {",
  },
  {
    declaresAt: "src/modules/review/repositories/ReviewRepository.ts:165",
    declares: "userId: string | undefined",
    disposition: "structural-reject:src/modules/review/repositories/ReviewRepository.ts:166",
    evidence: "if (userId === undefined) {",
  },
  {
    declaresAt: "src/modules/mnemonics/repositories/MnemonicsRepository.ts:24",
    declares: "userId: string | null",
    disposition: "guarded-unreachable:src/modules/mnemonics/services/MnemonicsService.ts:55",
    evidence: "if (userId) {",
  },
  {
    declaresAt: "src/modules/mnemonics/repositories/MnemonicsRepository.ts:71",
    declares: "userId: string | null",
    disposition: "guarded-unreachable:src/modules/mnemonics/nest/mnemonics-nest.controller.ts:120",
    evidence: "@UseGuards(RequireAuthGuard)",
  },
  {
    declaresAt: "src/modules/mnemonics/services/MnemonicsService.ts:53",
    declares: "userId?: string",
    disposition: "guest-safe-no-user-scope:src/modules/mnemonics/services/MnemonicsService.ts:55",
    evidence: "if (userId) {",
  },
  {
    declaresAt: "src/modules/readers/services/ReadersService.ts:70",
    declares: "userId?: string",
    disposition:
      "guest-safe-no-user-scope:src/modules/readers/repositories/ReadersRepository.ts:21",
    evidence: "async findPassages(hskLevel?: number)",
  },
  {
    declaresAt: "src/modules/readers/services/ReadersService.ts:89",
    declares: "userId?: string",
    disposition: "guest-safe-no-user-scope:src/modules/readers/services/ReadersService.ts:139",
    evidence: "const knownWordIds = userId ?",
  },
];

// ── Static scanner ─────────────────────────────────────────────────────────

const ROUTE_DECORATOR = /^\s*@(Get|Post|Put|Patch|Delete)\((?:(["'])([^"']*)\2)?\)\s*$/;
const CONTROLLER_DECORATOR = /^\s*@Controller\((["'])([^"']*)\1\)\s*$/;
const METHOD_DECLARATION =
  /^\s*(?:public\s+|private\s+|protected\s+)?(?:async\s+)?([A-Za-z_$][\w$]*)\s*\(/;
/**
 * The three optional-identity shapes: `userId: string | undefined`,
 * `userId: string | null`, and the optional parameter `userId?: string`.
 * A required `userId: string` is NOT a P0-1 candidate (Prisma always receives
 * a value), so it is deliberately not matched.
 */
const OPTIONAL_USER_ID = /userId\??\s*:\s*string\s*\|\s*(?:undefined|null)|userId\?\s*:\s*string/g;
/** `METHOD_DECLARATION` with the `gm` flags — `matchAll` requires `g`; `^` needs `m`. */
const METHOD_DECLARATION_GLOBAL = new RegExp(METHOD_DECLARATION.source, "gm");

interface DiscoveredRoute {
  verb: string;
  path: string;
  handler: string;
  usesOptionalAuth: boolean;
}

interface DiscoveredSignature {
  at: string;
  declares: string;
}

/** Recursively list `.ts` files under `dir`, skipping `__tests__` folders. */
function listSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "__tests__") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listSourceFiles(full));
    else if (entry.name.endsWith(".ts")) files.push(full);
  }
  return files;
}

/** Backend-relative, forward-slash form (`src/modules/...`). */
function relativeToBackend(file: string): string {
  return path.relative(BACKEND_ROOT, file).split(path.sep).join("/");
}

/** Read a `src/modules/<file>.ts:<line>` citation back out of the source. */
function citedSourceLine(reference: string): string {
  const match = /^(src\/modules\/.+\.ts):(\d+)$/.exec(reference);
  if (!match) {
    throw new Error(`"${reference}" is not a "src/modules/<file>.ts:<line>" citation`);
  }
  const lines = fs.readFileSync(path.join(BACKEND_ROOT, match[1]), "utf-8").split(/\r?\n/);
  return lines[Number(match[2]) - 1] ?? "";
}

/**
 * Every route handler in a controller file, with the guard decorators that
 * precede it (route decorator → any other decorators → method declaration).
 */
function scanController(file: string): DiscoveredRoute[] {
  const lines = fs.readFileSync(file, "utf-8").split(/\r?\n/);
  const handlerFile = relativeToBackend(file);
  const routes: DiscoveredRoute[] = [];
  let controllerPrefix = "";

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    const controller = CONTROLLER_DECORATOR.exec(line);
    if (controller) {
      controllerPrefix = controller[2];
      continue;
    }

    const route = ROUTE_DECORATOR.exec(line);
    if (!route) continue;

    const decorators = [line];
    let cursor = index + 1;
    while (cursor < lines.length && /^\s*@/.test(lines[cursor])) {
      decorators.push(lines[cursor]);
      cursor += 1;
    }

    const declaration = METHOD_DECLARATION.exec(lines[cursor] ?? "");
    if (!declaration) continue;

    const routePath = route[3] ?? "";
    routes.push({
      verb: route[1].toUpperCase(),
      path: `/${[controllerPrefix, routePath].filter((part) => part.length > 0).join("/")}`,
      handler: `${handlerFile}#${declaration[1]}`,
      usesOptionalAuth: decorators.some((decorator) => decorator.includes("OptionalAuthGuard")),
    });
    index = cursor;
  }

  return routes;
}

/** Slice the balanced `( … )` parameter list that opens at `openIndex`. */
function extractParams(text: string, openIndex: number): { params: string; offset: number } {
  let depth = 0;
  for (let cursor = openIndex; cursor < text.length; cursor += 1) {
    if (text[cursor] === "(") depth += 1;
    if (text[cursor] === ")") {
      depth -= 1;
      if (depth === 0) {
        return { params: text.slice(openIndex + 1, cursor), offset: openIndex + 1 };
      }
    }
  }
  return { params: "", offset: openIndex + 1 };
}

/**
 * Optional-`userId` parameters declared at the TOP level of a parameter list.
 * Nested object-type members (e.g. `toRecord(raw: { userId: string | null })`)
 * are record shapes, not call-facing parameters, so the brace depth excludes
 * them.
 */
function topLevelUserIdParams(params: string): Array<{ index: number; declares: string }> {
  const found: Array<{ index: number; declares: string }> = [];
  let depth = 0;

  for (let index = 0; index < params.length; index += 1) {
    const char = params[index];
    if (char === "{" || char === "[" || char === "(") {
      depth += 1;
      continue;
    }
    if (char === "}" || char === "]" || char === ")") {
      depth -= 1;
      continue;
    }
    if (depth !== 0 || /[\w$]/.test(params[index - 1] ?? "")) continue;

    OPTIONAL_USER_ID.lastIndex = index;
    const match = OPTIONAL_USER_ID.exec(params);
    if (match && match.index === index) {
      found.push({ index, declares: match[0].replace(/\s+/g, " ") });
    }
  }

  return found;
}

/** Every optional-`userId` parameter declared by a repository/service file. */
function scanOptionalUserIdParams(file: string): DiscoveredSignature[] {
  const text = fs.readFileSync(file, "utf-8");
  const handlerFile = relativeToBackend(file);
  const signatures: DiscoveredSignature[] = [];

  for (const match of text.matchAll(METHOD_DECLARATION_GLOBAL)) {
    if (match.index === undefined) continue;
    const openIndex = match.index + match[0].length - 1;
    const { params, offset } = extractParams(text, openIndex);

    for (const param of topLevelUserIdParams(params)) {
      const absoluteIndex = offset + param.index;
      const line = text.slice(0, absoluteIndex).split("\n").length;
      signatures.push({ at: `${handlerFile}:${line}`, declares: param.declares });
    }
  }

  return signatures;
}

// ── Discovery (top-level: these are pure filesystem reads) ─────────────────

const CONTROLLER_FILES = listSourceFiles(MODULES_ROOT).filter((file) =>
  /[\\/]nest[\\/][^\\/]+\.controller\.ts$/.test(file),
);

const REPOSITORY_AND_SERVICE_FILES = listSourceFiles(MODULES_ROOT).filter((file) =>
  [path.join("repositories"), path.join("services")].some((layer) =>
    file.includes(`${path.sep}${layer}${path.sep}`),
  ),
);

const DISCOVERED_ROUTES = CONTROLLER_FILES.flatMap(scanController);

const DISCOVERED_SIGNATURES = REPOSITORY_AND_SERVICE_FILES.flatMap(scanOptionalUserIdParams);

/** Fails with the guidance message when the two sets differ (either way). */
function expectSameSet(discovered: string[], declared: string[], guidance: string): void {
  const unlisted = discovered.filter((entry) => !declared.includes(entry));
  const stale = declared.filter((entry) => !discovered.includes(entry));
  expect(
    { unlisted, stale },
    [
      guidance,
      unlisted.length > 0 ? `UNLISTED in this file: ${unlisted.join(" | ")}.` : "",
      stale.length > 0
        ? `LISTED but no longer in the source (delete or update the row): ${stale.join(" | ")}.`
        : "",
    ]
      .filter(Boolean)
      .join(" "),
  ).toEqual({ unlisted: [], stale: [] });
}

// ── Inventory ──────────────────────────────────────────────────────────────

describe("OptionalAuthGuard coverage inventory (Story 25-1)", () => {
  it("lists one reviewed row per @UseGuards(OptionalAuthGuard) handler", () => {
    const discovered = DISCOVERED_ROUTES.filter((route) => route.usesOptionalAuth).map(
      (route) => `${route.verb} ${route.path} ${route.handler}`,
    );
    const declared = OPTIONAL_AUTH_ROUTES.map((row) => `${row.verb} ${row.path} ${row.handler}`);

    expectSameSet(
      discovered,
      declared,
      "A new OptionalAuthGuard route must be added to the OPTIONAL_AUTH_ROUTES table in this file, " +
        "with its guest behaviour (`req.userId === undefined`) and the repositories/services it reaches — " +
        "a guest-reachable read must never land unlisted (P0-1, Story 25-1).",
    );
  });

  it("lists one reviewed row per optional-userId repository/service signature", () => {
    const discovered = DISCOVERED_SIGNATURES.map(
      (signature) => `${signature.at} ${signature.declares}`,
    );
    const declared = OPTIONAL_USER_ID_SIGNATURES.map((row) => `${row.declaresAt} ${row.declares}`);

    expectSameSet(
      discovered,
      declared,
      "A new optional-userId signature must be added to the OPTIONAL_USER_ID_SIGNATURES table in this file " +
        "with a disposition (`structural-reject`, `guarded-unreachable:<file:line>` or " +
        "`guest-safe-no-user-scope:<file:line>`) and the source line that proves it. " +
        "Prisma drops `undefined` where-keys, so an unclassified optional userId is a P0-1 candidate.",
    );
  });

  it("cites a live source line for every declared parameter and disposition", () => {
    for (const row of OPTIONAL_USER_ID_SIGNATURES) {
      const declaration = citedSourceLine(row.declaresAt);
      expect(
        declaration.replace(/\s+/g, " "),
        `OPTIONAL_USER_ID_SIGNATURES row ${row.declaresAt} no longer declares "${row.declares}" — ` +
          "re-review the disposition before updating the row.",
      ).toContain(row.declares);

      const disposition = /^([a-z-]+):(.+):(\d+)$/.exec(row.disposition);
      const reference = disposition ? `${disposition[2]}:${disposition[3]}` : "";
      expect(
        citedSourceLine(reference),
        `Disposition row ${row.declaresAt} cites ${reference} as "${row.evidence}", but that line does not ` +
          "contain it — the guard/rejection moved, so re-verify the disposition (do not just change the text).",
      ).toContain(row.evidence);
    }
  });

  it("documents a guest behaviour and a reached dependency for every route", () => {
    for (const row of OPTIONAL_AUTH_ROUTES) {
      expect(
        row.guestBehaviour.length,
        `${row.verb} ${row.path} has no guestBehaviour`,
      ).toBeGreaterThan(10);
      expect(row.reaches.length, `${row.verb} ${row.path} has no reaches`).toBeGreaterThan(3);
    }
  });

  it("keeps every srsCardState query inside review/, whose handlers are all requireAuth", () => {
    const srsFiles = listSourceFiles(MODULES_ROOT)
      .filter((file) => fs.readFileSync(file, "utf-8").includes("prisma.srsCardState"))
      .map(relativeToBackend);

    expect(srsFiles).toEqual(["src/modules/review/repositories/ReviewRepository.ts"]);

    const reviewRoutes = CONTROLLER_FILES.filter((file) =>
      file.includes(`${path.sep}review${path.sep}`),
    ).flatMap(scanController);

    expect(reviewRoutes.length).toBeGreaterThan(0);
    expect(reviewRoutes.filter((route) => route.usesOptionalAuth)).toEqual([]);
  });
});
