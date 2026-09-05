# SOLAR v5 Agent Chain — self-chaining contract

> Loaded by every agent so chain runs work regardless of who is the entry.
> Trigger: your brief is a **SOLAR handoff with a `## Chain mode` section**
> (named chain run). If there is no `## Chain mode` section, this file does not
> apply — do your normal single-step job and return.

## The idea

In a chain run the **agents carry the flow themselves**. You are one link. You
do your own step, then **run the next specialist yourself** via the agent tool;
results never return to Governor v5 / the Orchestrator between links. Only the
**last** specialist returns the final result, and it bubbles back up to the
caller (Governor v5) unchanged.

## The chain (`epic`, default)

```
investigator -> architect -> uiux-designer -> (frontend-engineer + backend-engineer) -> docs-writer -> code-reviewer
```

- `A -> B` = after A finishes, A runs B.
- `(X + Y)` = a **parallel group**: whoever reaches it runs **both** members
  (same shared brief), then continues. The group's parent is
  `uiux-designer`: it runs Frontend Engineer AND Backend Engineer, merges both
  results, then runs Docs Writer.
- The chain is data in `.solar/registry.json` -> `chains` (read it if your
  handoff doesn't spell it out).

## Rules (non-negotiable)

1. **Do your own step first.** Follow your own agent definition and constraints.
2. **Then delegate onward.** Call the exact next agent (name from the mapping
   below) with a brief that carries: (a) the ORIGINAL epic objective, (b) the
   upstream context you received (their outputs / file paths), (c) your own
   deliverable, and (d) this instruction — "you are next in the chain; do your
   step then delegate onward; only the last returns the final result."
3. **Parallel group:** run each member with the SAME shared brief; collect both
   results. If you cannot run them in parallel, run them one after another.
4. **Last link returns the final.** When you are `code-reviewer` (next =
   complete), your output **is** the final result.
5. **Bubble the final up.** Whatever a downstream link returns is what you
   return to YOUR caller. You may prepend a 1-2 line note on your own
   deliverable, but never truncate or replace the downstream final.
6. **Never loop.** Each role runs once per chain. If rework is needed, note it
   in the returned result — do not re-run an upstream role yourself.
7. **Carry context.** Pass file paths + links, not just prose, so the next
   specialist can open exactly what you produced.
8. **Human-owned gates stop you, not the governor.** If your role owns a human
   gate (UIUX Designer: the User Preview Gate — never auto-merge design), you
   stop at that gate and return `STATUS: AWAITING <gate>` + your deliverable
   paths so the caller can get the human's decision before the chain continues.
   That pause is a designed gate, not a governor bounce.

## Delegation mapping (exact agent names for the agent tool)

| Role (registry key) | After your step, run |
| ------------------- | -------------------- |
| `investigator`      | **Architect** |
| `architect`         | **UIUX Designer** |
| `uiux-designer`     | **Frontend Engineer** + **Backend Engineer**, then **Docs Writer** |
| `frontend-engineer` | (none — return to your caller) |
| `backend-engineer`  | (none — return to your caller) |
| `docs-writer`       | **Code Reviewer** |
| `code-reviewer`     | (none — your output IS the final result) |

## What a good final result contains

- What each link produced (1 line each) + file paths
- The epic objective restated as DONE / NOT DONE with evidence
- Verification status: tests / audits run and their outcome
- Open items or decisions the human must make

If you are a leaf (frontend/backend engineer) returning to your caller
(uiux-designer), return your deliverable summary + paths so the caller can
merge and continue.
