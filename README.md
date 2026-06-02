# LuwiAI - Cloud Coding AI Agent

An asynchronous cloud-based AI coding agent with full GitHub integration. Automate code reviews, bug fixing, refactoring, code generation, and more — all powered by OpenRouter (via an OpenAI-compatible API) and connected to your GitHub repositories.

## Architecture

```
LuwiAI-SWE-Agent/
├── server/                     # Backend (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/             # Environment configuration
│   │   ├── github/             # GitHub OAuth & API integration (Octokit)
│   │   ├── agent/              # AI agent core (OpenRouter/OpenAI-compatible integration)
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
- **SQLite** (built into Node.js via `node:sqlite`, for persisted job history)
- **GitHub OAuth App** (for authentication)
- **OpenRouter API Key** (recommended for the AI agent)

### Installing Node.js

<details>
<summary><b>Windows</b></summary>

1. Acede a [nodejs.org](https://nodejs.org/) e clica no botão de download da versão **LTS** (>= 22).
2. Executa o instalador `.msi` descarregado.
3. Segue o assistente de instalação (deixa todas as opções predefinidas).
4. Após a instalação, abre o **PowerShell** ou **Command Prompt** e verifica:
   ```powershell
   node --version
   npm --version
   ```
   Devem aparecer versões >= 22 (node) e >= 10 (npm).

#### Alternativa — via winget (recomendado)

```powershell
winget install OpenJS.NodeJS.LTS
```
</details>

<details>
<summary><b>macOS</b></summary>

#### Opção 1 — Homebrew (recomendado)

```bash
brew install node@22
brew link --overwrite node@22
```

#### Opção 2 — Instalador oficial

1. Acede a [nodejs.org](https://nodejs.org/) e descarrega o instalador `.pkg` para macOS.
2. Executa o ficheiro descarregado e segue o assistente.
3. Verifica a instalação:
   ```bash
   node --version
   npm --version
   ```

</details>

<details>
<summary><b>Linux</b></summary>

#### Ubuntu / Debian

```bash
# Adiciona o repositório oficial do NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# Instala o Node.js
sudo apt-get install -y nodejs

# Verifica
node --version
npm --version
```

#### Fedora / RHEL

```bash
# Adiciona o repositório NodeSource
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -

# Instala
sudo dnf install -y nodejs

# Verifica
node --version
npm --version
```

#### Arch Linux

```bash
sudo pacman -S nodejs npm
```

#### Verificação (qualquer distribuição)

```bash
node --version   # deve mostrar >= v22
npm --version    # deve mostrar >= 10
```

</details>

---

### Installing Redis

<details>
<summary><b>Windows</b></summary>

O Redis não tem suporte nativo no Windows. Recomenda-se uma das seguintes opções:

#### Opção 1 — WSL (recomendado)

```powershell
# Instala o WSL (se ainda não tiver)
wsl --install

# Dentro do WSL (Ubuntu), instala o Redis
sudo apt-get update
sudo apt-get install -y redis-server
sudo service redis-server start

# Verifica
redis-cli ping
# Deve responder: PONG
```

#### Opção 2 — Docker Desktop

```powershell
# Instala o Docker Desktop a partir de https://docs.docker.com/desktop/setup/install/windows-install/

# Após instalado, corre o Redis num contentor
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Verifica
docker exec redis redis-cli ping
# Deve responder: PONG
```

#### Opção 3 — Memurai (Redis compatível para Windows)

1. Descarrega o **Memurai** em [memurai.com](https://www.memurai.com/)
2. Instala e inicia o serviço
3. Verifica com `redis-cli ping`

</details>

<details>
<summary><b>macOS</b></summary>

```bash
# Instala com Homebrew
brew install redis

# Inicia o Redis como serviço em segundo plano
brew services start redis

# Verifica
redis-cli ping
# Deve responder: PONG

# (Opcional) Teste rápido
redis-cli set foo bar
redis-cli get foo   # deve devolver "bar"
```
</details>

<details>
<summary><b>Linux</b></summary>

#### Ubuntu / Debian

```bash
# Atualiza os repositórios
sudo apt-get update

# Instala o Redis
sudo apt-get install -y redis-server

# Inicia o serviço
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verifica
redis-cli ping
# Deve responder: PONG
```

#### Fedora / RHEL

```bash
sudo dnf install -y redis
sudo systemctl enable redis
sudo systemctl start redis
redis-cli ping
```

#### Arch Linux

```bash
sudo pacman -S redis
sudo systemctl enable redis
sudo systemctl start redis
redis-cli ping
```

</details>

---

### Criar um GitHub OAuth App

1. Vai a **GitHub Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**
   - Link direto: [https://github.com/settings/developers](https://github.com/settings/developers)

2. Preenche o formulário:
   - **Application name**: `LuwiAI` (ou o nome que preferires)
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:5173/auth/callback`

3. Clica em **Register application**

4. Na página seguinte, clica em **Generate a new client secret**

5. Copia o **Client ID** e o **Client Secret** — vais precisar deles para preencher o ficheiro `.env`

---

### Obter uma OpenRouter API Key

O projeto usa o SDK da OpenAI, mas também funciona com endpoints compatíveis. A opção recomendada é usar o **OpenRouter**, que permite escolher entre vários modelos através de uma única API.

1. Acede a [openrouter.ai/keys](https://openrouter.ai/keys)
2. Inicia sessão ou cria uma conta no OpenRouter
3. Clica em **Create Key**
4. Dá um nome à chave (ex: `LuwiAI`)
5. Opcionalmente, define limites de uso/crédito para desenvolvimento
6. **Copia a chave imediatamente** — não poderás vê-la novamente depois de fechar o diálogo
7. No ficheiro `.env`, usa a chave em `OPENAI_API_KEY` e define o endpoint do OpenRouter em `OPENAI_BASE_URL`:
   ```env
   OPENAI_API_KEY=sk-or-v1-your-openrouter-api-key
   OPENAI_BASE_URL=https://openrouter.ai/api/v1
   ```
8. Define o modelo pretendido no ficheiro `.env` (`OPENAI_MODEL`). Confirma o identificador exato no catálogo do OpenRouter antes de usar. Exemplos:
   - `openai/gpt-4o` — boa qualidade geral
   - `openai/gpt-4o-mini` — mais rápido e económico para tarefas simples
   - `anthropic/claude-3.5-sonnet` — alternativa para tarefas complexas de código

> **Nota**: O nome das variáveis continua como `OPENAI_*` porque a aplicação usa o SDK da OpenAI com um endpoint compatível. Para usar a API direta da OpenAI, remove `OPENAI_BASE_URL` e utiliza uma chave/modelo da OpenAI.

---

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
DATABASE_PATH=./data/luwiai.sqlite
JWT_SECRET=your-super-secret-jwt-key
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
GITHUB_WEBHOOK_SECRET=your-github-webhook-secret
OPENAI_API_KEY=sk-or-v1-your-openrouter-api-key
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=openai/gpt-4o
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

The client will be available at `http://localhost:5173` and the API at `http://localhost:3000`. Job records are persisted in the SQLite database configured by `DATABASE_PATH` (default: `./data/luwiai.sqlite` inside `server/`).

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

- **Backend**: Node.js, Express, TypeScript, BullMQ, Redis, Octokit, OpenAI SDK (OpenRouter/OpenAI-compatible endpoint)
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, React Router, Lucide Icons
- **Auth**: GitHub OAuth, JWT
- **CI/CD**: GitHub Actions, Vercel
