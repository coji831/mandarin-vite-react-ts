const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// --- helpers ---

function loadConfig() {
  try {
    return JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../solar.config.json"), "utf8"),
    );
  } catch (e) {
    return null;
  }
}

function resolveErrorsPath(cfg) {
  const base = cfg.selfImprovement?.learningsPath
    ? path.resolve(__dirname, "../../", cfg.selfImprovement.learningsPath)
    : path.resolve(__dirname, "../solar-system/.learnings/");
  return path.join(base, "ERRORS.md");
}

function isWriteOp(toolName) {
  return /edit|creat|appl|insert|delet|writ|replac/i.test(toolName);
}

function resolveSessionLogDir(cfg) {
  return cfg.logging.sessionLog.path
    ? path.resolve(__dirname, "../../", cfg.logging.sessionLog.path)
    : path.resolve(__dirname, "../solar-system/logs/");
}

function appendSessionEvent(input) {
  try {
    const cfg = loadConfig();
    if (
      !cfg ||
      !cfg.logging ||
      !cfg.logging.sessionLog ||
      cfg.logging.sessionLog.enabled === false
    )
      return;
    const logDir = resolveSessionLogDir(cfg);
    const currentSessionRef = path.join(logDir, ".current-session");
    if (!fs.existsSync(currentSessionRef)) return;
    const activeLogPath = fs.readFileSync(currentSessionRef, "utf8").trim();
    if (!activeLogPath || !fs.existsSync(activeLogPath)) return;
    const toolName = (
      input.toolName ||
      input.tool ||
      input.name ||
      "unknown"
    ).toLowerCase();
    const toolFailed = !!(input.error || input.isError === true);
    const filePath = input.filePath || input.path || "";
    const event = {
      t: new Date().toISOString(),
      tool: toolName,
      ok: !toolFailed,
    };
    if (filePath) event.file = filePath;
    if (toolFailed && input.error)
      event.note = String(input.error).slice(0, 200);
    try {
      const logData = JSON.parse(fs.readFileSync(activeLogPath, "utf8"));
      logData.events.push(event);
      fs.writeFileSync(activeLogPath, JSON.stringify(logData, null, 2), "utf8");
    } catch (e) {
      /* append is best-effort */
    }
  } catch (e) {
    /* session log is best-effort; never block main hook logic */
  }
}

function resolveSessionMode(config) {
  const ledger = fs.existsSync(path.resolve(__dirname, "../.ai_ledger.md"))
    ? fs.readFileSync(path.resolve(__dirname, "../.ai_ledger.md"), "utf8")
    : "";
  const match = ledger.match(/Session-Type:\s*(\w+)/i);
  const sessionType = match ? match[1].toLowerCase() : "chat";
  return config.sessionTypes?.[sessionType] || "simple";
}

function buildTscMessage(cfg, currentMode) {
  const modeConfig = cfg.modes?.[currentMode] || {};
  if (
    !modeConfig.typeCheckOnWrite ||
    !cfg.hooks.postToolUse.typeCheck?.enabled
  ) {
    return "";
  }
  try {
    const cmd = cfg.hooks.postToolUse.typeCheck.command || "npx tsc --noEmit";
    const timeout = cfg.hooks.postToolUse.typeCheck.timeout || 10000;
    execSync(cmd + " 2>&1", { timeout, encoding: "utf8" });
    return "";
  } catch (e) {
    const errors = ((e.stdout || "").match(/error TS\d+[^\n]*/g) || []).slice(
      0,
      3,
    );
    return errors.length
      ? "TypeScript errors: " +
          errors.join(" | ") +
          ". Fix before claiming progress in .ai_ledger.md."
      : "";
  }
}

// --- main ---

let data = "";
process.stdin.on("data", (chunk) => (data += chunk));
process.stdin.on("end", () => {
  // Outer catch-all: VS Code hook contract requires { continue: true } on any crash
  try {
    const input = JSON.parse(data || "{}");

    appendSessionEvent(input); // Phase 5 S12: best-effort session activity log

    const toolName = (
      input.toolName ||
      input.tool ||
      input.name ||
      ""
    ).toLowerCase();

    if (!isWriteOp(toolName)) {
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    const config = loadConfig();

    // Kill switches — null config or inactive hooks treated the same as silent exit
    if (
      !config ||
      !config.solar?.active ||
      !config.hooks?.enabled ||
      !config.hooks?.postToolUse?.enabled
    ) {
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    const currentMode = resolveSessionMode(config);

    if (currentMode === "bootstrap") {
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    const activeModes = config.hooks.postToolUse.activeModes || [];
    if (!activeModes.includes(currentMode)) {
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    // === Phase 1 addition: ERRORS.md write instruction on tool failure ===
    if (config.hooks.postToolUse.logErrorsToLearnings) {
      const toolFailed = !!input.error || input.isError === true;
      if (toolFailed) {
        console.log(
          JSON.stringify({
            continue: true,
            systemMessage:
              "Tool failure detected. Record the error, tool name, and root cause in " +
              resolveErrorsPath(config) +
              " before continuing.",
          }),
        );
        return;
      }
    }
    // === End Phase 1 addition ===

    const tscMessage = buildTscMessage(config, currentMode);

    if (tscMessage) {
      console.log(
        JSON.stringify({ continue: true, systemMessage: tscMessage }),
      );
    } else if (config.modes?.[currentMode]?.typeCheckOnWrite) {
      // tsc ran but found no errors — still remind agent to update ledger
      console.log(
        JSON.stringify({
          continue: true,
          systemMessage:
            "Code modified in loop. Update .ai_ledger.md with step outcome and run narrowest verification.",
        }),
      );
    } else {
      console.log(JSON.stringify({ continue: true }));
    }
  } catch (e) {
    console.log(JSON.stringify({ continue: true }));
  }
});
