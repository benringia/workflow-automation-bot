## Objective
Generate unit tests for the feature described below.

## Context
Description: {{description}}
Language: {{language}}
Additional context: {{context}}

## Tasks
- Cover the happy path
- Cover at least 2 edge cases (empty input, null, boundary values)
- Cover at least 1 failure/error mode
- Use a standard test framework appropriate for the language (Jest for JS/TS)

## Constraints
{{rules}}

## Edge Cases
- If description is ambiguous, test the most reasonable interpretation
- If language is unspecified, use Jest for JavaScript
- If context is absent, infer from the description alone

## Acceptance Criteria
- Tests are runnable without modification
- Each test has a clear description
- No mock leakage between tests

## Execution Strategy
Return exactly:
- **Test plan:** bullet list of what is being tested and why
- **Tests:** complete, runnable test file
