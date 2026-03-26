const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

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
    const isWriteOp = /edit|creat|appl|insert|delet|writ|replac/i.test(
      toolName,
    );

    if (!isWriteOp) {
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    const ledgerPath = path.resolve(__dirname, "../../.ai_ledger.md");
    const ledger = fs.existsSync(ledgerPath)
      ? fs.readFileSync(ledgerPath, "utf8")
      : "";
    const solarActive = /SOLAR_ACTIVE:\s*true/i.test(ledger);

    if (!solarActive) {
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    const inLoop = /Session-Type:\s*loop/i.test(ledger);

    if (inLoop) {
      let tscMessage = "";
      try {
        execSync("npx tsc --noEmit 2>&1", { timeout: 10000, encoding: "utf8" });
      } catch (e) {
        if (e.stdout) {
          const errors = (e.stdout.match(/error TS\d+[^\n]*/g) || []).slice(
            0,
            3,
          );
          if (errors.length) {
            tscMessage =
              "TypeScript errors: " +
              errors.join(" | ") +
              ". Fix before claiming progress in .ai_ledger.md.";
          }
        }
      }

      const message =
        tscMessage ||
        "Code modified in loop. Update .ai_ledger.md with step outcome and run narrowest verification.";
      console.log(JSON.stringify({ continue: true, systemMessage: message }));
    } else {
      console.log(JSON.stringify({ continue: true }));
    }
  } catch (e) {
    console.log(JSON.stringify({ continue: true }));
  }
});
