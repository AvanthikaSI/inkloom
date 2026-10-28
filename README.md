# Inkloom AI — Enterprise Brand-Governance & Pre-Publication Compliance Platform

An intelligent, multi-modal brand governance platform designed for enterprises publishing content across decentralized employees, agencies, and generative AI tools. Inkloom AI reviews content before publication against approved brand guidelines, verified facts, and brand assets, transforming rejections into explainable, intent-preserving coaching.

---

## 🚀 Key Highlights & Architecture

```
+---------------------------------------------------------------------------------------------+
|                                    INKLOOM AI STACK                                         |
+---------------------------------------------------------------------------------------------+
| Frontend UI          | Next.js 14 (App Router), Tailwind CSS, Lucide Icons                  |
| Backend API Engine   | Node.js (TypeScript), Express Modular Route & Controller Pattern     |
| AI Orchestration     | LangChain + LangGraph StateGraph Multi-Agent Architecture            |
| Agentic Copilot      | LangGraph Stateful Orchestrator with 9 Registered LangChain Tools   |
| LLM Inference Engine | Groq AI Adapter (@langchain/groq) — Llama 3.3 70B                   |
| Vector Database      | ChromaDB (Vector embeddings & semantic retrieval)                    |
| Relational Database  | Supabase (PostgreSQL schema with atomic repository abstraction)      |
| Vision & Doc Engine  | Pure Python Zero-Installer Libraries (Pillow, pure W3C WCAG math)    |
+---------------------------------------------------------------------------------------------+
```

---

## 🤖 Agentic AI Copilot (LangGraph + LangChain + Groq)

The **AI Copilot & Chat** tab provides a fully interactive conversational interface powered by a **real stateful LangGraph workflow**:

```
User Message → /api/chat/message → LangGraph StateGraph →
  → Validate Request → Orchestrator Planner (Groq) →
    → Tool Selection (LangChain native tool calling) →
      → Real Tool Execution → Result Evaluation →
        → Response Synthesis (Groq) → Chat UI
```

### 9 Registered LangChain Tools

| # | Tool Name | Purpose |
|---|-----------|---------|
| 1 | `validate_content_input` | Word count, PII scan, input metrics |
| 2 | `query_brand_guidelines` | Semantic vector search of brand guidelines |
| 3 | `query_approved_facts` | Retrieves verified benchmarks & SLA facts |
| 4 | `check_brand_terminology` | Regex-backed banned word & trademark scan |
| 5 | `verify_promotional_claim` | Superlative & unverified claim detector |
| 6 | `check_wcag_contrast` | Real Python WCAG 2.1 luminance calculator |
| 7 | `run_brand_governance_audit` | Full multi-agent audit pipeline |
| 8 | `apply_surgical_patch` | Intent-preserving document patch editor |
| 9 | `get_guideline_ambiguity_metrics` | Guideline friction & override analytics |

### Specialized Agent Roles
- **Brand Policy Investigator** — tone, voice, terminology, style rules
- **Factual Claim Verifier** — superlatives, benchmarks, SLA substantiation
- **Design & A11y Analyst** — WCAG contrast, color palette compliance
- **Governance Audit Agent** — comprehensive document audits, diff patching, friction analytics

---

## 🏆 The Three Signature Technical Improvements

1. **Guideline Ambiguity & Friction Scoring Engine** — algorithmic tracking of creator overrides, computing a friction index to alert leadership when guidelines are poorly worded.
2. **3-Tier Risk-Gated Pre-Publication Engine** — Critical Blockers (factual/legal), Moderate Warnings (tone), Minor Polish (stylistic).
3. **Intent-Preserving Surgical Diff Editor** — side-by-side Git-like diff view with 1-click patch that preserves the author's original voice.

---

## 📂 Project Directory Structure

