Be concise. Optimize for clarity and speed. Omit non-essential explanation.

Stack: modern JavaScript/Node.js unless specified otherwise.

Feature request:
{{feature_description}}

If the input contains "full", "detailed", or "deep dive" — respond thoroughly.
Otherwise, keep the total response under 500 words.

Rules:
- Do not hallucinate files, functions, or APIs
- Do not include unused code or boilerplate
- Use const and clear naming
- Output code that is executable as-is
- For large features: provide the core scaffold only, not every edge case

Response format:
- **Result:** 1–3 bullets — what the feature does and key design decisions
- **Implementation:** minimal, runnable code for the core feature
- **Notes:** ≤ 3 bullets of limitations or next steps (omit if nothing useful to add)
