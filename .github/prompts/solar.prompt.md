---
name: solar
description: "Trigger the SOLAR-Ralph Orchestration Governor. Pass a task and it selects the right pipeline (Knowledge / Simple Fix / Bug Fix / Feature), runs all stages, and closes with WORK_PACKAGE_COMPLETE."
model: "Claude Haiku 4.5 (copilot)"
---

[TASK]: ${input:task:Describe what you want done}

@Orchestration Governor
