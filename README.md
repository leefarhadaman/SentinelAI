# SentinelAI

AI-powered code security and quality scanner. Paste a GitHub repo URL and get a detailed report on bugs, vulnerabilities, and code quality — all running locally with no data sent to the cloud.

## What it does

- Clones a public GitHub repository
- Scans up to 15 code files (.js, .ts, .py, .java, .go, etc.)
- Runs each file through a local AI model (llama3 via Ollama)
- Returns a structured report with issues, severity levels, and fix suggestions
- Scores the codebase on Security, Maintainability, and Performance (out of 10)

## Tech Stack

**Backend** — Node.js, Express, MongoDB, Ollama (llama3)  
**Frontend** — Next.js, TypeScript, Tailwind CSS

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18+
- [MongoDB](https://www.mongodb.com) running locally
- [Ollama](https://ollama.com) with `llama3` pulled

```bash
ollama pull llama3
```

### Backend

```bash
cd backend
npm install
npm run dev
```

Runs on `http://localhost:5001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:3000`

## Usage

1. Open `http://localhost:3000`
2. Paste a public GitHub repo URL
3. Click **Scan Repo**
4. Watch files being analyzed in real time
5. Review the full report with scores and issue details

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server status |
| POST | `/api/github/analyze` | Analyze a GitHub repo (SSE stream) |
| POST | `/api/upload/analyze` | Analyze a uploaded .zip file |
| POST | `/api/review` | Single file code review |

## Environment Variables

Create `backend/.env`:

```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/sentinelai
OLLAMA_URL=http://localhost:11434
AI_MODEL=llama3
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```
