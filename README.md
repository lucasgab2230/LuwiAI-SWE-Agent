# LuwiAI - Cloud Coding AI Agent

An asynchronous cloud-based AI coding agent with full GitHub integration. Automate code reviews, bug fixing, refactoring, code generation, and more — all powered by OpenAI and connected to your GitHub repositories.

## Architecture

```
LuwiAI-SWE-Agent/
├── server/                     # Backend (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/             # Environment configuration
│   │   ├── github/             # GitHub OAuth & API integration (Octokit)
│   │   ├── agent/              # AI agent core (OpenAI integration)
│   │   ├── queue/              # Async job queue (BullMQ + Redis)
│   │   ├── routes/             # REST API endpoints
│   │   ├── webhooks/           # GitHub webhook handlers
│   │   ├── middleware/         # JWT authentication
│   │   └── types/              # TypeScript type definitions
│   └── package.json
│
├── client/                     # Frontend (React + Vite + TailwindCSS)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Application pages
│   │   ├── hooks/              # Custom React hooks
│   │   └── services/           # API client
│   └── package.json
│
└── .github/workflows/          # CI/CD pipelines
```

## Features

- **Code Review** — Automated PR reviews with detailed feedback on bugs, security, and best practices
- **Code Generation** — Generate production-ready code from natural language descriptions
- **Bug Fixing** — Analyze errors and automatically generate fixes
- **Refactoring** — Improve code structure and quality while preserving behavior
- **Code Explanation** — Get comprehensive explanations of complex code
- **PR Summaries** — Automatic pull request summaries and changelog generation
- **GitHub Integration** — OAuth login, repository browsing, webhook auto-triggering
- **Async Processing** — Non-blocking job queue with status tracking

## Prerequisites

- **Node.js** >= 22
- **Redis** (for the async job queue)
- **GitHub OAuth App** (for authentication)
- **OpenAI API Key** (for the AI agent)

## Setup

### 1. Clone and install dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure environment variables

**Server** (`server/.env`):

```env
PORT=3000
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
GITHUB_WEBHOOK_SECRET=your-github-webhook-secret
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o
ALLOWED_ORIGINS=http://localhost:5173
```

**Client** (`client/.env`):

```env
VITE_GITHUB_CLIENT_ID=your-github-oauth-client-id
```

### 3. Start development servers

```bash
# Terminal 1 — Server
cd server
npm run dev

# Terminal 2 — Client
cd client
npm run dev
```

The client will be available at `http://localhost:5173` and the API at `http://localhost:3000`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/github` | Exchange GitHub OAuth code for JWT |
| GET | `/api/auth/me` | Get current authenticated user |
| GET | `/api/repositories` | List user's GitHub repositories |
| POST | `/api/jobs` | Create a new agent job |
| GET | `/api/jobs` | List user's jobs |
| GET | `/api/jobs/:id` | Get job status and result |
| POST | `/api/webhooks/github` | Receive GitHub webhook events |
| GET | `/api/health` | Health check |

## Agent Job Types

| Type | Description |
|------|-------------|
| `code_review` | Review code changes for bugs, security, and improvements |
| `code_generation` | Generate code from a description |
| `bug_fix` | Analyze errors and generate fixes |
| `refactor` | Improve code structure and quality |
| `explain_code` | Get detailed code explanations |
| `pr_summary` | Generate pull request summaries |

## Scripts

### Server

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Start production server |
| `npm run lint` | Run linter |

### Client

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run linter |

## Deployment

The project includes CI/CD pipelines configured for Vercel (client) and can be adapted for any Node.js hosting platform (server).

See [.github/workflows](.github/workflows/) for the current pipeline definitions.

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, BullMQ, Redis, Octokit, OpenAI SDK
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, React Router, Lucide Icons
- **Auth**: GitHub OAuth, JWT
- **CI/CD**: GitHub Actions, Vercel