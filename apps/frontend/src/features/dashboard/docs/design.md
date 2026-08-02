# Dashboard Feature — Design Document

## Component Tree

```
DashboardGuest           — Guest user landing (sign-up CTA)
  └── DashboardWelcome   — Personalized welcome message

DashboardSections        — Authenticated user dashboard
  ├── Phase Gates        — Quiz phase status + progress
  └── Activity Feed      — Recent learning activity list
```

### DashboardSections Internals

```
DashboardSections
  ├── PhaseGateSection        — Phase gate progress cards
  │     └── PhaseGateCard     — Per-phase: name, status, score
  └── ActivityFeedSection     — Recent activity list
        └── ActivityItem      — Single activity row (type, label, timestamp)
```

## State Management

| Slice       | Store                     | Purpose                                        |
| ----------- | ------------------------- | ---------------------------------------------- |
| Phase gates | Zustand (`usePhaseGates`) | Phase completion status, scores, unlock state  |
| Activity    | Zustand (`useActivity`)   | Recent activity items (type, label, timestamp) |
| Auth state  | Context (`useAuth`)       | Guest vs authenticated user                    |

All data is fetched on mount via service layer calls. No polling or real-time subscriptions.

## Design Tokens Used

| Token                                 | Usage                       |
| ------------------------------------- | --------------------------- |
| `--surface-dark`                      | Card backgrounds            |
| `--surface-dark-alt`                  | Page background             |
| `--surface-border`                    | Card borders, dividers      |
| `--surface-light-10`                  | Subtle hover backgrounds    |
| `--text-primary`                      | Primary content text        |
| `--text-secondary`                    | Secondary/meta text         |
| `--text-muted`                        | Subtle labels               |
| `--color-primary`                     | Interactive elements, links |
| `--color-primary-light`               | Accent highlights           |
| `--color-success`                     | Passed state indicators     |
| `--color-error`                       | Failed state indicators     |
| `--color-xp`                          | XP/Achievement badges       |
| `--font-sm`, `--font-md`, `--font-lg` | Typography scale            |
| `--space-xs` through `--space-lg`     | Spacing                     |
| `--radius-md`                         | Card border radius          |
| `--radius-lg`                         | Phase gate card radius      |
| `--shadow-sm`                         | Card shadows                |
| `--shadow-md`                         | Hover lift shadows          |
| `--transition-fast`                   | Interactive transitions     |

## Component States

### DashboardSections

| State       | Behavior                                                                         |
| ----------- | -------------------------------------------------------------------------------- |
| **Loading** | Skeleton cards rendered via `<Skeleton>` component — 3 skeleton phase gate cards |
| **Empty**   | "No phases available yet" message with illustration                              |
| **Error**   | `<ErrorScreen>` with retry button to re-fetch data                               |
| **Data**    | Phase gate cards with progress bars + activity feed list                         |

### ActivityFeedSection

| State       | Behavior                                                |
| ----------- | ------------------------------------------------------- |
| **Loading** | 3 skeleton rows with shimmer animation                  |
| **Empty**   | "No recent activity" empty state message                |
| **Error**   | Inline error message below phase gates, with retry link |
| **Data**    | Chronological list of activity items                    |

### PhaseGateSection

| State       | Behavior                         |
| ----------- | -------------------------------- |
| **Loading** | 3 skeleton cards                 |
| **Empty**   | (N/A — defaults shown)           |
| **Error**   | Inline error with retry          |
| **Data**    | Phase gate cards with score bars |

### DashboardWelcome / DashboardGuest

| State       | Behavior                                     |
| ----------- | -------------------------------------------- |
| **Loading** | Skeleton text block                          |
| **Error**   | Falls back to static welcome text            |
| **Data**    | Personalized greeting with user display name |

## Data Flow

```
Page Mount
  ├── Phase gate data   → GET /v1/progression/phase-gate (ROUTE_PATTERNS.progressionPhaseGate,
  │                       via shared/services/phaseGateService.ts) — legacy /api/phase-gates no longer exists
  ├── Recent Activity   → populated from DashboardSections props (activities[]) — legacy GET /api/activity
  │                       endpoint no longer exists
  └── useAuth.currentUser → Context (guest or logged-in)
       │
       ▼
  Determine: guest → DashboardGuest | user → DashboardSections
       │
       ▼
  Render loading skeletons → data arrives → re-render with data
```

## Accessibility

- All interactive cards have `role="button"` and `aria-label`
- Phase gate cards use `aria-describedby` for score descriptions
- Activity items use `aria-live="polite"` for new activity announcements
- Focus management: phase gate list uses `aria-flowto` for sequential navigation

## Responsive Behavior

| Breakpoint | Layout Change                       |
| ---------- | ----------------------------------- |
| > 768px    | 2-column grid for phase gates       |
| ≤ 768px    | Single column stack                 |
| ≤ 480px    | Reduced padding, smaller typography |

## File Structure

```
features/dashboard/
├── index.ts                     — Barrel exports
├── components/
│   ├── DashboardWelcome.tsx     — Welcome message + greeting
│   ├── DashboardGuest.tsx       — Guest landing with sign-up CTA
│   ├── DashboardSections.tsx    — Main authenticated dashboard
│   └── __tests__/               — Component tests
└── docs/
    └── design.md                — This document
```
