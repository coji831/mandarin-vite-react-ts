const fs = require("fs");
const path = require("path");

// --- Helpers ---

function loadConfig() {
  try {
    return JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../solar.config.json"), "utf8"),
    );
  } catch (e) {
    process.exit(0); // missing or invalid config - fail open
  }
}

function readLedger() {
  const p = path.resolve(__dirname, "../.ai_ledger.md");
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}

function getSessionType(ledger) {
  const m = ledger.match(/Session-Type:\s*(\w[\w-]*)/i);
  return m ? m[1].toLowerCase() : "chat";
}

// S6 Phase 2, OD-6 Option B: loop-mode only
function isWatchModeTriggered(config, sessionType, toolName) {
  if (!config.solar?.active) return false;
  if (config.hooks?.preToolUse?.watchModeEnabled !== true) return false;
  if (sessionType !== "loop") return false;
  const patterns = config.hooks.preToolUse.watchModeToolPatterns;
  if (!Array.isArray(patterns) || patterns.length === 0) return false;
  return patterns.some((p) => toolName.includes(p.toLowerCase()));
}

// Design/Architect agents open pipelines; Bug Investigation diagnoses before
// implementation; Solar Bootstrap operates outside governance.
function isBypassAgent(targetAgent) {
  const BYPASS_PATTERNS = [
    "design",
    "architect",
    "bug investigation",
    "solar bootstrap",
    "solar scan",
  ];
  return BYPASS_PATTERNS.some((p) => targetAgent.toLowerCase().includes(p));
}

// Stage 1 is complete when an explicit PASS marker, stage 2+, or CLOSED is present.
function isStage1Complete(ledger) {
  return (
    /Stage\s*1.*PASS/i.test(ledger) ||
    /Pipeline Stage:\s*[2-9]/i.test(ledger) ||
    /Pipeline Stage:\s*CLOSED/i.test(ledger)
  );
}

// --- Main handler ---

let data = "";
process.stdin.on("data", (chunk) => (data += chunk));
process.stdin.on("end", () => {
  try {
    const input = JSON.parse(data || "{}");
    const toolName = (
      input.toolName ||
      input.tool ||
      input.name ||
      ""
    ).toLowerCase();

    // Read config and ledger once; both gates share these values
    const config = loadConfig();
    const ledger = readLedger();
    // Derive session type here so Watch Mode and delegation gate use the same value
    const sessionType = getSessionType(ledger);

    // Ask for confirmation before any high-risk tool call executes in loop mode
    if (isWatchModeTriggered(config, sessionType, toolName)) {
      console.log(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "ask",
            permissionDecisionReason:
              "High-risk operation in loop mode requires user confirmation",
          },
        }),
      );
      return;
    }

    // Delegation gate applies to agent calls only; all other tools pass through
    if (toolName !== "agent") {
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    // Global kill switches — fail open (exit 0) so tool call is not blocked
    if (
      !config.solar?.active ||
      !config.hooks?.enabled ||
      config.hooks?.preToolUse?.enabled === false
    ) {
      process.exit(0);
    }

    const agentArgs = input.input || input.arguments || input.params || {};
    const targetAgent =
      agentArgs.agentName || agentArgs.agent || agentArgs.name || "";

    // Design/architect/bootstrap agents are always allowed to start without a prior stage
    if (isBypassAgent(targetAgent)) {
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    // Bootstrap mode bypass - governance disabled during setup
    if ((config.sessionTypes?.[sessionType] || "simple") === "bootstrap") {
      process.exit(0);
    }

    // Allow delegation once Stage 1 (Design Planning Architect) has signed off
    if (isStage1Complete(ledger)) {
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    // Stage 1 not found — block and redirect to Design Planning Architect
    const targetLabel = targetAgent ? `to ${targetAgent}` : "to implementation";
    console.log(
      JSON.stringify({
        decision: "block",
        message:
          `Stage 1 (Design Planning Architect) has not been completed for this pipeline. ` +
          `Delegate to Design Planning Architect before proceeding ${targetLabel}.`,
      }),
    );
  } catch (e) {
    // Parse error - fail open
    process.exit(0);
  }
});
