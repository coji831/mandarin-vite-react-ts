/**
 * @file shared/constants/index.ts
 * @description Barrel exports for shared constants
 */

export { toneMap, toneMapKeys, TONE_BUTTONS_BASE } from "./toneMap";
export {
  root,
  profile_page,
  settings_page,
  dashboard_page,
  dashboard_route,
  learn_page,
  learn_foundations,
  learn_foundations_reference,
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
} from "./paths";
export { LEARN_NAV_ITEMS } from "./learnNav";
export type { LearnNavItem } from "./learnNav";
export { modeForArchetype, chromeForMode, resolveArchetype, resolvePageMode } from "./pageChrome";
export type { PageMode, RailState, TopBarState, ChromeState } from "./pageChrome";
export { SEARCH_PARAMS, withSearchParams, buildSearchParams } from "./searchParams";
export type { SearchParamName, SearchParamInput, BuildSearchParamsOptions } from "./searchParams";
