/**
 * paths.ts — Route path constants
 *
 * Central source of truth for all route paths in the application.
 * Use these constants instead of hardcoded strings in route definitions and navigation.
 *
 * Story 17.7: Added phase-gated Learn tab routes and Practices routes.
 */

const root = "/";

const dashboard_page = root;
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

export {
  root,
  dashboard_page,
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
  learn_basic,
  auth_page,
  login_page,
  register_page,
};
