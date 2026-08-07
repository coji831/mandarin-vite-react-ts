/**
 * @file mocks/server.ts
 * @description MSW node server for Vitest — Testing Trophy INTEGRATION tier.
 *
 * Aggregates the per-endpoint handlers from `src/mocks/handlers/*` into a
 * single `setupServer` so component/hook/page integration tests can intercept
 * real `apiClient` requests without a running backend.
 *
 * The handler modules export heterogeneous shapes (arrays, objects of
 * factories, function factories); `handlers` flattens the "default" (populated)
 * state of each into a flat `HttpHandler[]`.
 *
 * Usage in a test file:
 *   import { server } from "src/mocks/server";
 *   import { http, HttpResponse } from "msw";
 *
 *   beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
 *   afterEach(() => server.resetHandlers());
 *   afterAll(() => server.close());
 *
 *   it("...", () => {
 *     server.use(http.get("http://localhost:3001/api/v1/readers/passages", () =>
 *       HttpResponse.json({ data: [...] })));
 *   });
 *
 * NOTE: `apiClient` baseURL is `http://localhost:3001/api` (see shared/config/api.ts),
 * so inline test handlers must use the full `/api/v1/...` path to match.
 */
import { setupServer, type SetupServer } from "msw/node";
import type { HttpHandler } from "msw";
import { radicalsHandlers } from "./handlers/radicals-handlers";
import { quizHandlers } from "./handlers/quiz-handlers";
import { charactersHandlers } from "./handlers/characters-handlers";
import { phoneticClustersHandlers } from "./handlers/phonetic-clusters-handlers";
import { grammarHandlers } from "./handlers/grammar-handlers";

/** Default (populated) handlers from every endpoint module, flattened. */
export const handlers: HttpHandler[] = [
  // radicals-handlers exports a flat array
  ...radicalsHandlers,
  // quiz-handlers exports { default: { sandhiQuestions, createAttempt }, ... }
  ...Object.values(quizHandlers.default),
  // characters-handlers exports { default: { getCharacter, ... }, ... }
  ...Object.values(charactersHandlers.default),
  // phonetic-clusters-handlers exports factory functions
  phoneticClustersHandlers.default(),
  // grammar-handlers exports a default() factory returning an array of handlers
  ...grammarHandlers.default(),
];

/** MSW node server preloaded with the default handlers. */
export const server: SetupServer = setupServer(...handlers);

// Re-export the per-endpoint modules so tests can reference them (e.g. `server.use(radicalsErrorHandler)`).
export {
  radicalsHandlers,
  quizHandlers,
  charactersHandlers,
  phoneticClustersHandlers,
  grammarHandlers,
};
