/**
 * @file apps/backend/src/nest/guards/__tests__/optional-auth-coverage.test.ts
 * @description Story 25-1 (P0-1 Guest Isolation) — the EXECUTABLE inventory of
 * every `OptionalAuthGuard` route and every optional-`userId` signature.
 *
 * P0-1 is the class of bug where `where: { userId: undefined }` is silently
 * dropped by Prisma, turning a per-user read into a cross-tenant one. The
 * 2026-10-27 audit proved no `optionalAuth` route can reach `srsCardState`
 * today — but a prose list rots the moment someone adds a route. This test is
 * the anti-rot mechanism: it STATICALLY scans the source and fails unless the
 * discovered set EQUALS the reviewed table below.
 *
 * Scans (no Nest bootstrap, no DB — pure filesystem):
 *   1. EVERY `*.controller.ts` under `src/modules/**` **or** `src/nest/**` (path
 *      is irrelevant — discovery is by filename) for handlers decorated with
 *      `@UseGuards(OptionalAuthGuard)` → must equal `OPTIONAL_AUTH_ROUTES`
 *      (one row per route: verb + path, controller method, guest behaviour,
 *      repositories/services reached).
 *   2. EVERY non-test `.ts` file under `src/modules/**` — every layer, not just
 *      `repositories/` and `services/` — for optional-`userId` parameters
 *      (`userId: string | undefined`, `userId?: string`,
 *      `userId: string | null`, and the `_userId?: string` spelling) → must
 *      equal `OPTIONAL_USER_ID_SIGNATURES`
 *      (each with a disposition + the live source line that proves it).
 *      Strategies, factories and type contracts are all in scope; a signature
 *      that is not a call-facing parameter must appear in
 *      `OPTIONAL_USER_ID_EXCLUSIONS` with its structural reason.
 *   3. A plain-text sweep of the same files backstops (2): it finds the shape
 *      in ANY syntactic position, so a form the parameter patterns do not
 *      know about fails the inventory instead of going quietly unclassified.
 *   4. Every `prisma.srsCardState` reference lives in the review repository,
 *      and the review controllers mount NO `OptionalAuthGuard` — the structural
 *      reason a guest cannot reach SRS state.
 *
 * ## Adding a route (the point of this file)
 * A new `@UseGuards(OptionalAuthGuard)` handler MUST be added to
 * `OPTIONAL_AUTH_ROUTES` with its guest behaviour ("what does a caller with
 * `req.userId === undefined` get?") and the repositories/services it reaches.
 * If that route's guest path threads an optional `userId` into any module file
 * (repository, service, strategy, factory), add a row to
 * `OPTIONAL_USER_ID_SIGNATURES` too. The failure message
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
/** The Nest shell — scanned for controllers too (a shell-level controller is legal). */
const NEST_ROOT = path.join(BACKEND_ROOT, "src", "nest");

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
 * One row per optional-`userId` DECLARATION that accepts an absent identity —
 * implementation parameters (repository, service, strategy) and the type
 * contracts that restate them. A contract row cites the implementation that
 * carries the behaviour: an interface cannot leak on its own, but it is what a
 * future implementation will be written against, so it is inventoried too.
 *
 * - `structural-reject` — the callee returns empty/0 BEFORE any Prisma call.
 * - `guarded-unreachable` — an absent identity never reaches the callee
 *   (a guard line or an `if (userId)` wrap above it makes it unreachable).
 * - `guest-safe-no-user-scope` — guest-reachable, and the `undefined` path
 *   either skips the identity-scoped step or feeds a query with NO identity
 *   predicate: the userId can steer the result but never widen a query into
 *   another user's rows. A parameter that is never read at all (dead identity
 *   plumbing, `_userId`) is the strongest case of this class.
 */
type OptionalUserIdDisposition =
  | `structural-reject:${string}`
  | `guarded-unreachable:${string}`
  | `guest-safe-no-user-scope:${string}`;

