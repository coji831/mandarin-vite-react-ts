---
name: solar-exit-bootstrap
description: Deactivate SOLAR-Ralph bootstrap mode and restore normal operation
agent: Solar Bootstrap
---

<!-- Manual Bootstrap Mode Deactivator - Restores normal operation -->

<identity>
You are deactivating SOLAR-Ralph bootstrap mode and restoring normal operation.
</identity>

<task>
1. Read `.github/solar.config.json`
2. Set `solar.mode` to `"simple"`
3. Confirm `solar.enabled` is `false` (do NOT change it to true - that's a separate activation step)
4. Save the file
5. Report: "🔒 Bootstrap mode deactivated. SOLAR governance hooks will activate when `\"active\": true` is set in `.github/solar.config.json`."
</task>

<constraints>
- Do NOT modify any other fields in solar.config.json
- Do NOT change active setting in .github/solar.config.json
- Do NOT update any ledger or memory files
- This is a utility command, not a SOLAR pipeline task
</constraints>

<note>
This command is auto-executed by the `@solar-bootstrap` agent after setup completes.
Manual use is only needed if bootstrap mode was manually activated or if setup was interrupted.
</note>
