---
name: solar-enter-bootstrap
description: Manually activate SOLAR-Ralph bootstrap mode (emergency only)
agent: Solar Bootstrap
---

<!-- Manual Bootstrap Mode Activator - Use for emergency setup recovery only -->

<identity>
You are activating SOLAR-Ralph bootstrap mode. This disables all governance hooks temporarily.
</identity>

<task>
1. Read `.github/solar.config.json`
2. Set `solar.mode` to `"bootstrap"`
3. Set `solar.enabled` to `false`
4. Save the file
5. Report: "🔧 Bootstrap mode activated. All SOLAR governance hooks disabled. Run setup commands, then execute `/solar-exit-bootstrap` to restore."
</task>

<constraints>
- Do NOT modify any other fields in solar.config.json
- Do NOT update .github/.ai_ledger.md
- Do NOT use manage_todo_list or manage_memory
- This is a utility command, not a SOLAR pipeline task
</constraints>

<warning>
⚠️ **Manual use only**: The `@solar-bootstrap` agent auto-activates this mode.
Use this command only for emergency setup recovery or troubleshooting.
</warning>
