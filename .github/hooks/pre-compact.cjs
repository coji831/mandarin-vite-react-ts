// pre-compact.cjs
// SOLAR-Ralph PreCompact hook
// Fires before VS Code Copilot auto-compacts the context window.
// Reads active in-progress todos and current ledger pipeline stage,
// then writes a snapshot to /memories/session/pre-compact-state.md
// before truncation occurs.
//
// Output format: PreCompact uses COMMON output only.
// hookSpecificOutput is NOT used here -- VS Code ignores it on PreCompact events.
// Return { "continue": true } to allow compaction to proceed.

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

// ----------------------------------------------------------------
// Resolve workspace root: prefer VSCODE_WORKSPACE_ROOT, then cwd
// ----------------------------------------------------------------
const workspaceRoot = process.env.VSCODE_WORKSPACE_ROOT || process.cwd();

// ----------------------------------------------------------------
// Helper: safe file read (returns empty string if file missing)
// ----------------------------------------------------------------
function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (_) {
    return "";
  }
}

// ----------------------------------------------------------------
// Helper: extract a labelled field value from ledger text
// e.g. extractField("Pipeline Stage: 2 -- Implement", "Pipeline Stage")
//   => "2 -- Implement"
// ----------------------------------------------------------------
function extractField(text, label) {
  const regex = new RegExp("^" + label + ":\\s*(.+)$", "m");
  const match = text.match(regex);
  return match ? match[1].trim() : "(not found)";
}

// ----------------------------------------------------------------
// Helper: extract in-progress todos from manage_todo_list style
// blocks. Also handles simple "- [ ]" / "- [x]" markdown lists.
// Looks for any line containing "in-progress" or unchecked "- [ ]".
// ----------------------------------------------------------------
function extractInProgressTodos(ledger) {
  const lines = ledger.split("\n");
  const inProgress = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match todo-list entries that are in-progress or unchecked
    if (/in-progress/i.test(line) || /^\s*[-*]\s*\[ \]/.test(line)) {
      inProgress.push(line.trim());
    }
  }

  return inProgress.length > 0 ? inProgress.join("\n") : "(none found)";
}

// ----------------------------------------------------------------
// Main
// ----------------------------------------------------------------
(function main() {
  const ledgerPath = path.join(workspaceRoot, ".github", ".ai_ledger.md");
  const outputDir = path.join(os.homedir(), ".aitk", "memories", "session");
  const outputPath = path.join(outputDir, "pre-compact-state.md");

  // Read ledger
  const ledger = safeRead(ledgerPath);

  // Extract state
  const pipelineStage = extractField(ledger, "Pipeline Stage");
  const sessionType = extractField(ledger, "Session-Type");
  const pipeline = extractField(ledger, "Pipeline");
  const inProgress = extractInProgressTodos(ledger);

  // Format snapshot
  const now = new Date().toISOString().slice(0, 10);
  const snapshot = [
    "# Pre-Compact State Snapshot",
    "",
    "Date: " + now,
    "Trigger: auto-compaction",
    "",
    "## Ledger State",
    "Session-Type: " + sessionType,
    "Pipeline: " + pipeline,
    "Pipeline Stage: " + pipelineStage,
    "",
    "## In-Progress Todos",
    inProgress,
    "",
    "## Notes",
    "This file was written by pre-compact.cjs before VS Code truncated the context window.",
    "Read this file at loop restart to resume from the correct pipeline stage.",
  ].join("\n");

  // Write snapshot -- create directory if needed
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(outputPath, snapshot, "utf8");
  } catch (writeErr) {
    // Non-fatal: log to stderr but do not block compaction
    process.stderr.write(
      "[pre-compact.cjs] Failed to write snapshot: " + writeErr.message + "\n",
    );
  }

  // Return common output only -- allow compaction to proceed
  const output = {
    continue: true,
    systemMessage:
      "Pre-compact state saved to /memories/session/pre-compact-state.md (pipeline stage: " +
      pipelineStage +
      ")",
  };

  process.stdout.write(JSON.stringify(output));
})();
