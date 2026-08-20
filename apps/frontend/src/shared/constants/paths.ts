/**
 * paths.ts — Route path constants
 *
 * Central source of truth for all route paths in the application.
 * Use these constants instead of hardcoded strings in route definitions and navigation.
 *
 * Story 17.7: Added phase-gated Learn tab routes and Practices routes.
 */

const root = "/";

// Account pages (Story 22.4) — thin placeholder routes reachable from the UserMenu.
const profile_page = root + "profile";
const settings_page = root + "settings";

const dashboard_page = root;
// VisFix W6b: explicit alias so /dashboard works as well as / (nav keeps using "/").
const dashboard_route = root + "dashboard";
const learn_page = root + "learn";
const learn_basic = learn_page + "/basic";
const auth_page = root + "auth";
const login_page = auth_page + "/login";
const register_page = auth_page + "/register";

// Phase-gated Learn tab routes (wireframe Section 1.3)
const learn_foundations = learn_page + "/foundations";
const learn_radicals = learn_page + "/radicals";
const learn_grammar = learn_page + "/grammar";
const learn_phonetic_clusters = learn_page + "/phonetic-clusters";
const learn_readers = learn_page + "/readers";
const learn_chengyu = learn_page + "/chengyu";

// Practice routes (wireframe Section 1.3)
const practices_page = "/practices";
const practices_review = "/practices/review";
const practices_quiz = "/practices/quiz";

// Progress page (quick-tile + nav target)
const progress_page = "/progress";

export {
  root,
  profile_page,
  settings_page,
  dashboard_page,
  dashboard_route,
  learn_page,
  learn_foundations,
  learn_radicals,
  learn_grammar,
  learn_phonetic_clusters,
  learn_readers,
  learn_chengyu,
  practices_page,
  practices_review,
  practices_quiz,
  progress_page,
  learn_basic,
  auth_page,
  login_page,
  register_page,
};
