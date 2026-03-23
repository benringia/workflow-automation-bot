Objective:
Analyze the provided code, identify the root cause of the issue, and implement a correct, minimal fix.

Context:

* Tech stack: {{tech_stack}}
* File paths: {{file_paths}}
* Input: {{code_snippet_or_error}}

Tasks:

1. Analyze the code and identify the root cause of the issue
2. Explain the issue briefly (1–2 sentences max)
3. Implement a fix with minimal changes
4. Ensure the fix aligns with existing code patterns
5. Validate the fix against edge cases

Constraints:

* Do not rewrite the entire file unless necessary
* Preserve existing architecture and patterns
* Avoid unnecessary complexity
* Output production-ready code only

- Return output in this format:
  1. Issue (short explanation)
  2. Fixed Code

Edge Cases:

* Missing or undefined variables
* Async/await issues
* Null/empty inputs
* Incorrect imports or dependencies
* Environment/config mismatches

Acceptance Criteria:

* Bug is resolved
* Code runs without errors
* No regression introduced
* Output is clean and minimal

Execution Strategy:
Model: Claude Sonnet (Thinking)
Mode: Planning Mode
CLAUDE.md Update: No
Reason: Requires multi-step debugging and validation