interface OptionalUserIdRow {
  /** `<file>:<line>` of the optional `userId` declaration itself. */
  declaresAt: string;
  /** Literal (whitespace-normalized) declaration text asserted on `declaresAt`. */
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
    // Contract mirror of `ReviewRepository.findByUserAndTypes` — the interface
    // declares the shape, the implementation carries (and rejects) it.
    declaresAt: "src/modules/review/types/review.ts:39",
    declares: "userId: string | undefined",
    disposition: "structural-reject:src/modules/review/repositories/ReviewRepository.ts:86",
    evidence: "if (userId === undefined) {",
  },
  {
    // Contract mirror of `ReviewRepository.countDue`.
    declaresAt: "src/modules/review/types/review.ts:54",
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
    // Contract mirror of `MnemonicsRepository.findByCharacterAndUser`.
    declaresAt: "src/modules/mnemonics/types/mnemonics.ts:108",
    declares: "userId: string | null",
    disposition: "guarded-unreachable:src/modules/mnemonics/services/MnemonicsService.ts:55",
    evidence: "if (userId) {",
  },
  {
    // Contract mirror of `MnemonicsRepository.upsert` (write path).
    declaresAt: "src/modules/mnemonics/types/mnemonics.ts:119",
    declares: "userId: string | null",
    disposition: "guarded-unreachable:src/modules/mnemonics/nest/mnemonics-nest.controller.ts:120",
    evidence: "@UseGuards(RequireAuthGuard)",
  },
  {
    // Contract mirror of `MnemonicsService.getMnemonic`.
    declaresAt: "src/modules/mnemonics/types/mnemonics.ts:133",
    declares: "userId?: string",
    disposition: "guest-safe-no-user-scope:src/modules/mnemonics/services/MnemonicsService.ts:55",
    evidence: "if (userId) {",
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
  {
    // Quiz strategies: the parameter is dead (`_userId`, never read). The only
    // read in the body is shared content with no identity predicate, and its
    // only caller never supplies an identity (see the `quiz/types/quiz.ts` row).
    declaresAt: "src/modules/quiz/strategies/AudioToPinyinAndToneStrategy.ts:30",
    declares: "_userId?: string",
    disposition:
      "guest-safe-no-user-scope:src/modules/quiz/strategies/AudioToPinyinAndToneStrategy.ts:31",
    evidence: "prisma.pinyinSyllable.findMany({",
  },
  {
    declaresAt: "src/modules/quiz/strategies/ImeSimulatorStrategy.ts:24",
    declares: "_userId?: string",
    disposition: "guest-safe-no-user-scope:src/modules/quiz/strategies/ImeSimulatorStrategy.ts:28",
    evidence: "prisma.radical.findMany({",
  },
  {
    declaresAt: "src/modules/quiz/strategies/QualificationQuizStrategy.ts:79",
    declares: "userId?: string",
    disposition:
      "guest-safe-no-user-scope:src/modules/quiz/strategies/QualificationQuizStrategy.ts:85",
    evidence: "prisma.character.findMany({",
  },
  {
    // No query at all: the generator's only input is the passage record.
    declaresAt: "src/modules/quiz/strategies/ComprehensionQuizStrategy.ts:274",
    declares: "userId?: string",
    disposition:
      "guest-safe-no-user-scope:src/modules/quiz/strategies/ComprehensionQuizStrategy.ts:281",
    evidence: "const content = passage.content as PassageContent;",
  },
  {
    // Contract mirror of every `generateQuestions` strategy — cited at the one
    // dispatch site, which passes NO identity (`generateQuestions(/*userId*/)`).
    declaresAt: "src/modules/quiz/types/quiz.ts:15",
    declares: "userId?: string",
    disposition: "guest-safe-no-user-scope:src/modules/quiz/services/QuizService.ts:274",
    evidence: "await strategy.generateQuestions(/*userId*/);",
  },
];

// ── Documented structural exclusions ───────────────────────────────────────

