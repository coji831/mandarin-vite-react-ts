/**
 * @file shared/hub-entry/index.ts
 * @description Barrel for the lexical hub's single entry point.
 *
 * The routed-era helpers (`hubPath.ts`, `HubRouteBridge.tsx`) are gone: the hub
 * is a standalone cross-page peek, so there is no `/learn/hub` path to build, no
 * route to read an entity out of, and no bridge to turn an intent into a
 * navigation. `openHub` writes the peek store directly (rework-proposal §0.5).
 */
export { openHub, closeHub, closeHubFromHistory } from "./hubEntryPoint";
