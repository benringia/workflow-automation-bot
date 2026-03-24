# AI Workflow Automation Bot — System Reference

## System Purpose

An AI-powered workflow automation system that interprets user intent and executes structured multi-step workflows using Claude. The user describes a task or pastes code; the system auto-detects what needs to be done and runs the appropriate AI-powered steps sequentially.

**Stack:** Node.js + Express (backend) · Vanilla JS (frontend) · Claude API (AI layer)

---

## Architecture

```
Frontend (frontend/)
  └── Sends POST /route with { input }
        ↓
Backend (backend/)
  └── routeController — detects intent, selects steps
        ↓
  └── Per step: loads prompt template → injects input → calls claudeService
        ↓
  └── claudeService — calls Claude API (primary: claude-sonnet-4-6, fallback: claude-3-haiku-20240307)
        ↓
  └── Returns { success, intent, detectedSteps, steps: [{ step, result }] }
        ↓
Frontend — renders step cards and per-step output dynamically
```

### Key directories

```
/backend
  /controllers    — one controller per endpoint + routeController
  /services       — claudeService.js (Claude API wrapper with fallback)
  /utils          — (reserved)
  /config         — (reserved)
  app.js          — Express app + CORS + body parsing middleware
  server.js       — route registration + server start

/frontend
  index.html      — UI shell (dark theme, step cards, output panel)
  main.js         — workflow execution logic (calls /route, renders results)

/prompts
  debug.md
  refactor.md
  generate-feature.md
  explain-code.md
```

---

## Endpoints

All endpoints accept `POST` with `Content-Type: application/json`.

| Endpoint | Input body | Purpose |
|----------|-----------|---------|
| `POST /route` | `{ input: string }` | Auto-detect intent and run selected steps |
| `POST /debug` | `{ code: string }` | Analyze and fix code or describe a problem |
| `POST /refactor` | `{ code: string }` | Improve code structure and readability |
| `POST /generate-feature` | `{ feature: string }` | Design and implement a new feature |
| `POST /explain-code` | `{ code: string }` | Explain code or a technical concept |
| `GET /ping` | — | Health check — returns `pong` |

### `/route` response shape
```json
{
  "success": true,
  "intent": "Build a feature and understand it",
  "detectedSteps": ["generate-feature", "explain-code"],
  "steps": [
    { "step": "generate-feature", "result": "..." },
    { "step": "explain-code",     "result": "..." }
  ]
}
```

### Individual endpoint response shape
```json
{ "success": true, "result": "..." }
```

On error:
```json
{ "success": false, "error": "message", "details": null }
```

---

## Auto-Routing Logic (`routeController.js`)

### Intent detection — keyword rules

| Keywords | Step selected |
|----------|--------------|
| `error`, `fix`, `bug`, `issue`, `broken`, `crash`, `fail`, `undefined`, `null` | `debug` |
| `refactor`, `clean`, `improve`, `optimize`, `simplify`, `restructure` | `refactor` |
| `build`, `create`, `add`, `feature`, `implement`, `make`, `generate`, `design` | `generate-feature` |
| `explain`, `what does`, `how does`, `understand`, `describe`, `walk me through` | `explain-code` |

### Priority execution order

When multiple steps are detected, they always execute in this order regardless of keyword match order:

```
generate-feature → debug → refactor → explain-code
```

### Fallback logic (no keywords matched)

```
Input contains code-like patterns (const/let/var/function/=>/{}...)  →  debug
Otherwise (natural language)                                          →  generate-feature
```

### Intent description

The response includes a human-readable `intent` field:
- `"Build a feature and understand it"` — generate-feature + explain-code
- `"Build a feature and fix issues"` — generate-feature + debug
- `"Build or design a new feature"` — generate-feature only
- `"Debug or fix an issue"` — debug only
- `"Improve or clean up code"` — refactor only
- `"Explain code or a concept"` — explain-code only

---

## Prompt Standards

### Prompt files location
All prompt templates live in `/prompts/` at the project root (not inside `/backend`).

### Injected placeholders (do not remove)

| Prompt file | Placeholder |
|-------------|-------------|
| `debug.md` | `{{code_snippet_or_error}}` |
| `refactor.md` | `{{code_snippet}}` |
| `generate-feature.md` | `{{feature_description}}` |
| `explain-code.md` | `{{code_snippet}}` |

### Prompt behavior rules

- Accept both code and natural language — never reject input
- Never say "no code provided" — always interpret intent
- Assume modern JavaScript/Node.js stack unless input specifies otherwise
- No `{{tech_stack}}` or `{{file_paths}}` placeholders — these must not appear in prompts (they will leak through as raw text)

### Required response structure (all prompts)
```
1. Understanding — what the input is asking
2. Solution — fix, explanation, or implementation
3. Code — working code (only if relevant)
```

---

## Error Handling

- **Step-level isolation** — each step in `/route` is wrapped in its own try/catch; a failure in one step does not prevent remaining steps from running
- **Partial success** — `/route` always returns 200 with per-step `result` or `error` fields
- **Claude API fallback** — `claudeService` tries `claude-sonnet-4-6` first; if the model is not found, retries with `claude-3-haiku-20240307`
- **Missing API key** — throws immediately with a clear error message before any API call

---

## Frontend Behavior

- No manual endpoint selection — the user types their request and clicks **Run Workflow**
- Always calls `POST /route` with `{ input }`
- Shows `"Detecting intent..."` while the request is in-flight
- Builds step cards dynamically from `data.detectedSteps` — only detected steps appear
- Populates each step's output with a 300ms visual delay between steps
- Step cards animate through: `pending → running → done/error`
- Each output section auto-expands when its step completes
- Errors per step are shown inline — the workflow continues regardless

---

## Design Principles

- **Modular controllers** — one controller per endpoint, single responsibility
- **No nested HTTP calls** — `routeController` calls `sendPrompt` directly, not other HTTP endpoints
- **Prompt-driven logic** — AI behavior is controlled by prompt templates, not controller code
- **Separation of concerns** — prompt loading, Claude calls, and response formatting are distinct operations
- **Minimal dependencies** — express, axios, cors, dotenv only

---

## Environment

```
PORT=5000
CLAUDE_API_KEY=<your key>
```

`.env` lives at `backend/.env`. Server must be started from the project root:

```bash
node backend/server.js
```

dotenv is configured with `{ path: './backend/.env' }` to support this.

---

## Future Extensions

- **Context-aware routing** — pass previous step results as context into subsequent steps
- **Pipeline memory** — retain conversation history across workflow runs
- **Step chaining with data passing** — output of one step feeds as input to the next
- **Workflow saving** — persist named workflows for reuse
- **External integrations** — GitHub PR analysis, database queries, file system access
- **Streaming responses** — stream Claude output token-by-token for faster perceived performance
