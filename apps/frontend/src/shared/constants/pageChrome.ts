/**
 * pageChrome.ts — the mode/chrome half of the Focus-First design system.
 *
 * The spine design system already delivers the WIDTH consequence of a page's
 * archetype (PageShell -> PageStack -> PageGrid via --page-measure-*). This
 * module delivers the MODE/CHROME consequence: every route is either
 * **Browse** (rail expanded + standard top bar) or **Focus** (rail collapsed
 * icon rail + recessed top bar), with `auth` as the explicit neither case
 * (no rail). Mode is derived from the page's archetype — never ad hoc
 * (page-archetypes.md §0: the dual-mode chrome law).
 *
 * Single source of truth:
 *   - The archetype -> mode -> chrome derivation lives here.
 *   - The route -> archetype table lives here (route strings must match
 *     `.github/page-inventory.json` `route` values exactly — the
 *     `design-audit:foundation` chrome check parses this table for parity).
 */

export type PageMode = "browse" | "focus" | "auth";
export type RailState = "expanded" | "collapsed" | "none";
export type TopBarState = "standard" | "recessed" | "none";

export type ChromeState = {
  rail: RailState;
  topbar: TopBarState;
};

/** Archetypes whose mode is Focus (rail collapsed + recessed top bar). */
const FOCUS_ARCHETYPES: ReadonlySet<string> = new Set(["detail", "wizard"]);

/**
 * modeForArchetype — the archetype -> mode law (page-archetypes.md §0).
 *   detail | wizard  -> focus
 *   auth             -> auth (neither Browse nor Focus; no rail)
 *   everything else  -> browse
 */
export function modeForArchetype(archetype: string | null | undefined): PageMode {
  if (archetype === "auth") return "auth";
  if (archetype != null && FOCUS_ARCHETYPES.has(archetype)) return "focus";
  return "browse";
}

/**
 * chromeForMode — the mode -> chrome law.
 *   focus  -> rail collapsed (icon rail) + recessed top bar
 *   auth   -> rail none + standard top bar (AppLayout keeps the UserMenu
 *             reachable on auth pages — page-archetypes.md lists `top-bar: none`
 *             for the archetype, but the app deliberately keeps the top bar so
 *             auth pages are never a dead end; the chrome consequence here
 *             records what the app actually renders.)
 *   browse -> rail expanded + standard top bar
 */
export function chromeForMode(mode: PageMode): ChromeState {
  switch (mode) {
    case "focus":
      return { rail: "collapsed", topbar: "recessed" };
    case "auth":
      return { rail: "none", topbar: "standard" };
    case "browse":
      return { rail: "expanded", topbar: "standard" };
  }
}

type RouteArchetypeEntry = {
  /** Route path; exact entries match only `pathname === path`. */
  path: string;
  /** Exact-match flag (route equals `path`), vs prefix match. */
  exact?: boolean;
  /** Archetype the route declares (mirrors .github/page-inventory.json). */
  archetype: string;
};

/**
 * Route -> archetype table. Mirrors the ledger's conforms routes
 * (`.github/page-inventory.json`); paths are literals so the design-audit
 * chrome parity check can parse this table. Exact routes are matched first,
 * then the longest matching prefix.
 */
const ROUTE_ARCHETYPES: RouteArchetypeEntry[] = [
  { path: "/", exact: true, archetype: "overview" }, // DashboardPage
  { path: "/dashboard", exact: true, archetype: "overview" }, // dashboard alias
  { path: "/practices", exact: true, archetype: "overview" }, // PracticesPage
  // Review + Quiz are ONE route with two surfaces (rework-proposal §4/§7): the
  // picker/empty entry is Browse, and the SESSION (every session param present)
  // is Focus — see SESSION_QUERY_ROUTES below. The archetype here is therefore
  // the no-query one; the ledger records the same value.
  { path: "/practices/review", exact: true, archetype: "overview" }, // ReviewPage (picker)
  { path: "/practices/quiz", exact: true, archetype: "empty" }, // QuizPage (no ?type=)
  { path: "/library", archetype: "list" }, // LibraryPage
  { path: "/learn", archetype: "overview" }, // Learn subtree (radicals/grammar/… — all Browse)
  { path: "/learn/foundations", exact: true, archetype: "wizard" }, // FoundationsPage (Blueprint)
  { path: "/learn/foundations/reference", exact: true, archetype: "reports" }, // reference index
  { path: "/learn/readers/", archetype: "detail" }, // ReaderPage (a reading session is Focus)
  { path: "/progress", archetype: "settings" }, // ProgressPage
  { path: "/profile", archetype: "profile" }, // ProfilePage
  { path: "/settings", archetype: "settings" }, // SettingsPage
  { path: "/auth", archetype: "auth" }, // Login/Register (no rail)
];

/**
 * Routes whose mode depends on the QUERY, because one route hosts two surfaces
 * (rework-proposal §4 + §7): a picker/empty entry surface (Browse) and a live
 * session (Focus). A session is `detail`/Focus by the dual-mode chrome law, and
 * the learner has not started one until every required param is present.
 * `requiredParams.length === 0` would make every visit a session — never do it.
 */
type SessionQueryEntry = {
  path: string;
  /** Archetype while no session param is present (the entry surface). */
  entryArchetype: string;
  /** Archetype once EVERY `requiredParams` key is present (the session). */
  sessionArchetype: string;
  requiredParams: string[];
};

const SESSION_QUERY_ROUTES: SessionQueryEntry[] = [
  {
    path: "/practices/review",
    entryArchetype: "overview",
    sessionArchetype: "detail",
    // ReviewPage only auto-starts when BOTH are present.
    requiredParams: ["type", "filter"],
  },
  {
    path: "/practices/quiz",
    entryArchetype: "empty",
    sessionArchetype: "detail",
    requiredParams: ["type"],
  },
];

/** True when `search` carries every param in `requiredParams` (non-empty values). */
function hasSessionParams(search: string, requiredParams: string[]): boolean {
  if (requiredParams.length === 0) return false;
  const params = new URLSearchParams(search);
  return requiredParams.every((key) => {
    const value = params.get(key);
    return value !== null && value !== "";
  });
}

/** Resolve a route pathname (+ optional query) to its declared archetype. */
export function resolveArchetype(pathname: string, search = ""): string {
  // Query-dependent override FIRST for the two routes that host two surfaces:
  // the no-query reading is the table's declared archetype (the ledger records
  // that), and a complete session query promotes the route to its session
  // archetype. Evaluated before the table lookup so an EXACT table entry cannot
  // short-circuit it.
  const sessionRoute = SESSION_QUERY_ROUTES.find((r) => r.path === pathname);
  if (sessionRoute) {
    return hasSessionParams(search, sessionRoute.requiredParams)
      ? sessionRoute.sessionArchetype
      : sessionRoute.entryArchetype;
  }

  const exact = ROUTE_ARCHETYPES.find((r) => r.exact && pathname === r.path);
  if (exact) return exact.archetype;

  const prefix = ROUTE_ARCHETYPES.filter((r) => !r.exact)
    .sort((a, b) => b.path.length - a.path.length)
    .find((r) => pathname.startsWith(r.path));
  return prefix?.archetype ?? "overview";
}

/**
 * Resolve a route pathname to its mode (browse | focus | auth).
 * `search` is required for the two routes that host a session on a query
 * (`/practices/review`, `/practices/quiz`) — AppLayout passes `location.search`.
 */
export function resolvePageMode(pathname: string, search = ""): PageMode {
  return modeForArchetype(resolveArchetype(pathname, search));
}
