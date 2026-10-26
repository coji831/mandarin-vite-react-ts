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
  { path: "/practices/review", archetype: "detail" }, // ReviewPage (Focus exemplar)
  { path: "/practices/quiz", archetype: "detail" }, // QuizPage (Focus exemplar)
  { path: "/library", archetype: "list" }, // LibraryPage
  // Lexical entity detail (character/word/radical/chengyu/grammar) — a learning
  // session is a routed Focus surface, not a modal (design-revalidation-guide §4).
  // Keep in sync with `learn_lexical_hub` in shared/constants/paths.ts.
  { path: "/learn/hub", archetype: "detail" }, // LexicalEntityPage
  { path: "/learn", archetype: "overview" }, // Learn subtree (foundations/radicals/… — all Browse)
  { path: "/progress", archetype: "settings" }, // ProgressPage
  { path: "/profile", archetype: "profile" }, // ProfilePage
  { path: "/settings", archetype: "settings" }, // SettingsPage
  { path: "/auth", archetype: "auth" }, // Login/Register (no rail)
];

/** Resolve a route pathname to its declared archetype (browse by default). */
export function resolveArchetype(pathname: string): string {
  const exact = ROUTE_ARCHETYPES.find((r) => r.exact && pathname === r.path);
  if (exact) return exact.archetype;

  const prefix = ROUTE_ARCHETYPES.filter((r) => !r.exact)
    .sort((a, b) => b.path.length - a.path.length)
    .find((r) => pathname.startsWith(r.path));
  return prefix?.archetype ?? "overview";
}

/** Resolve a route pathname to its mode (browse | focus | auth). */
export function resolvePageMode(pathname: string): PageMode {
  return modeForArchetype(resolveArchetype(pathname));
}
