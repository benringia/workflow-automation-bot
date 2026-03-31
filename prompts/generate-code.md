## Objective
Generate a working, minimal, executable implementation for the feature described below.

## Context
Description: {{description}}
Language: {{language}}
Additional context: {{context}}

## Tasks
- Implement the core feature only — no boilerplate, no unused code
- Use clear naming and const by default
- Output must be immediately runnable without modification

## Constraints
{{rules}}

## Edge Cases
- If description is ambiguous, implement the most reasonable interpretation
- If language is unspecified, use modern JavaScript/Node.js
- If context is absent, infer from the description alone

## Acceptance Criteria
- Code compiles/runs without errors
- Core feature behavior matches description
- No placeholder functions or TODO comments

## Execution Strategy
Return exactly:
- **What it does:** 1–3 bullets
- **Implementation:** minimal runnable code
- **Notes:** ≤ 3 bullets of limitations or next steps (omit if none)