/**
 * Optional-`userId` occurrences that are NOT call-facing parameters. Each row
 * carries the structural reason it can never carry an identity into a query —
 * deliberately not a filename allow-list: the test asserts the cited line still
 * holds the literal text and that the parameter scan really does not find it,
 * so a moved or re-shaped exclusion fails instead of silently widening.
 */
interface OptionalUserIdExclusion {
  /** `<file>:<line>` of the occurrence. */
  at: string;
  /** Literal (whitespace-normalized) text asserted on `at`. */
  declares: string;
  /** Why this is a record shape rather than a call-facing parameter. */
  reason: string;
}

const OPTIONAL_USER_ID_EXCLUSIONS: OptionalUserIdExclusion[] = [
  {
    at: "src/modules/mnemonics/repositories/MnemonicsRepository.ts:185",
    declares: "userId: string | null",
    reason:
      "field of the inline record shape `toRecord(raw: { … })` — a Prisma row mapping; the brace-depth rule in `topLevelUserIdParams` excludes it because it is not passed by a caller but read off a row",
  },
  {
    at: "src/modules/mnemonics/types/mnemonics.ts:70",
    declares: "userId: string | null",
    reason:
      "`MnemonicStoryRecord` interface property — the row shape a repository returns; it sits outside every parameter list, so no call site can supply or drop it",
  },
];

// ── Static scanner ─────────────────────────────────────────────────────────

