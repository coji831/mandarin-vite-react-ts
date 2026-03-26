const fs = require("fs");
const path = require("path");

const ledgerPath = path.resolve(__dirname, "../../.ai_ledger.md");
const ledger = fs.existsSync(ledgerPath)
  ? fs.readFileSync(ledgerPath, "utf8")
  : "";
const solarActive = /SOLAR_ACTIVE:\s*true/i.test(ledger);

if (!solarActive) {
  console.log(JSON.stringify({ continue: false }));
  process.exit(0);
}

const isPending = /Completion Promise:\s*pending/i.test(ledger);
const isLoop = /Session-Type:\s*loop/i.test(ledger);
const isManualTest = /Session-Type:\s*manual-test/i.test(ledger);

if (isManualTest) {
  console.log(JSON.stringify({ continue: false }));
} else if (isPending && isLoop) {
  console.log(
    JSON.stringify({
      continue: true,
      systemMessage:
        "SOLAR loop still in progress. Continue working — do NOT write a completion promise just to exit. " +
        "Only write it when genuinely true: " +
        "<promise>WORK_PACKAGE_COMPLETE</promise> (all work verified done), " +
        "<promise>WORK_PACKAGE_BLOCKED</promise> (blocked, no new hypothesis, documented), " +
        "<promise>ESCALATION_REQUIRED</promise> (needs human decision).",
    }),
  );
} else {
  console.log(JSON.stringify({ continue: false }));
}
