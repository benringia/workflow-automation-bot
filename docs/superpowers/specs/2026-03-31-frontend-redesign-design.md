# Frontend Redesign — Design Spec

**Date:** 2026-03-31  
**Status:** Approved  

---

## Problem

The current UI mixes two distinct mental models (node-based workflow builder and AI pipeline) in the same space without clear separation. Output is rendered as long, hard-to-scan text blobs. There is no tab system for pipeline results, no clear loading state, and the layout lacks visual hierarchy. The interface is not demo-friendly.

---

## Goals

- Cleanly separate Node Workflow mode and AI Pipeline mode so users never see both at once
- Add a tab-based output system (Code / Docs / Tests / Validation) for pipeline results
- Improve output readability with structured rendering, headings, and scrollable code blocks
- Add clear loading state, button feedback, and error display
- Make the interface feel like a real product, not a demo

---

## Approach

**Two files, restructured.** Rewrite `index.html` and `main.js` from scratch. No new files, no ES modules, no build step. CSS stays embedded in `<style>` in `index.html`. All existing API call logic (`/workflow/run`, `/workflow/generate`), SSE stream handling, and output formatting functions are preserved and reused.

---

## HTML Structure (`index.html`)

Single centered column, `max-width: 720px`, horizontally centered on the page.

```
<header>
  h1: "AI Workflow Builder"
  p.subtitle: short description

<main>
  .mode-toggle              — segmented control [Node Workflow | AI Pipeline]
  .input-card               — textarea + CTA button
  #node-section             — visible in node mode only
    .step-list              — ordered list of step cards
  #pipeline-section         — visible in pipeline mode only (hidden by default)
    .tab-bar                — pill tabs [Code | Docs | Tests | Validation]
    .tab-panels             — one panel per tab
  #output-section           — visible after a run (node mode output)
    .output-card            — per-step results
```

Mode visibility is controlled by a `data-mode="node|pipeline"` attribute on `<body>`. CSS uses `[data-mode="node"] #pipeline-section { display: none }` and vice versa. JavaScript never touches `display` directly.

---

## CSS Design System

All colors as CSS custom properties on `:root`:

```css
--bg-base:     #0f172a   /* page background */
--bg-card:     #1e293b   /* card surfaces */
--bg-sunken:   #0f172a   /* inputs, code blocks */
--border:      #334155
--accent:      #7c3aed   /* buttons, active states */
--accent-light:#a78bfa
--text-primary:#e2e8f0
--text-muted:  #64748b
--green:       #86efac
--red:         #f87171
```

---

## Component Specifications

### Mode Toggle
- Full-width two-button segmented control at top of `<main>`
- Active side: `background: var(--accent)`, white text
- Inactive: transparent background, `var(--text-muted)` text
- Switching mode: calls `setMode()`, clears output, hides/shows sections via `data-mode`

### Input Card
- `<textarea>` min-height 100px, no resize handle, placeholder: "Describe your task or paste code…"
- CTA button right-aligned below textarea
  - Node mode label: `▶ Run Workflow`
  - Pipeline mode label: `▶ Generate Outputs`
- During run: button disabled, `opacity: 0.6`, label becomes `⏳ Running…`
- On new run start: previous output cleared immediately

### Step List (Node mode only)
- Single-column list of step cards: Generate Feature / Debug / Refactor / Explain Code
- Order is single-column so ↑↓ move buttons map clearly to execution order
- Each card has:
  - Status badge: pending (gray) / running (amber + pulse) / done (green) / error (red)
  - Toggle checkbox to enable/disable the step
  - ↑↓ move buttons for reordering
  - `border-color: var(--accent)` when selected/active
- Clicking a step card selects it and shows its output in `#output-section`

### Tab Bar (Pipeline mode only)
- Full-width pill container, `background: var(--bg-sunken)`, border-radius
- Four equal-width pills: Code / Docs / Tests / Validation
- Active pill: `background: var(--accent)`, white text
- Inactive: transparent, `var(--text-muted)` text
- Default tab on pipeline run completion: Code
- Tab switching: instant, no animation, calls `setActiveTab(tab)`

### Tab Panels (Pipeline mode only)

**Code, Docs, Tests panels:**
- `<pre><code>` block with horizontal scroll
- Formatted via existing `formatOutput()` → `renderCodeBlocks()`
- Scrollable, `max-height: 500px`

**Validation panel:**
- Progress bar showing pass rate (e.g. "3 of 4 rules passed — 75%")
  - Bar fill: `background: linear-gradient(90deg, var(--accent), var(--accent-light))`
