# Conversation Fixtures

This folder contains deterministic JSON fixtures for conversation and audio data used in Epic 8.

## Naming Convention

- Each fixture is named as `<wordId>-<generatorVersion>-<shortHash>.json` for conversation data.
- Audio fixtures use `audio-<wordId>-<generatorVersion>-<shortHash>.json`.

## Turn Constraint

- Each conversation fixture must have 3–5 turns.
- Each turn should be 1–2 short sentences suitable for language learning.

## Required Fields

- `generatorVersion` and `promptHash` are required for cache validation.
- Audio fixtures must include `timeline` metadata for UI highlighting.

## Usage

- Fixtures are used for UI development, testing, and CI validation.
- Use validation utilities to ensure schema compliance.
