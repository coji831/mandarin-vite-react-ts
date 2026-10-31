/**
 * MSW handlers for Storybook
 *
 * Covers the API endpoints that stories exercise during render.
 * Only add handlers for endpoints that stories actually hit.
 */
import { http, HttpResponse } from "msw";

const API_BASE = "http://localhost:3001/api/v1";

/**
 * Pre-built phase-gate response bodies for each phase.
 */
const PHASE_GATE_BODIES = {
  phase1: {
    id: "pg-storybook-1",
    currentPhase: 1,
    phase1Passed: false,
    phase2Passed: false,
    phase3Passed: false,
    phase4Unlocked: false,
    qualificationScore: null,
    placedPhase: null,
    phase1Retention: null,
    phase2Retention: null,
    phase3Retention: null,
    gateCriteria: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  phase2: {
    id: "pg-storybook-2",
    currentPhase: 2,
    phase1Passed: true,
    phase2Passed: false,
    phase3Passed: false,
    phase4Unlocked: false,
    qualificationScore: 85,
    placedPhase: null,
    phase1Retention: null,
    phase2Retention: null,
    phase3Retention: null,
    gateCriteria: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  phase3: {
    id: "pg-storybook-3",
    currentPhase: 3,
    phase1Passed: true,
    phase2Passed: true,
    phase3Passed: false,
    phase4Unlocked: false,
    qualificationScore: 90,
    placedPhase: null,
    phase1Retention: 92,
    phase2Retention: 88,
    phase3Retention: null,
    gateCriteria: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  phase4: {
    id: "pg-storybook-4",
    currentPhase: 4,
    phase1Passed: true,
    phase2Passed: true,
    phase3Passed: true,
    phase4Unlocked: true,
    qualificationScore: 95,
    placedPhase: null,
    phase1Retention: 94,
    phase2Retention: 91,
    phase3Retention: 89,
    gateCriteria: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
};

/**
 * Pre-built radical progress response bodies for Storybook.
 * Maps radical IDs to memorized progress records.
 */
const RADICAL_PROGRESS_BODIES = {
  all: [
    {
      id: "rp-rad_0001",
      userId: "storybook-user",
      radicalId: "rad_0001",
      memorized: true,
      recognitionLevel: 5,
      reviewedAt: "2026-07-01T00:00:00Z",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-07-01T00:00:00Z",
    },
    {
      id: "rp-rad_0002",
      userId: "storybook-user",
      radicalId: "rad_0002",
      memorized: true,
      recognitionLevel: 4,
      reviewedAt: "2026-06-28T00:00:00Z",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-06-28T00:00:00Z",
    },
    {
      id: "rp-rad_0003",
      userId: "storybook-user",
      radicalId: "rad_0003",
      memorized: true,
      recognitionLevel: 3,
      reviewedAt: "2026-06-25T00:00:00Z",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-06-25T00:00:00Z",
    },
    {
      id: "rp-rad_0008",
      userId: "storybook-user",
      radicalId: "rad_0008",
      memorized: true,
      recognitionLevel: 4,
      reviewedAt: "2026-07-05T00:00:00Z",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-07-05T00:00:00Z",
    },
    {
      id: "rp-rad_0009",
      userId: "storybook-user",
      radicalId: "rad_0009",
      memorized: true,
      recognitionLevel: 5,
      reviewedAt: "2026-07-10T00:00:00Z",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-07-10T00:00:00Z",
    },
    {
      id: "rp-rad_0030",
      userId: "storybook-user",
      radicalId: "rad_0030",
      memorized: false,
      recognitionLevel: 2,
      reviewedAt: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ],
};

export const mswHandlers = {
  auth: [
    // Token refresh — called by AuthProvider on mount
    http.post(`${API_BASE}/auth/refresh`, () => {
      return HttpResponse.json({ data: { accessToken: "storybook-mock-token" } }, { status: 200 });
    }),
    // Get current user — called by AuthProvider after refresh
    http.get(`${API_BASE}/auth/me`, () => {
      return HttpResponse.json(
        {
          data: {
            user: {
              id: "storybook-user",
              email: "user@example.com",
              displayName: "Storybook User",
            },
          },
        },
        { status: 200 },
      );
    }),
  ],
  progression: {
    phaseGate: (phase?: 1 | 2 | 3 | 4) =>
      http.get(`${API_BASE}/progression/phase-gate`, () => {
        // return empty await to simulate loading state
        if (phase === undefined) return new Promise(() => {});
        const key = `phase${phase}` as keyof typeof PHASE_GATE_BODIES;
        return HttpResponse.json(PHASE_GATE_BODIES[key], { status: 200 });
      }),
    phaseGateError: () =>
      http.get(`${API_BASE}/progression/phase-gate`, () =>
        HttpResponse.json({ error: "Failed to load phase gate" }, { status: 500 }),
      ),
    radicalProgress: {
      default: () =>
        http.get(`${API_BASE}/progression/radical-progress`, () =>
          HttpResponse.json(RADICAL_PROGRESS_BODIES.all, { status: 200 }),
        ),
      loading: () =>
        http.get(`${API_BASE}/progression/radical-progress`, () => new Promise(() => {})),
      empty: () =>
        http.get(`${API_BASE}/progression/radical-progress`, () =>
          HttpResponse.json([], { status: 200 }),
        ),
      error: () =>
        http.get(`${API_BASE}/progression/radical-progress`, () =>
          HttpResponse.json({ error: "Failed to load radical progress" }, { status: 500 }),
        ),
    },
  },
};
