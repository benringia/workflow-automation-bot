# AI Automation Bot — Project Instructions

## 🎯 PROJECT GOAL

Build a production-ready AI automation bot that:

* Integrates with Slack or Telegram
* Uses Claude for reasoning and code generation
* Executes structured workflows (debugging, generation, analysis)
* Demonstrates real-world AI agent capabilities

---

## 🧠 SYSTEM OVERVIEW

### Architecture

Interface (Slack/Telegram)
↓
Backend (Node.js / Python)
↓
AI Layer (Claude API)
↓
Tools (APIs, DB, Filesystem)

---

## ⚙️ CORE FEATURES

### Required Commands

* /debug → Analyze and fix code
* /generate-feature → Create new functionality
* /refactor → Improve code quality
* /explain-code → Explain logic clearly

---

## 🧩 PROJECT STRUCTURE

/backend
/controllers      # Command handlers
/services         # AI + external integrations
/prompts          # GSD prompt templates
/utils            # Helpers
/config           # Environment + settings

---

## 🧱 DEVELOPMENT RULES

### 1. Tech Stack Lock

* Ask for stack if not provided
* Once defined → DO NOT change
* No assumptions

---

### 2. Code Standards

* Production-ready only
* Follow modular architecture
* No unnecessary abstractions
* Use clear naming conventions

---

### 3. Prompt Engineering (CRITICAL)

All prompts must follow:

* Objective
* Context
* Tasks (phased)
* Constraints
* Edge Cases
* Acceptance Criteria
* Execution Strategy

---

### 4. GSD PRINCIPLE

All outputs must be:

* Direct
* Actionable
* Deterministic
* Ready-to-execute

NO:

* vague instructions
* filler text
* over-explanations

---

## 🔁 WORKFLOW EXECUTION MODEL

For every command:

1. Receive user input
2. Validate input
3. Select prompt template
4. Inject context
5. Send to Claude
6. Process response
7. Return formatted output

---

## ⚠️ EDGE CASE HANDLING

System must handle:

* Empty input
* Invalid commands
* API failures
* Timeout errors
* Missing files
* Incorrect file paths
* Partial responses

---

## 🔐 SAFETY RULES

* Never hallucinate files or APIs
* Always validate inputs before execution
* Fail gracefully with clear error messages
* Do not overwrite critical files without confirmation

---

## 🧠 AI INTEGRATION RULES

* Use structured prompts only
* Keep token usage minimal
* Avoid redundant context
* Ensure responses are executable

---

## 🚀 EXECUTION STRATEGY FORMAT

Every AI task must include:

Model: Claude (Sonnet / Opus depending on complexity)
Mode: Planning Mode | Fast Mode
CLAUDE.md Update: Yes | No
Reason: Short justification (accuracy vs speed vs cost)

---

## 📈 DEVELOPMENT PHASES

### Phase 1 — Foundation

* Setup backend
* Integrate chat platform
* Connect Claude API

---

### Phase 2 — Core Features

* Implement commands
* Add prompt system
* Basic workflows

---

### Phase 3 — Intelligence

* Multi-step workflows
* Context handling
* Error handling

---

### Phase 4 — Production

* Logging system
* Performance optimization
* Real integrations (GitHub/API)

---

## 🧪 TESTING REQUIREMENTS

Each feature must:

* Work independently
* Handle edge cases
* Return deterministic output
* Fail safely

---

## 📦 DEPLOYMENT (OPTIONAL)

* Use environment variables securely
* Prepare for cloud deployment (Vercel, Railway, etc.)
* Ensure API keys are protected

---

## 💼 PORTFOLIO REQUIREMENTS

Project must include:

* Clean README
* Architecture explanation
* Demo (video or GIF)
* Example commands
* Real use cases

---

## 🔥 SUCCESS CRITERIA

The project is complete when:

* Commands execute reliably
* AI outputs are accurate and structured
* System handles failures gracefully
* Codebase is clean and modular
* Project is demo-ready

---

## ⚡ FINAL RULE

Build for:
REAL USE > PERFECT CODE

This is not a demo chatbot.
This is an AI-powered automation system.
