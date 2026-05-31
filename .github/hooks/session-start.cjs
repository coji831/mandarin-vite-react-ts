// session-start.cjs
// SOLAR-Ralph v4 - SessionStart hook
// Phase 1: Reads .learnings/LEARNINGS.md and injects a condensed summary into session context.
// Phase 5 S12: Creates a per-session activity log JSON file in solar-system/logs/.
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

// --- helpers ---

function resolveSessionLogDir(cfg) {
  return cfg.logging.sessionLog.path
    ? path.resolve(__dirname, "../../", cfg.logging.sessionLog.path)
    : path.resolve(__dirname, "../solar-system/logs/");
}

function rotateOldLogs(logDir, maxFiles) {
  try {
    var existing = fs
      .readdirSync(logDir)
      .filter(function (f) {
        return f.match(/^session-.*\.json$/);
      })
      .map(function (f) {
        return path.join(logDir, f);
      })
      .sort();
    while (existing.length >= maxFiles) {
      fs.unlinkSync(existing.shift());
    }
  } catch (e) {
    /* rotation is best-effort */
  }
}

function createSessionLog(cfg) {
  try {
    var logDir = resolveSessionLogDir(cfg);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    rotateOldLogs(logDir, cfg.logging.sessionLog.maxFiles || 20);
    var ts = new Date().toISOString().replace(/[:.]/g, "-");
    var logFilePath = path.join(logDir, "session-" + ts + ".json");
    fs.writeFileSync(
      logFilePath,
      JSON.stringify(
        { session: new Date().toISOString(), events: [] },
        null,
        2,
      ),
      "utf8",
    );
    fs.writeFileSync(
      path.join(logDir, ".current-session"),
      logFilePath,
      "utf8",
    );
  } catch (e) {
    /* session log creation is best-effort; never block hook */
  }
}

function resolveLearningsPath(cfg) {
  var dir =
    cfg.selfImprovement && cfg.selfImprovement.learningsPath
      ? path.resolve(__dirname, "../../", cfg.selfImprovement.learningsPath)
      : path.resolve(__dirname, "../solar-system/.learnings/");
  return path.join(dir, "LEARNINGS.md");
}

function extractLearningsSummary(learningsPath) {
  var content = fs.readFileSync(learningsPath, "utf8");
  var lines = content.split("\n").filter(function (l) {
    var t = l.trim();
    return (
      t && !t.startsWith("#") && !t.startsWith("<!--") && !t.startsWith("```")
    );
  });
  return lines.slice(0, 20).join(" ").trim();
}

// --- main ---

// Global kill switches - only blocks when SOLAR is fully inactive
if (!config.solar?.active || !config.hooks?.enabled) {
  process.exit(0);
}

// Phase 5 S12: Per-session activity log creation
if (
  config.logging &&
  config.logging.sessionLog &&
  config.logging.sessionLog.enabled !== false
) {
  createSessionLog(config);
}

// Skip learnings injection if disabled
if (!config.hooks?.sessionStart?.injectLearnings) {
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
}

var learningsSummary = "";
try {
  learningsSummary = extractLearningsSummary(resolveLearningsPath(config));
} catch (e) {
  // Learnings file missing or unreadable - no injection needed
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
}

if (!learningsSummary) {
  // File exists but has no extractable content yet - skip injection
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
}

console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: "SOLAR Learnings Summary: " + learningsSummary,
    },
  }),
);
