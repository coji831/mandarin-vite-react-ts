const root = "/";

const dashboard_page = root;
const learn_page = root + "learn";
const learn_basic = learn_page + "/basic";
const auth_page = root + "auth";
const login_page = auth_page + "/login";
const register_page = auth_page + "/register";

/** @deprecated Use learn_page instead */
export const mandarin_page = learn_page;
/** @deprecated Use learn_basic instead */
export const mandarin_basic = learn_basic;

export { root, dashboard_page, learn_page, learn_basic, auth_page, login_page, register_page };
