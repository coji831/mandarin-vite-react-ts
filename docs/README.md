# Project Documentation

## Navigation & Overview

### Main Reference Docs

- [architecture.md](architecture.md) – System architecture overview
- [templates/README.md](templates/README.md) – **Source of truth for all templates and formats**
- [knowledge-base/README.md](knowledge-base/README.md) – Quick-reference technical guides by category

### Workflow & Process Guides

- [guides/workflow.md](guides/workflow.md) – Human-friendly workflow checklist
- [guides/solar-ralph-rollout-plan.md](guides/solar-ralph-rollout-plan.md) – Track the phased SOLAR-Ralph rollout for this repository
- [guides/solar-ralph-workflow.md](guides/solar-ralph-workflow.md) – Map SOLAR-Ralph execution onto the repository workflow
- [guides/agent-operations-guide.md](guides/agent-operations-guide.md) – Operate the Orchestration Governor, specialists, skills, and loop rules
- [guides/memory-governance-guide.md](guides/memory-governance-guide.md) – Decide what belongs in the ledger, repo memory, or permanent docs
- [guides/branch-strategy.md](guides/branch-strategy.md) – Git branch strategy and conventions
- [guides/contribution-guide.md](guides/contribution-guide.md) – How to contribute to the project

### Documentation Guides

- [guides/documentation-architecture.md](guides/documentation-architecture.md) – How business and technical docs work together
- [guides/business-requirements-format.md](guides/business-requirements-format.md) – Business requirements format guide
- [guides/implementation-format.md](guides/implementation-format.md) – Implementation docs format guide
- [guides/doc-authoring-patterns.md](guides/doc-authoring-patterns.md) – Making documentation concise and effective

### Code & Development Guides

- [guides/conventions.md](guides/conventions.md) – Coding, naming, and documentation conventions
- [guides/solid-principles.md](guides/solid-principles.md) – Applying SOLID principles to React/TypeScript

### AI Assistance Guides

- [Copilot Instructions](../.github/copilot-instructions.md) – Primary AI operational playbook
  - Story-Level Development Workflow
  - Automation Protocol (trigger: "refer #file:automation")
  - Quality Gates & Cross-Doc Alignment
- [automation/structured-ai-prompts.md](automation/structured-ai-prompts.md) – Structured prompt catalog with examples
- [knowledge-base/agent-orchestration-patterns.md](knowledge-base/agent-orchestration-patterns.md) – Why the repository uses a hub-and-spoke agent model
- [knowledge-base/adversarial-auditing-patterns.md](knowledge-base/adversarial-auditing-patterns.md) – Why reviewer and security backpressure exist
- [knowledge-base/recursive-refinement-patterns.md](knowledge-base/recursive-refinement-patterns.md) – Why recursive remediation is bounded
- [knowledge-base/agent-memory-governance.md](knowledge-base/agent-memory-governance.md) – Why ledger, memory, and docs are separated

### Templates

- [Epic Business Requirements Template](templates/epic-business-requirements-template.md)
- [Story Business Requirements Template](templates/story-business-requirements-template.md)
- [Epic Implementation Template](templates/epic-implementation-template.md)
- [Story Implementation Template](templates/story-implementation-template.md)

## Project Management Documentation

- [business-requirements/README.md](business-requirements/) – Business requirements and planning documents
- [issue-implementation/README.md](issue-implementation/) – Technical implementation details for completed epics and stories

## Feature-Specific Documentation

- [src/features/<feature>/docs/](../src/features/) – Feature-specific design and API details

## Epic Structure

Epics are organized in their own directories within both business requirements and implementation folders:

```
business-requirements/
└── epic-<number>-<epic-name>/

issue-implementation/
└── epic-<number>-<epic-name>/
```

Each epic directory contains:

- README.md – Epic overview document
- Individual story documents named according to the pattern: `story-<epic-number>-<story-number>-<story-name>.md`

## Contribution Guide

To contribute to documentation:

- Use templates from [docs/templates](templates/)
- Follow commit conventions in [workflow.md](workflow.md)
- Update navigation guides and READMEs as needed
