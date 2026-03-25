const fs = require("fs");

const ledgerPath = ".ai_ledger.md";
const ledger = fs.existsSync(ledgerPath)
  ? fs.readFileSync(ledgerPath, "utf8")
  : "";
const solarActive = /SOLAR_ACTIVE:\s*true/i.test(ledger);

if (!solarActive) {
  console.log(JSON.stringify({ continue: true }));
} else {
  const hasPendingTask = /Completion Promise:\s*pending/i.test(ledger);

  if (hasPendingTask) {
    console.log(
      JSON.stringify({
        continue: true,
        systemMessage:
          "SOLAR task active. Follow the Mandatory Delegation Matrix in AGENTS.md. " +
          "Check .ai_ledger.md for current objective before acting. Do not skip required agents.",
      }),
    );
  } else {
    console.log(JSON.stringify({ continue: true }));
  }
}
