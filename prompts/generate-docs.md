## Objective
Generate clear, complete documentation for the feature described below.

## Context
Description: {{description}}
Language: {{language}}
Additional context: {{context}}

## Tasks
- Write JSDoc comments for all exported functions/classes
- Include a usage example showing the feature in action
- Document all parameters, return values, and thrown errors

## Constraints
{{rules}}

## Edge Cases
- If description is ambiguous, document the most reasonable interpretation
- If language is unspecified, use JSDoc format for JavaScript
- If context is absent, infer from the description alone

## Acceptance Criteria
- All public API surface is documented
- Usage example is runnable
- Parameter types and return types are explicit

## Execution Strategy
Return exactly:
- **Overview:** 1–2 sentence description of what this does
- **JSDoc:** complete documentation block(s)
- **Usage example:** minimal runnable snippet
