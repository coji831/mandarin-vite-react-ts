# Agent Orchestration Patterns

This repository uses a simplified hub-and-spoke orchestration pattern for SOLAR-Ralph.

## Pattern

The Orchestration Governor acts as the hub. Frontend, backend, testing, security, review, and documentation specialists are the spokes.

## Why This Pattern

- It keeps planning and closure decisions centralized.
- It allows frontend and backend work to proceed independently when contracts are clear.
- It gives the review and security layers authority to challenge changes before closure.

## Practical Rule

If a task touches more than one domain, the governor decomposes it first instead of allowing a single specialist to improvise across the whole stack.
