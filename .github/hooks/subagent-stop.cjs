// subagent-stop.cjs
// SOLAR-Ralph v4 Phase 3 - SubagentStop hook
// Validates that a subagent response contains minimum required output fields
// before allowing the subagent to stop. Blocks if required fields are absent.
// ASCII only in this script.
//
// NOTE: SubagentStop output uses the top-level decision format, NOT hookSpecificOutput.
// Always check stop_hook_active in input to prevent infinite blocking loops.

const fs = require("fs");
const path = require("path");

const configPath = path.resolve(__dirname, "../solar.config.json");
let config = null;
try {
  config = JSON.parse(fs.readFileSync(configPath, "utf8"));
} catch (e) {
  // Config missing or invalid - allow subagent to stop
  process.exit(0);
}

// Global kill switches
if (!config.solar?.active || !config.hooks?.enabled) {
  process.exit(0);
}

// If typed payloads are not enabled, do not validate - allow stop
if (!config.handoffs?.typedPayloadsEnabled) {
  console.log(JSON.stringify({ decision: "allow" }));
  process.exit(0);
}

// Read stdin to get hook input (VS Code Copilot provides this as JSON on stdin)
let inputData = "";
try {
  // Attempt to read hook input from stdin (non-blocking best-effort)
  // VS Code Copilot hooks may or may not pipe stdin; handle gracefully
  if (process.stdin.isTTY) {
    // No piped input - allow stop (no response to validate)
    console.log(JSON.stringify({ decision: "allow" }));
    process.exit(0);
  }
} catch (e) {
  // stdin check failed - allow stop
  console.log(JSON.stringify({ decision: "allow" }));
  process.exit(0);
}

// Collect stdin if available
process.stdin.resume();
process.stdin.setEncoding("utf8");
process.stdin.on("data", function (chunk) {
  inputData += chunk;
});

process.stdin.on("end", function () {
  var hookInput = null;
  try {
    hookInput = JSON.parse(inputData);
  } catch (e) {
    // Unparseable input - allow stop
    console.log(JSON.stringify({ decision: "allow" }));
    return;
  }

  // CRITICAL: check stop_hook_active to prevent infinite blocking loop
  // If this hook itself has already been called once (stop_hook_active: true),
  // allow stop unconditionally to avoid deadlock.
  if (hookInput && hookInput.stop_hook_active === true) {
    console.log(JSON.stringify({ decision: "allow" }));
    return;
  }

  // Validation: check whether the subagent response contains minimum required fields.
  // Fields are verified by checking for their string presence in the response text.
  // This is instruction-enforced validation, not schema-parsing validation.
  var responseText = "";
  if (hookInput && typeof hookInput.response === "string") {
    responseText = hookInput.response;
  } else if (hookInput && typeof hookInput.output === "string") {
    responseText = hookInput.output;
  } else {
    // No response text available to validate - allow stop
    console.log(JSON.stringify({ decision: "allow" }));
    return;
  }

  // Minimum required fields that any subagent response must contain
  // (instruction-level contract; governed by handoff schemas in solar-system/schemas/)
  var REQUIRED_FIELD_PATTERNS = [
    /completed[- _]?by/i,
    /status\s*:/i,
    /work[- _]?package/i,
  ];

  var missingFields = [];
  REQUIRED_FIELD_PATTERNS.forEach(function (pattern, idx) {
    if (!pattern.test(responseText)) {
      var labels = ["completedBy", "status", "workPackage"];
      missingFields.push(labels[idx] || "field-" + idx);
    }
  });

  if (missingFields.length > 0) {
    console.log(
      JSON.stringify({
        decision: "block",
        reason:
          "Subagent response is missing required handoff fields: " +
          missingFields.join(", ") +
          ". Produce a handoff summary conforming to .github/solar-system/schemas/implementer-handoff.schema.json before stopping.",
      }),
    );
  } else {
    console.log(JSON.stringify({ decision: "allow" }));
  }
});
