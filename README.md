# AI Workflow Automation Bot

A professional Node.js & Express backend for AI-powered coding assistance. This bot automates common developer workflows such as debugging, refactoring, and feature generation by leveraging large language models (currently Gemini) and structured prompt templates.

## 🚀 Features

- **`/debug`**: Analyzes code snippets and error messages to provide minimal, production-ready fixes.
- **`/generate-feature`**: Generates complete boilerplate and logic based on functional requirements.
- **`/refactor`**: Recommends and implements performance and readability improvements.
- **`/explain-code`**: Provides high-level and detailed logic explanations for complex modules.

## 🛠 Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **AI Integration**: Google Generative AI (Gemini SDK)
- **Utilities**: Axios, Dotenv, FS (File System for Prompt Templates)

## 📁 Project Structure

```text
/backend
  ├── /controllers    # Request handlers and input validation
  ├── /services       # AI SDK integration logic
  ├── /utils          # Shared helper functions
  ├── /config         # Environment configuration
  ├── server.js       # Entry point
  └── app.js          # Express initialization & middleware
/prompts              # Structured .md prompt templates for AI
```

## ⚙️ How to Run Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/benringia/workflow-automation-bot.git
   cd workflow-automation-bot/backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `/backend` directory:
   ```text
   PORT=3000
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

## 📝 Example API Usage (/debug)

**Endpoint**: `POST /debug`

**Request Body (JSON)**:
```json
{
  "code": "const x = ;",
  "tech_stack": "JavaScript",
  "file_paths": "index.js"
}
```

**Request Body (Raw Text)**:
```text
const x = ;
```

**Success Response**:
```json
{
  "success": true,
  "result": "1. Issue: Syntax error due to missing assignment.\n2. Fixed Code: const x = null;"
}
```

## 🔮 Future Improvements

- **Provider Switching**: Migration to Claude 3 (Anthropic) for enhanced reasoning.
- **Support for Multi-file Analysis**: Context-aware debugging across multiple project files.
- **CLI Tool**: A lightweight command-line interface to trigger workflows directly from the terminal.
- **Unit Testing**: Automated validation of AI-generated responses for consistency.

---
*Created by [Ben Ringia](https://github.com/benringia)*
