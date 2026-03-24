# 🤖 AI Workflow Automation Builder (n8n-style)

A node-based AI workflow engine that lets you compose, reorder, and execute multi-step AI pipelines directly in the browser — no configuration required. Describe your task, and the system does the rest.

**Live Demo**: [workflow-automation-bot.vercel.app](https://workflow-automation-bot.vercel.app)

---

## 🧠 What It Does

You type a task description or paste code. The system detects your intent, selects the relevant AI steps, and runs them in sequence — each step powered by a dedicated Claude prompt.

No manual routing. No dropdowns. Just describe what you need.

---

## ⚙️ Core Features

- **Node-based pipeline** — enable, disable, and reorder steps visually before running
- **Auto intent detection** — keyword analysis maps your input to the right steps automatically
- **Four AI steps** — Generate, Analyze (debug), Refactor, Explain
- **Structured output rendering** — AI responses are parsed into sections with collapsible code blocks
- **Streaming-ready architecture** — SSE transport layer in place for token-by-token output
- **Step isolation** — a failing step does not halt the rest of the workflow
- **Live deployment** — frontend on Vercel, backend on Railway

---

## 🏗️ Tech Stack

**Frontend**
- Vanilla JavaScript — no framework, no bundler
- Dynamic step cards with status badges, reorder controls, and toggle switches
- Fetch API with SSE stream support

**Backend**
- Node.js + Express
- Claude API via Anthropic SDK (`claude-sonnet-4-6`, fallback: `claude-3-haiku`)
- Prompt templates as `.md` files with injected placeholders

**Deployment**
- Frontend: Vercel
- Backend: Railway
- Environment: `CLAUDE_API_KEY` stored in `backend/.env`

---

## 🧩 How It Works

1. User types a task or pastes code into the input field
2. `POST /workflow/run` receives the request with a node list and input
3. Each node maps to an AI step type (`ai.generate`, `ai.debug`, etc.)
4. The backend loads the matching prompt template, injects the input, and calls Claude
5. Results are returned per-node and rendered as structured output

### Intent detection (via `/route`)

| Keywords in input | Step triggered |
|---|---|
| `error`, `fix`, `bug`, `crash` | Analyze (debug) |
| `refactor`, `clean`, `optimize` | Refactor |
| `build`, `create`, `feature`, `implement` | Generate |
| `explain`, `what does`, `how does` | Explain |

When multiple keywords match, steps execute in priority order: **Generate → Analyze → Refactor → Explain**.

---

## 🔄 Example Workflow

**Input**: `build a rate limiter middleware and explain how it works`

**Detected steps**: Generate → Explain

**Output**:
- Generate: full rate limiter implementation with usage example
- Explain: plain-English walkthrough of the logic

---

## 📦 Project Structure

```
/backend
  /controllers    — one controller per endpoint + routeController (intent detection)
  /services       — claudeService.js (Claude API wrapper with model fallback)
  app.js          — Express app, CORS, body parsing
  server.js       — route registration, server start

/frontend
  index.html      — UI shell (dark theme, step cards, output panel)
  main.js         — workflow execution, step rendering, output formatting

/prompts
  debug.md
  refactor.md
  generate-feature.md
  explain-code.md
```

---

## 🚀 Running Locally

1. **Clone the repo**
   ```bash
   git clone https://github.com/benringia/workflow-automation-bot.git
   cd workflow-automation-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   Create `backend/.env`:
   ```
   PORT=5000
   CLAUDE_API_KEY=your_api_key_here
   ```

4. **Start the backend**
   ```bash
   node backend/server.js
   ```

5. **Open the frontend**
   Open `frontend/index.html` in a browser, or serve it statically.

> The backend must be running on `localhost:5000` for local use. Update `API_BASE` in `frontend/main.js` if your port differs.

---

## 💡 Why I Built This

I wanted to understand how tools like n8n work under the hood — composable steps, visual pipelines, node-based execution. Rather than wrapping an existing tool, I built the core engine from scratch: intent detection, prompt-driven AI steps, step isolation, and a live UI that reflects each step's state in real time.

It also served as a practical exercise in prompt engineering — each step is driven entirely by a `.md` template, with no hardcoded AI behavior in the controller logic.

---

## ⚠️ Notes

- All AI behavior is controlled by prompt templates in `/prompts/` — edit them to change how each step responds
- The `/route` endpoint is the smart entry point; individual endpoints (`/debug`, `/refactor`, etc.) are also available directly
- Model fallback: if `claude-sonnet-4-6` is unavailable, the service automatically retries with `claude-3-haiku-20240307`

---

## 🔮 Future Improvements

- **Streaming output** — render Claude's response token-by-token as it arrives
- **Step chaining** — pass the output of one step as context into the next
- **Workflow save/load** — persist named pipelines for reuse
- **Multi-file context** — attach multiple files as input context for AI steps
- **GitHub integration** — analyze PRs or diffs directly from a repo URL

---

## 👤 Author

Created by [Ben Ringia](https://github.com/benringia)
