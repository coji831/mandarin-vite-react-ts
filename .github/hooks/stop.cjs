const fs = require("fs");
const path = require("path");

const configPath = path.resolve(__dirname, "../solar.config.json");
let config = null;
try {
  config = JSON.parse(fs.readFileSync(configPath, "utf8"));
} catch (e) {
  // Config missing or invalid - exit silently
  process.exit(0);
}

// Global kill switches
if (
  !config.solar?.active ||
  !config.hooks?.enabled ||
  !config.hooks?.stop?.enabled
) {
  process.exit(0);
}

// --- helpers ---

function readLedger() {
  const ledgerPath = path.resolve(__dirname, "../.ai_ledger.md");
  return fs.existsSync(ledgerPath) ? fs.readFileSync(ledgerPath, "utf8") : "";
}

function resolveSessionMode(cfg, ledger) {
  const match = ledger.match(/Session-Type:\s*(\w+)/i);
  const sessionType = match ? match[1].toLowerCase() : "chat";
  return cfg.sessionTypes?.[sessionType] || "simple";
}

function resolveSessionLogDir(cfg) {
  return cfg.logging.sessionLog.path
    ? path.resolve(__dirname, "../../", cfg.logging.sessionLog.path)
    : path.resolve(__dirname, "../solar-system/logs/");
}

function finalizeSessionLog(cfg) {
  try {
    if (!cfg.logging || !cfg.logging.sessionLog || cfg.logging.sessionLog.enabled === false) return;
    const logDir = resolveSessionLogDir(cfg);
    const currentSessionRef = path.join(logDir, ".current-session");
    if (!fs.existsSync(currentSessionRef)) return;
    const activeLogPath = fs.readFileSync(currentSessionRef, "utf8").trim();
    if (activeLogPath && fs.existsSync(activeLogPath)) {
      try {
        const logData = JSON.parse(fs.readFileSync(activeLogPath, "utf8"));
        logData.events.push({ t: new Date().toISOString(), tool: "SESSION_END", ok: true });
        fs.writeFileSync(activeLogPath, JSON.stringify(logData, null, 2), "utf8");
      } catch (e) { /* best-effort */ }
    }
    try { fs.unlinkSync(currentSessionRef); } catch (e) { /* best-effort */ }
  } catch (e) { /* session log teardown is best-effort; never block stop logic */ }
}

// --- main ---

const ledger = readLedger();
const currentMode = resolveSessionMode(config, ledger);

// Bootstrap mode bypass - governance disabled during setup
if (currentMode === "bootstrap") {
  process.exit(0);
}

// Check if this hook should be active for the current mode
const activeModes = config.hooks.stop.activeModes || [];
if (!activeModes.includes(currentMode)) {
  process.exit(0);
}

// Check if this mode enforces completion
const modeConfig = config.modes?.[currentMode] || {};
const shouldEnforce =
  modeConfig.enforceCompletion && config.hooks.stop.enforceLoopContinuation;

const isPending = /Completion Promise:\s*pending/i.test(ledger);
const isVerificationFailed = /Verification:\s*FAIL/i.test(ledger);

if (!shouldEnforce || (!isPending && !isVerificationFailed)) {
  console.log(JSON.stringify({ continue: false }));
  process.exit(0);
}

const reason = isVerificationFailed
  ? "Verification shows FAIL — run `npm test` and fix failures before writing a completion promise."
  : "Continue working — do NOT write a completion promise just to exit.";

const completionOptions =
  "<promise>WORK_PACKAGE_COMPLETE</promise> (all work verified done), " +
  "<promise>WORK_PACKAGE_BLOCKED</promise> (blocked, no new hypothesis, documented), " +
  "<promise>ESCALATION_REQUIRED</promise> (needs human decision).";

finalizeSessionLog(config); // Phase 5 S12: write SESSION_END and clear .current-session

console.log(
  JSON.stringify({
    continue: true,
    systemMessage: `SOLAR loop still in progress. ${reason} Only write it when genuinely true: ${completionOptions}`,
  }),
);