- Below bar: list of rules, each row has:
  - Colored circle icon: green checkmark (pass) or red X (fail)
  - Rule name in `var(--text-muted)`
- No table, no raw JSON

### Output Card (Node mode)
- Shown in `#output-section` when a step is selected
- Header row: step name + current status badge
- Body: scrollable, `max-height: 400px`
- Long outputs: truncated at 2000 chars with a "Show full output" toggle
- Error state: red-bordered card with message in `var(--red)`

### Loading & Error States
- `setLoading(true)`: disables button, changes label, clears output section
- `setLoading(false)`: re-enables button, restores label
- Network errors: shown as a red-bordered `.error-card` below the input, auto-dismissed on next run
- Step-level errors in node mode: shown inline in the step card

---

## JavaScript Structure (`main.js`)

Organized into clearly commented sections:

```
// --- CONFIG ---
// --- STATE ---
// --- DOM REFS ---
// --- MODE ---
// --- STEPS (Node mode) ---
// --- TABS (Pipeline mode) ---
// --- RUN ---
// --- RENDERING ---
// --- EVENTS ---
```

### State variables
```js
let mode = 'node'        // 'node' | 'pipeline'
let steps = [...]        // array of { id, label, enabled, status, result }
let activeTab = 'code'   // 'code' | 'docs' | 'tests' | 'validation'
let isRunning = false    // blocks double-submit
let selectedStep = null  // which step card is selected in node mode
```

### Functions

| Function | Purpose |
|---|---|
| `setMode(m)` | Switch mode, update `data-mode`, clear output |
| `renderSteps()` | Build step grid HTML |
| `toggleStep(id)` | Enable/disable a step |
| `moveStep(id, dir)` | Reorder steps |
| `setActiveTab(tab)` | Switch tab panel + update pill state |
| `runWorkflow()` | Entry point — routes to node or pipeline |
| `runNodeWorkflow()` | POST `/workflow/run`, SSE stream, per-step render |
| `runPipeline()` | POST `/workflow/generate` with hardcoded `rules` constant (preserved from existing code), render tabs |
| `renderNodeResults(results)` | Populate output card from node run |
| `renderPipelineResult(result)` | Route `outputs` to tab panels |
| `renderValidation(validation)` | Progress bar + icon list |
| `formatOutput(text)` | Existing markdown → HTML (reused unchanged) |
| `renderCodeBlocks(html)` | Existing code block renderer (reused unchanged) |
| `setLoading(bool)` | Button + output state |
| `readSSEStream(res, handlers)` | Existing SSE reader (reused unchanged) |
| `parseSSEEvent(raw, handlers)` | Existing SSE parser (reused unchanged) |
| `enqueueText(text)` | Existing typing animation (reused, node mode only) |

---

## Behavior by Mode

### Node Workflow mode
1. User types input, clicks `▶ Run Workflow`
2. `setLoading(true)` → clears output
3. POST `/workflow/run` with `{ nodes: enabledSteps, input }`
4. SSE stream updates each step card status in real time
5. On completion: first step auto-selected, output shown in `#output-section`
6. User clicks other step cards to view their output

### AI Pipeline mode
1. User types input, clicks `▶ Generate Outputs`
2. `setLoading(true)` → clears tab panels
3. POST `/workflow/generate` with `{ data: { description: input }, rules: [...] }`
4. On completion: populate all four tab panels, switch to Code tab, `setLoading(false)`
5. User clicks tab pills to navigate output sections

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| No output returned | Show "No output returned" placeholder in panel |
| Partial outputs (null tabs) | Show placeholder per empty tab: "Not generated" |
| Validation missing | Hide Validation tab or show "No validation rules defined" |
| Mode switch mid-session | Clear output, reset step statuses, cancel in-flight animation |
| Rapid multiple clicks | `isRunning` flag blocks re-entry; button disabled |
| Network error | Show `.error-card` below input, re-enable button |

---

## Preserved Backend Contracts

No backend changes. Existing endpoints and shapes unchanged:

```
POST /workflow/run      { nodes, input }        → { success, results }
POST /workflow/generate { data, rules }          → { success, outputs, validation }
```

---

## Verification

1. Start backend: `node backend/server.js`
2. Open `frontend/index.html` in browser (or via local server)
3. Node mode: type a task, run — confirm step cards animate through statuses, clicking cards shows output
4. Pipeline mode: toggle to AI Pipeline, type a task, run — confirm four tabs populate, validation shows progress bar
5. Toggle mode mid-run (if running) — confirm output clears cleanly
6. Rapid clicks — confirm only one run fires
7. Disconnect network — confirm error card appears with readable message
