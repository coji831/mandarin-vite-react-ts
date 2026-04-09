// subagent-start.cjs
// SOLAR-Ralph v4 Phase 3 - SubagentStart hook
// Reads the Handoff Payload section from the ledger and injects it as
// additionalContext into the subagent's starting context at delegation time.
// ASCII only in this script.

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
if (!config.solar?.active || !config.hooks?.enabled) {
  process.exit(0);
}

// handoffs.typedPayloadsEnabled must be true to inject typed context
if (!config.handoffs?.typedPayloadsEnabled) {
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
}

const ledgerPath = path.resolve(__dirname, "../.ai_ledger.md");
let ledgerContent = "";
try {
  if (fs.existsSync(ledgerPath)) {
    ledgerContent = fs.readFileSync(ledgerPath, "utf8");
  }
} catch (e) {
  // Ledger unreadable - proceed without payload
}

// Extract the Handoff Payload section from the ledger
// Matches ## Handoff Payload through the next ## section or end of file
function extractHandoffPayload(content) {
  var sectionMatch = content.match(
    /##\s*Handoff Payload\s*\n([\s\S]*?)(?=\n##\s|$)/,
  );
  if (!sectionMatch) return null;
  var payload = sectionMatch[1].trim();
  if (!payload || payload === "(none)" || payload === "(empty)") return null;
  return payload;
}

var handoffPayload = extractHandoffPayload(ledgerContent);

var additionalContext = handoffPayload
  ? "HANDOFF PAYLOAD FROM GOVERNOR (read this before starting):\n\n" +
    handoffPayload +
    "\n\nReference schemas in .github/solar-system/schemas/ for the typed format."
  : "No handoff payload in ledger. Proceed with request context only.";

console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SubagentStart",
      additionalContext: additionalContext,
    },
  }),
);
