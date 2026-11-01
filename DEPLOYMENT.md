# Inkloom AI — Vercel Deployment & Isolation Guide

This repository is architected to support two deployment workflows on Vercel:
1. **Single Project ("At Once")**: Deploy both the Next.js frontend and the Express backend together in a single Vercel project with zero configuration.
2. **Two Isolated Projects ("Separately")**: Deploy the Frontend and Backend into separate Vercel projects so you can scale, maintain, and deploy them independently.

---

## Architecture Overview

```
                               ┌──────────────────────────────────────────────┐
                               │       Option 1: Deploy At Once (1 Project)   │
                               │                                              │
                               │  https://your-inkloom.vercel.app             │
                               │   ├── UI Routes (/)                          │
                               │   └── API Routes (/api/*) (Serverless Pages) │
                               └──────────────────────────────────────────────┘
                                                       ▲
                                                       │
                     ┌─────────────────────────────────┴─────────────────────────────────┐
                     │                                                                   │
┌──────────────────────────────────────────────┐       ┌──────────────────────────────────────────────┐
│     Option 2A: Isolated Backend Project      │       │     Option 2B: Isolated Frontend Project     │
│                                              │       │                                              │
│  https://inkloom-api.vercel.app              │◀──────│  https://inkloom-web.vercel.app              │
│   ├── Root Health & Status (/)               │ CORS  │   ├── Static UI & Studio (/)                 │
│   ├── Health Endpoint (/api/health)          │       │   └── NEXT_PUBLIC_API_URL points to backend  │
│   └── All Endpoints (/api/audit, etc.)       │       │                                              │
└──────────────────────────────────────────────┘       └──────────────────────────────────────────────┘
```

---

## Option 1: Deploy Both Frontend & Backend at Once (Single Vercel Project)

Deploying everything in a single Vercel project is the simplest and recommended default.

1. **Import the repository into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new) and select your GitHub repository.
2. **Leave Root Directory as default (`.`)**:
   - Framework Preset: **Next.js** (automatically detected)
   - Build Command: `npm run vercel-build` (default configured via `vercel.json`)
   - Output Directory: `apps/web/.next` (default configured via `vercel.json`)
3. **Environment Variables**:
   - `GROQ_API_KEY`: Your Groq AI API key.
   - `SUPABASE_URL` *(Optional)*: Supabase PostgreSQL instance URL.
   - `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` *(Optional)*.
   *(Note: `NEXT_PUBLIC_API_URL` is NOT needed when co-deployed; the frontend automatically routes to `/api` on the same domain).*
4. Click **Deploy**.

Both your Next.js UI (`/`) and all backend endpoints (`/api/*`) will run synchronously on the same domain.

---

## Option 2: Deploy Frontend & Backend Separately (2 Isolated Projects)

If you want to maintain and deploy frontend and backend separately from the same Git repo:

### Step 1: Deploy the Backend Project

1. In Vercel, click **Add New Project** and select this GitHub repository.
2. Configure **Project Settings**:
   - **Project Name**: `inkloom-backend` (or your choice)
   - **Root Directory**: Click *Edit* and select **`apps/server`**
   - **Framework Preset**: **Other**
   - **Build Command**: `npm run build`
   - **Output Directory**: Leave empty
3. **Include Files Outside Root Directory**:
   - Ensure the toggle **"Include source files outside of the Root Directory in the Build Step"** is checked (Vercel checks this by default for monorepos).
4. **Environment Variables**:
   - `GROQ_API_KEY`: Your Groq AI API key.
   - `SUPABASE_URL` *(Optional)*
   - `SUPABASE_SERVICE_ROLE_KEY` *(Optional)*
5. Click **Deploy**.
6. Once deployed, test your backend URL (e.g., `https://inkloom-backend.vercel.app`):
   - Visiting `/` returns `{ "status": "healthy", "service": "Inkloom AI Backend API" }`
   - Copy this URL: `https://inkloom-backend.vercel.app`

---

### Step 2: Deploy the Frontend Project

1. In Vercel, click **Add New Project** and select this GitHub repository again.
2. Configure **Project Settings**:
   - **Project Name**: `inkloom-frontend` (or your choice)
   - **Root Directory**: Click *Edit* and select **`apps/web`**
   - **Framework Preset**: **Next.js**
   - **Build Command**: `npm run build`
   - **Output Directory**: Leave empty (Next.js default)
3. **Environment Variables**:
   - Add: `NEXT_PUBLIC_API_URL` = `https://inkloom-backend.vercel.app/api`
     *(Replace with your actual backend project URL deployed in Step 1)*
4. Click **Deploy**.

The frontend will now communicate directly with your isolated backend with full CORS support.

---

## Verified Backend Endpoints

All endpoints support JSON input/output, CORS preflight, and automatic fallback:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` or `/health` | Service health status and capabilities list |
| `GET` | `/api/health` | Diagnostic status (Supabase connectivity & capabilities) |
| `POST` | `/api/audit/analyze` | Multi-agent audit for raw text or file uploads |
| `GET` | `/api/audit/:contentId` | Fetch latest audit report for content |
| `GET` | `/api/content/:contentId` | Retrieve publication draft |
| `POST` | `/api/content/:contentId/apply-patch` | Surgical diff patch application |
| `POST` | `/api/content/:contentId/override` | Record governance warning override |
| `GET` | `/api/knowledge/guidelines` | Fetch brand tone, claim, and style guidelines |
| `POST` | `/api/knowledge/guidelines` | Create new brand guideline |
| `GET` | `/api/knowledge/facts` | Query approved facts database |
| `POST` | `/api/knowledge/facts` | Add verified fact |
| `GET` | `/api/knowledge/terminology` | Retrieve prohibited and preferred terminology |
| `POST` | `/api/knowledge/terminology` | Add terminology rule |
| `GET` | `/api/knowledge/brand-kit` | Retrieve brand colors, fonts, and assets |
| `GET` | `/api/workflow/:contentId/comments` | Retrieve editorial comments |
| `POST` | `/api/workflow/:contentId/comments` | Post editorial feedback comment |
| `POST` | `/api/workflow/:contentId/status` | Update publication workflow status |
| `GET` | `/api/workflow/:contentId/audit-logs` | Retrieve governance compliance audit logs |
| `GET` | `/api/analytics/overview` | Platform-wide compliance KPIs and metrics |
| `GET` | `/api/analytics/ambiguity-metrics` | Ambiguity friction and guideline clarity metrics |
| `POST` | `/api/chat/message` | Agentic AI chat with LangGraph multi-agent orchestrator |
| `GET` | `/api/chat/history/:sessionId` | Retrieve chat transcript |
| `POST` | `/api/chat/reset/:sessionId` | Reset conversational agent context |

---

## Local Verification Commands

To test everything locally before pushing to GitHub:

```bash
# 1. Run full verification suite (pipeline, agentic tools, vector store)
npm run test:pipeline
npm run test:agentic

# 2. Run live server tests against all Express endpoints
npm run test:live

# 3. Test Vercel build & co-deployed serverless API
npm run vercel-build
npm run test:codeploy
```