```
inkloom/
├── apps/
│   ├── web/                               # Next.js 14 Frontend Application
│   │   └── src/
│   │       ├── app/                       # App Router (page.tsx, layout.tsx)
│   │       ├── components/
│   │       │   ├── Navbar.tsx             # Top navigation with AI Copilot tab
│   │       │   ├── ReviewStudio.tsx       # Content review & inline audit
│   │       │   ├── AgenticChat.tsx        # ★ Agentic AI Chat Interface
│   │       │   ├── KnowledgeHub.tsx       # Brand guidelines, facts, terminology
│   │       │   ├── WorkflowPanel.tsx      # Approvals, comments, @ai integration
│   │       │   └── AnalyticsDashboard.tsx # Governance insights & friction heatmaps
│   │       └── lib/
│   │           └── api.ts                 # All API client functions incl. chat
│   └── server/                            # Node.js Express Backend API
│       └── src/
│           ├── controllers/
│           │   ├── chat.controller.ts     # ★ Agentic Chat API (LangGraph endpoint)
│           │   ├── audit.controller.ts
│           │   ├── content.controller.ts
│           │   ├── knowledge.controller.ts
│           │   ├── workflow.controller.ts
│           │   └── analytics.controller.ts
│           ├── routes/
│           │   ├── chat.routes.ts         # ★ /api/chat/* routes
│           │   └── ...other routes
│           ├── services/
│           │   ├── audit-runner.service.ts
│           │   └── python-bridge.service.ts
│           └── app.ts & index.ts
│
├── packages/
│   ├── shared/                            # Shared types, risk engine, diff utilities
│   ├── database/                          # Supabase schema, repositories, in-memory DB
│   ├── vector-store/                      # ChromaDB client & semantic indexers
│   └── langgraph-core/                    # ★ Core AI Engine
│       └── src/
│           ├── agentic-orchestrator.ts    # ★ LangGraph Stateful Agentic Workflow
│           ├── graph.ts                   # Multi-agent audit pipeline
│           ├── groq-client.ts             # ChatGroq factory (env-driven)
│           ├── state.ts                   # Audit state schema
│           ├── tools/                     # ★ 9 Real LangChain Tools
│           │   ├── validation-tool.ts
│           │   ├── guidelines-tool.ts
│           │   ├── facts-tool.ts
│           │   ├── terminology-tool.ts
│           │   ├── claim-verifier-tool.ts
│           │   ├── wcag-contrast-tool.ts
│           │   ├── audit-content-tool.ts
│           │   ├── surgical-patch-tool.ts
│           │   ├── ambiguity-metrics-tool.ts
│           │   └── index.ts
│           └── nodes/                     # Deterministic pipeline agent nodes
│
├── services/
│   └── vision-worker/                     # Pure Python zero-installer tools
│
├── tests/
│   ├── test-pipeline.ts                   # 13-point pipeline integration tests
│   ├── test-agentic-workflow.ts           # ★ 12-point agentic AI & tools tests
│   └── live-server-test.ts               # Live HTTP endpoint verification
│
├── .env                                   # ★ Application secrets (GROQ_API_KEY etc.)
├── .env.example                           # ★ Template for secrets
├── .gitignore
├── plan.md
├── README.md
└── package.json
```

---

## ⚡ Quick Start

### 1. Configure Environment Secrets

```bash
cp .env.example .env
# Edit .env and set your GROQ_API_KEY from https://console.groq.com/keys
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run All Tests

```bash
# Runs 13 pipeline tests + 12 agentic AI tests + 4 Python vision tests
npm test
```

### 4. Start the Application (No Docker Required)

```bash
npm start
# → http://localhost:3000 (frontend)
# → http://localhost:4000/api/health (backend)
```

This is the default startup mode. It starts the Express API and Next.js
development server using the existing Supabase configuration and the built-in
local persistence and vector-store fallback. Docker Desktop is not required.

Application data is durably stored in `data/inkloom-db.json` by default, so
content, audits, approvals, comments, audit logs, and governance metrics survive
server restarts. Set `INKLOOM_DATA_FILE` to use another local data location.

To additionally start local PostgreSQL and ChromaDB with Docker Compose:

```bash
npm start -- --infra
```

Press `Ctrl+C` to stop the application processes. Docker infrastructure
containers, when enabled, remain available for the next start.

### 5. Start Services Individually

```bash
npm run server
# → http://localhost:4000

npm run dev:web
# → http://localhost:3000
```

### 6. Open the AI Copilot

Navigate to the **"AI Copilot & Chat"** tab in the top navigation bar and start interacting with the real agentic system.

---

## 🔧 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Full Tests | `npm test` | Pipeline + Agentic + Python (29 total tests) |
| Pipeline Only | `npm run test:pipeline` | 13 multi-agent tests |
| Agentic Only | `npm run test:agentic` | 12 LangChain tools + LangGraph workflow tests |
| Live Server | `npm run test:live` | Tests all HTTP endpoints including `/api/chat/*` |
| Backend | `npm run server` | Express API on port 4000 |
| Frontend | `npm run dev:web` | Next.js dev server on port 3000 |
| Application | `npm start` | Backend and frontend without Docker |
| Full local stack | `npm start -- --infra` | Docker infrastructure, backend, and frontend |

---

## 🛡️ Security & Responsible AI

- **GROQ_API_KEY** is strictly server-side — never exposed in frontend code.
- All tool inputs are validated and sanitized.
- Empty/invalid queries trigger clarification requests, not fake responses.
- Missing Groq key produces a clear error — never silently falls back to hardcoded results.
- Chat sessions are isolated per session ID.
- Immutable compliance audit log tracks every approval, override, and AI suggestion.
- All AI models, tools, and external services are declared in the Ethical AI Disclosure modal.