/** `@Controller("prefix")` / `@Controller()` — supplies the route prefix. */
const CONTROLLER_AT = /@Controller\s*\(\s*(?:(["'])([^"']*)\1\s*)?\)/g;
/** A whole decorator text, e.g. `@UseGuards(JwtAuthGuard, OptionalAuthGuard)`. */
const DECORATOR_SOURCE = /@[A-Za-z_$][\w$]*(?:\s*\((?:[^()]|\([^()]*\))*\))?/.source;
/**
 * A decorator at an exact offset. Sticky, not line-anchored: decorators may sit
 * on the same line as each other or as the method they decorate, and their
 * arguments may wrap across lines.
 */
const DECORATOR_AT = new RegExp(DECORATOR_SOURCE, "y");
/** A route decorator matched against ONE decorator's text (the path is group 3). */
const ROUTE_DECORATOR = /^@(Get|Post|Put|Patch|Delete)\s*\(\s*(?:(["'])([^"']*)\2\s*)?\)$/;
/** A method declaration at an exact offset (sticky): decorators → modifiers → name `(`. */
const METHOD_AT =
  /(?:(?:public|private|protected|static|readonly|override|abstract|async)\s+)*([A-Za-z_$][\w$]*)\s*(?:<[^<>]*>)?\s*\(/y;

/**
 * Function-like declarations whose first `( … )` is a call-facing parameter
 * list. All three forms this backend uses are scanned, so an optional `userId`
 * cannot hide in the one form the scan forgot:
 *   1. method declarations (classes, object literals, interface members — the
 *      contract of a repository/service/strategy is where its shape is named)
 *   2. `function foo( … )` declarations
 *   3. arrow functions bound to a name: `const foo = async ( … ) => …`
 */
const SIGNATURE_PATTERNS: RegExp[] = [
  /^\s*(?:(?:public|private|protected|static|readonly|override|abstract)\s+)*(?:async\s+)?([A-Za-z_$][\w$]*)\s*(?:<[^<>]*>)?\s*\(/gm,
  /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm,
  /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=(]+)?=\s*(?:async\s*)?\(/gm,
];
/**
 * The three optional-identity shapes: `userId: string | undefined`,
 * `userId: string | null`, and the optional parameter `userId?: string` —
 * including the `_userId` spelling TypeScript's "declared but unused" lint
 * convention produces (`ImeSimulatorStrategy.ts:24`), which is the SAME shape
 * and must be inventoried: "unused today" is one edit away from "used".
 * A required `userId: string` is NOT a P0-1 candidate (Prisma always receives
 * a value), so it is deliberately not matched.
 */
const OPTIONAL_USER_ID =
  /_?userId\??\s*:\s*string\s*\|\s*(?:undefined|null)|_?userId\?\s*:\s*string/g;
/**
 * The same shapes for the occurrence sweep — its own instance so the sweep can
 * never inherit the `lastIndex` left behind by `topLevelUserIdParams`.
 */
const OPTIONAL_USER_ID_SWEEP = new RegExp(OPTIONAL_USER_ID.source, "g");

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

/**
 * Recursively list `.ts` files under `dir`, skipping `__tests__` folders and
 * test files — the inventory is about production source.
 */
function listSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "__tests__") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listSourceFiles(full));
    else if (entry.name.endsWith(".ts") && !/\.(test|spec)\.ts$/.test(entry.name)) {
      files.push(full);
    }
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
 * Skip whitespace and comments from `start`, returning the next code offset.
 * Comments are skipped (never stripped) so every reported line still matches
 * the line number of the real source file.
 */
function skipTrivia(source: string, start: number): number {
  let index = start;
  while (index < source.length) {
    const char = source[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if (char === "/" && source[index + 1] === "/") {
      while (index < source.length && source[index] !== "\n") index += 1;
      continue;
    }
    if (char === "/" && source[index + 1] === "*") {
      index += 2;
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
        index += 1;
      }
      index += 2;
      continue;
    }
    break;
  }
  return index;
}

/**
 * Every route handler in a controller SOURCE, with the decorators that precede
 * it. Placement is irrelevant: the walk collects any contiguous run of
 * decorators (same line or stacked, single-line or wrapped arguments) and binds
 * it to the next method declaration, so `@Get("x") @UseGuards(OptionalAuthGuard)`
 * and the multi-line form classify identically.
 */
function scanControllerSource(source: string, handlerFile: string): DiscoveredRoute[] {
  const prefixes = [...source.matchAll(CONTROLLER_AT)].map((match) => ({
    index: match.index ?? 0,
    prefix: match[2] ?? "",
  }));

  const routes: DiscoveredRoute[] = [];
  let decorators: string[] = [];
  let cursor = 0;

  while (cursor < source.length) {
    cursor = skipTrivia(source, cursor);

    DECORATOR_AT.lastIndex = cursor;
    const decorator = DECORATOR_AT.exec(source);
    if (decorator) {
      decorators.push(decorator[0]);
      cursor = DECORATOR_AT.lastIndex;
      continue;
    }

    METHOD_AT.lastIndex = cursor;
    const method = METHOD_AT.exec(source);
    if (method) {
      const route = decorators
        .map((text) => ROUTE_DECORATOR.exec(text))
        .find((match): match is RegExpExecArray => match !== null);
      if (route) {
        const routePath = route[3] ?? "";
        const prefix = prefixes.filter((entry) => entry.index < cursor).at(-1)?.prefix ?? "";
        routes.push({
          verb: route[1].toUpperCase(),
          path: `/${[prefix, routePath].filter((part) => part.length > 0).join("/")}`,
          handler: `${handlerFile}#${method[1]}`,
          usesOptionalAuth: decorators.some((text) => text.includes("OptionalAuthGuard")),
        });
      }
      decorators = [];
      cursor = METHOD_AT.lastIndex;
      continue;
    }

    // Any other token ends the decorator run: a decorator only ever binds to
    // the method declaration that follows it with nothing but trivia between.
    decorators = [];
    cursor += 1;
  }

  return routes;
}

/** {@link scanControllerSource} against a file on disk. */
function scanController(file: string): DiscoveredRoute[] {
  return scanControllerSource(fs.readFileSync(file, "utf-8"), relativeToBackend(file));
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

/**
 * Every optional-`userId` parameter in a module SOURCE, whatever function form
 * declares it (method, `function`, or arrow) — see {@link SIGNATURE_PATTERNS}.
 * The same parameter can match more than one pattern, so results are deduped
 * by offset.
 */
function scanOptionalUserIdParamsSource(
  source: string,
  handlerFile: string,
): DiscoveredSignature[] {
  const signatures: DiscoveredSignature[] = [];
  const seen = new Set<number>();

  for (const pattern of SIGNATURE_PATTERNS) {
    for (const match of source.matchAll(pattern)) {
      if (match.index === undefined) continue;
      const openIndex = match.index + match[0].length - 1;
      const { params, offset } = extractParams(source, openIndex);

      for (const param of topLevelUserIdParams(params)) {
        const absoluteIndex = offset + param.index;
        if (seen.has(absoluteIndex)) continue;
        seen.add(absoluteIndex);
        const line = source.slice(0, absoluteIndex).split("\n").length;
        signatures.push({ at: `${handlerFile}:${line}`, declares: param.declares });
      }
    }
  }

  return signatures;
}

/** {@link scanOptionalUserIdParamsSource} against a file on disk. */
function scanOptionalUserIdParams(file: string): DiscoveredSignature[] {
  return scanOptionalUserIdParamsSource(fs.readFileSync(file, "utf-8"), relativeToBackend(file));
}

/**
 * EVERY optional-`userId` occurrence in a file, found by a plain text sweep —
 * no knowledge of function forms at all. This is the backstop the pattern scan
 * cannot be: if a new shape appears that `SIGNATURE_PATTERNS` does not
 * recognise (a function-typed property, an exotic declaration), the sweep still
 * sees it and the inventory fails instead of going quietly blind.
 *
 * Comment lines are skipped (`// …`, `/* …` and the ` * …` lines of a JSDoc
 * block): prose that DESCRIBES a shape (`review/types/review.ts:34`) declares
 * nothing.
 */
function scanOptionalUserIdOccurrencesSource(
  source: string,
  handlerFile: string,
): DiscoveredSignature[] {
  const lines = source.split(/\r?\n/);
  const occurrences: DiscoveredSignature[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (/^\s*(?:\/\/|\/\*|\*)/.test(lines[index])) continue;
    for (const match of lines[index].matchAll(OPTIONAL_USER_ID_SWEEP)) {
      occurrences.push({
        at: `${handlerFile}:${index + 1}`,
        declares: match[0].replace(/\s+/g, " "),
      });
    }
  }

  return occurrences;
}

/** {@link scanOptionalUserIdOccurrencesSource} against a file on disk. */
function scanOptionalUserIdOccurrences(file: string): DiscoveredSignature[] {
  return scanOptionalUserIdOccurrencesSource(
    fs.readFileSync(file, "utf-8"),
    relativeToBackend(file),
  );
}

// ── Discovery (top-level: these are pure filesystem reads) ─────────────────

/**
 * Every non-test module source file — the signature scan's root. Every layer is
 * in scope (`repositories/`, `services/`, `strategies/`, `types/`, …): an
 * optional `userId` in a directory the scan skipped is exactly the porosity
 * this inventory exists to prevent.
 */
const MODULE_SOURCE_FILES = listSourceFiles(MODULES_ROOT);

/**
 * Controllers are discovered by FILENAME, not by path: any `*.controller.ts`
 * under `src/modules/**` or `src/nest/**`. `nest/` is where they live today, but
 * a controller added anywhere else (the retired Express `api/` shape, or the
 * shell) must not be able to go invisible.
 */
const CONTROLLER_FILES = [...listSourceFiles(MODULES_ROOT), ...listSourceFiles(NEST_ROOT)].filter(
  (file) => path.basename(file).endsWith(".controller.ts"),
);

const DISCOVERED_ROUTES = CONTROLLER_FILES.flatMap(scanController);

const DISCOVERED_SIGNATURES = MODULE_SOURCE_FILES.flatMap(scanOptionalUserIdParams);

const DISCOVERED_OCCURRENCES = MODULE_SOURCE_FILES.flatMap(scanOptionalUserIdOccurrences);

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

  it("lists one reviewed row per optional-userId declaration in module source", () => {
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

  it("accounts for every optional-userId occurrence in module source (no blind spot)", () => {
    const accounted = new Set([
      ...DISCOVERED_SIGNATURES.map((signature) => `${signature.at} ${signature.declares}`),
      ...OPTIONAL_USER_ID_EXCLUSIONS.map((row) => `${row.at} ${row.declares}`),
    ]);
    const unaccounted = DISCOVERED_OCCURRENCES.map(
      (occurrence) => `${occurrence.at} ${occurrence.declares}`,
    ).filter((entry) => !accounted.has(entry));

    expect(
      DISCOVERED_OCCURRENCES.length,
      "The sweep found fewer shapes than the parameter scan — the sweep regex is broken and this " +
        "test would otherwise pass vacuously.",
    ).toBeGreaterThanOrEqual(DISCOVERED_SIGNATURES.length);

    expect(
      unaccounted,
      "The text sweep found an optional userId that neither the parameter scan nor " +
        "OPTIONAL_USER_ID_EXCLUSIONS accounts for. It is most likely a function form " +
        "`SIGNATURE_PATTERNS` does not know (add it there, then add the row) or a non-parameter " +
        "shape (document it in OPTIONAL_USER_ID_EXCLUSIONS with its structural reason). The sweep " +
        "exists so a shape the scan cannot parse fails here instead of slipping through unclassified.",
    ).toEqual([]);
  });

  it("documents a structural reason for every excluded occurrence", () => {
    const discovered = DISCOVERED_SIGNATURES.map(
      (signature) => `${signature.at} ${signature.declares}`,
    );

    for (const row of OPTIONAL_USER_ID_EXCLUSIONS) {
      expect(
        citedSourceLine(row.at).replace(/\s+/g, " "),
        `Exclusion ${row.at} no longer holds "${row.declares}" — re-check whether it is still a record shape.`,
      ).toContain(row.declares);
      expect(row.reason.length, `Exclusion ${row.at} has no structural reason`).toBeGreaterThan(20);
      expect(
        DISCOVERED_OCCURRENCES.map((occurrence) => `${occurrence.at} ${occurrence.declares}`),
        `Exclusion ${row.at} is not reported by the sweep — either the occurrence moved or the sweep ` +
          "no longer sees it, so this row is proving nothing.",
      ).toContain(`${row.at} ${row.declares}`);
      expect(
        discovered,
        `${row.at} is excluded as a non-parameter, but the parameter scan DID discover it — ` +
          "delete the exclusion row and classify it in OPTIONAL_USER_ID_SIGNATURES instead.",
      ).not.toContain(`${row.at} ${row.declares}`);
    }
  });

  // ── Scanner self-tests ───────────────────────────────────────────────────
  // The inventory is only as good as these two scanners. Each is exercised on
  // a fixture STRING through the same function the real files go through, so a
  // decorator-placement or declaration-form regression fails here with a
  // readable message instead of showing up as a mysterious inventory diff.

  it("scanner: binds decorators by proximity, not by line", () => {
    const fixture = [
      'import { Controller, Get, Post, Put, Req } from "@nestjs/common";',
      "",
      '@Controller("v1/fixture")',
      "export class FixtureController {",
      '  @Get("same-line") @UseGuards(OptionalAuthGuard) async getSameLine(@Req() req: Request) {}',
      "",
      '  @Get("stacked")',
      "  @UseGuards(RequireAuthGuard)",
      "  @HttpCode(200)",
      "  async getStacked(@Req() req: Request) {}",
      "",
      '  @Post("wrapped-guard")',
      "  @UseGuards(",
      "    RequireAuthGuard,",
      "    OptionalAuthGuard,",
      "  )",
      "  async postWrapped(@Body() body: unknown) {}",
      "",
      '  // @Get("commented-out")',
      '  @Put("multi-line-signature")',
      "  @UseGuards(OptionalAuthGuard)",
      "  async putMultiLine(",
      '    @Param("id") id: string,',
      "    @Req() req: Request,",
      "  ): Promise<unknown> {",
      "    return undefined;",
      "  }",
      "}",
    ].join("\n");

    const routes = scanControllerSource(fixture, "src/modules/fixture/nest/fixture.controller.ts");

    expect(routes.map((route) => `${route.verb} ${route.path}`)).toEqual([
      "GET /v1/fixture/same-line",
      "GET /v1/fixture/stacked",
      "POST /v1/fixture/wrapped-guard",
      "PUT /v1/fixture/multi-line-signature",
    ]);
    expect(routes.map((route) => route.usesOptionalAuth)).toEqual([true, false, true, true]);
    expect(routes.map((route) => route.handler.split("#")[1])).toEqual([
      "getSameLine",
      "getStacked",
      "postWrapped",
      "putMultiLine",
    ]);
  });

  it("scanner: finds optional userId in every function form and ignores record shapes", () => {
    const fixture = [
      "export class FixtureRepository {",
      "  async findOne(userId?: string): Promise<unknown> {",
      "    return this.toRecord({ userId: null });",
      "  }",
      "",
      "  private toRecord(raw: { userId: string | null; other: string }): unknown {",
      "    return raw;",
      "  }",
      "}",
      "",
      "export async function findTwo(userId: string | null, other: string) {",
      "  return other;",
      "}",
      "",
      "export const findThree = async (",
      "  other: string,",
      "  userId?: string,",
      ") => other;",
      "",
      "// async findCommented(userId?: string) {}",
    ].join("\n");

    const signatures = scanOptionalUserIdParamsSource(
      fixture,
      "src/modules/fixture/repositories/FixtureRepository.ts",
    );

    expect(signatures).toEqual([
      {
        at: "src/modules/fixture/repositories/FixtureRepository.ts:2",
        declares: "userId?: string",
      },
      {
        at: "src/modules/fixture/repositories/FixtureRepository.ts:11",
        declares: "userId: string | null",
      },
      {
        at: "src/modules/fixture/repositories/FixtureRepository.ts:17",
        declares: "userId?: string",
      },
    ]);
  });

  it("sweep: catches a shape the parameter scan cannot parse", () => {
    // A function-typed PROPERTY: the parameter patterns do not see it (no
    // `name(` declaration on the line), so only the sweep can report it. This
    // is the proof that the "no blind spot" test above is not vacuous.
    const fixture = [
      "export interface FixtureOptions {",
      "  onLoad?: (userId?: string) => void;",
      "}",
    ].join("\n");

    expect(scanOptionalUserIdParamsSource(fixture, "src/modules/fixture/types/fixture.ts")).toEqual(
      [],
    );
    expect(
      scanOptionalUserIdOccurrencesSource(fixture, "src/modules/fixture/types/fixture.ts"),
    ).toEqual([{ at: "src/modules/fixture/types/fixture.ts:2", declares: "userId?: string" }]);
  });

  it("discovers a handler for every route decorator in the controller files", () => {
    // Self-consistency: the number of routes the scanner reports must equal the
    // number of route decorators actually written in the discovered files. A
    // scanner that silently drops a handler (the F2 "porous inventory" class)
    // fails here even when the dropped handler mounts no guard.
    //
    // Counted at LINE START (`@Get(` / `@Post(` …), which is comment-safe: the
    // prose in these controllers mentions routes as `* → \`@Get("items")\``,
    // never at the start of a line.
    const written = CONTROLLER_FILES.reduce(
      (total, file) =>
        total +
        fs
          .readFileSync(file, "utf-8")
          .split(/\r?\n/)
          .filter((line) => /^\s*@(?:Get|Post|Put|Patch|Delete)\s*\(/.test(line)).length,
      0,
    );

    expect(
      DISCOVERED_ROUTES.length,
      `${CONTROLLER_FILES.length} controller file(s) declare ${written} route decorator(s) but the ` +
        `scanner found ${DISCOVERED_ROUTES.length} handler(s) — a decorator placement or a method ` +
        "declaration form is not being parsed.",
    ).toBe(written);
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
