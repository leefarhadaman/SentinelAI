# SentinelAI Backend — Complete Build Specification

> **AI-Powered Code Review System**  
> Node.js · Express · MongoDB · Ollama (DeepSeek-Coder)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [Prerequisites](#4-prerequisites)
5. [Project Initialization](#5-project-initialization)
6. [Folder Structure](#6-folder-structure)
7. [Environment Configuration](#7-environment-configuration)
8. [Step-by-Step File Creation](#8-step-by-step-file-creation)
   - 8.1 [Database Config — `db.js`](#81-database-config--dbjs)
   - 8.2 [Review Model — `reviewModel.js`](#82-review-model--reviewmodeljs)
   - 8.3 [Prompt Builder — `promptBuilder.js`](#83-prompt-builder--promptbuilderjs)
   - 8.4 [AI Service — `aiService.js`](#84-ai-service--aiservicejs)
   - 8.5 [Controller — `reviewController.js`](#85-controller--reviewcontrollerjs)
   - 8.6 [Routes — `reviewRoutes.js`](#86-routes--reviewroutesjs)
   - 8.7 [Entry Point — `server.js`](#87-entry-point--serverjs)
9. [API Reference](#9-api-reference)
10. [API Testing — Step by Step](#10-api-testing--step-by-step)
11. [Security Measures](#11-security-measures)
12. [Error Handling Strategy](#12-error-handling-strategy)
13. [Future Feature Design](#13-future-feature-design)
14. [Development Scripts](#14-development-scripts)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Project Overview

SentinelAI is a backend server that accepts raw source code, sends it to a locally running LLM (DeepSeek-Coder via Ollama), and returns structured feedback covering:

| Category | Description |
|---|---|
| `issues` | Logic errors, bad patterns, unused variables |
| `security` | Injection risks, exposed secrets, unsafe operations |
| `suggestions` | Refactoring ideas, best practices |
| `optimizedCode` | AI-rewritten improved version of the submitted code |

All reviews are persisted in MongoDB for history and future analytics.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Node.js (v18+) | JavaScript server environment |
| Framework | Express.js | HTTP routing and middleware |
| Database | MongoDB + Mongoose | Persistent storage of review history |
| HTTP Client | Axios | Communicate with Ollama API |
| Config | dotenv | Environment variable management |
| AI Runtime | Ollama | Local LLM host |
| AI Model | DeepSeek-Coder | Code analysis and generation |
| Dev Tool | nodemon | Auto-restart on file change |

---

## 3. System Architecture

```
┌─────────────────────────┐
│   Frontend (Next.js)    │
└────────────┬────────────┘
             │  POST /api/review
             │  { code, language }
             ▼
┌─────────────────────────┐
│  Express.js Backend     │
│  ┌────────────────────┐ │
│  │  reviewRoutes.js   │ │
│  └────────┬───────────┘ │
│           ▼             │
│  ┌────────────────────┐ │
│  │reviewController.js │ │
│  └────────┬───────────┘ │
│           ▼             │
│  ┌────────────────────┐ │
│  │   aiService.js     │ │
│  └────────┬───────────┘ │
└───────────┼─────────────┘
            │  POST /api/generate
            ▼
┌─────────────────────────┐
│  Ollama Local API       │
│  http://localhost:11434 │
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│  DeepSeek-Coder Model   │
└────────────┬────────────┘
             │ JSON response
             ▼
┌─────────────────────────┐
│  MongoDB (sentinelai)   │
│  reviews collection     │
└─────────────────────────┘
```

**Data Flow:**
1. Client sends `{ code, language }` to `POST /api/review`
2. Controller validates input and builds an AI prompt
3. AI Service sends prompt to Ollama, receives raw text
4. Controller parses the AI JSON response
5. Review is saved to MongoDB
6. Structured result is returned to the client

---

## 4. Prerequisites

Before writing a single line of code, verify the following are installed and running.

### 4.1 Node.js

```bash
node -v    # Must be v18 or higher
npm -v     # Must be v9 or higher
```

### 4.2 MongoDB

```bash
# Start MongoDB (Linux/macOS)
sudo systemctl start mongod

# Verify it's running
mongosh --eval "db.adminCommand({ ping: 1 })"
# Expected: { ok: 1 }
```

### 4.3 Ollama + DeepSeek-Coder

```bash
# Install Ollama from https://ollama.com
# Then pull the model:
ollama pull deepseek-coder

# Verify Ollama is running
curl http://localhost:11434/api/tags
# Expected: JSON list containing "deepseek-coder"
```

---

## 5. Project Initialization

Run these commands in sequence:

```bash
# Step 1: Create project directory
mkdir sentinelai-backend
cd sentinelai-backend

# Step 2: Initialize npm
npm init -y

# Step 3: Install production dependencies
npm install express mongoose axios dotenv cors express-rate-limit express-validator

# Step 4: Install dev dependencies
npm install --save-dev nodemon

# Step 5: Create all required directories
mkdir -p src/config src/controllers src/routes src/services src/models src/utils

# Step 6: Create all required files
touch src/server.js \
      src/config/db.js \
      src/controllers/reviewController.js \
      src/routes/reviewRoutes.js \
      src/services/aiService.js \
      src/models/reviewModel.js \
      src/utils/promptBuilder.js \
      .env \
      .gitignore \
      README.md
```

### 5.1 Update `package.json` scripts

Open `package.json` and add the following scripts section:

```json
{
  "name": "sentinelai-backend",
  "version": "1.0.0",
  "description": "AI-Powered Code Review Backend",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "echo \"No tests yet\""
  },
  "keywords": ["AI", "code-review", "ollama", "deepseek"],
  "license": "MIT"
}
```

### 5.2 Create `.gitignore`

```
node_modules/
.env
*.log
```

---

## 6. Folder Structure

The final project must match this structure exactly:

```
sentinelai-backend/
│
├── src/
│   ├── config/
│   │   └── db.js                  ← MongoDB connection
│   │
│   ├── controllers/
│   │   └── reviewController.js    ← Request handler logic
│   │
│   ├── routes/
│   │   └── reviewRoutes.js        ← Route definitions
│   │
│   ├── services/
│   │   └── aiService.js           ← Ollama API communication
│   │
│   ├── models/
│   │   └── reviewModel.js         ← Mongoose schema
│   │
│   ├── utils/
│   │   └── promptBuilder.js       ← Prompt engineering
│   │
│   └── server.js                  ← Express app entry point
│
├── .env                           ← Environment variables (never commit)
├── .gitignore
├── package.json
└── README.md
```

---

## 7. Environment Configuration

Create the `.env` file in the project root with the following content:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/sentinelai

# Ollama
OLLAMA_API=http://localhost:11434/api/generate
AI_MODEL=deepseek-coder

# Security
MAX_REQUEST_SIZE=1mb
```

> ⚠️ **Never commit `.env` to version control.** It is already listed in `.gitignore`.

---

## 8. Step-by-Step File Creation

Create each file in the order shown below. Every file depends on the ones before it.

---

### 8.1 Database Config — `db.js`

**File:** `src/config/db.js`

**Purpose:** Establishes and manages the MongoDB connection. Called once at startup.

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1); // Exit if DB cannot connect — server cannot safely run
  }
};

module.exports = connectDB;
```

**What it does:**
- Uses `mongoose.connect()` with the URI from `.env`
- Logs success with the host name
- Crashes the process on failure (safe-fail behavior)

---

### 8.2 Review Model — `reviewModel.js`

**File:** `src/models/reviewModel.js`

**Purpose:** Defines the MongoDB schema for storing code reviews.

```javascript
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Code is required'],
      trim: true,
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      trim: true,
      lowercase: true,
      enum: {
        values: [
          'javascript', 'typescript', 'python', 'java', 'c', 'cpp',
          'csharp', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin',
          'html', 'css', 'sql', 'bash', 'other'
        ],
        message: 'Language "{VALUE}" is not supported',
      },
    },
    aiResponse: {
      issues: { type: [String], default: [] },
      security: { type: [String], default: [] },
      suggestions: { type: [String], default: [] },
      optimizedCode: { type: String, default: '' },
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

module.exports = mongoose.model('Review', reviewSchema);
```

**Schema Fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `code` | String | Yes | Raw source code submitted |
| `language` | String | Yes | Must match enum list |
| `aiResponse.issues` | [String] | No | Logic/style problems |
| `aiResponse.security` | [String] | No | Security vulnerabilities |
| `aiResponse.suggestions` | [String] | No | Improvement ideas |
| `aiResponse.optimizedCode` | String | No | Rewritten code |
| `createdAt` | Date | Auto | Added by timestamps option |
| `updatedAt` | Date | Auto | Added by timestamps option |

---

### 8.3 Prompt Builder — `promptBuilder.js`

**File:** `src/utils/promptBuilder.js`

**Purpose:** Constructs the structured prompt sent to DeepSeek-Coder. Separating this logic makes prompts easy to tune without touching business logic.

```javascript
/**
 * Builds the AI prompt for code review.
 * @param {string} code - The raw source code to review.
 * @param {string} language - The programming language of the code.
 * @returns {string} - The formatted prompt string.
 */
const buildPrompt = (code, language) => {
  return `You are a senior software engineer performing a professional code review.

Analyze the following ${language} code thoroughly.

You MUST return ONLY a valid JSON object — no explanation, no markdown, no code fences.

The JSON must follow this exact structure:
{
  "issues": ["string describing each issue"],
  "security": ["string describing each security vulnerability"],
  "suggestions": ["string describing each improvement suggestion"],
  "optimizedCode": "the full improved version of the code as a string"
}

Rules:
- If there are no items in a category, return an empty array [].
- The "optimizedCode" field must always contain a valid, runnable version of the code.
- Do not include any text outside the JSON object.
- Do not wrap the JSON in markdown backticks.

Language: ${language}

Code to review:
\`\`\`${language}
${code}
\`\`\``;
};

module.exports = { buildPrompt };
```

**Why this matters:**
- Instructs the model to return **only JSON** — critical for reliable parsing
- Explicitly forbids markdown fences that would break `JSON.parse()`
- Defines a fallback (`[]`) for empty categories

---

### 8.4 AI Service — `aiService.js`

**File:** `src/services/aiService.js`

**Purpose:** Single-responsibility module that handles all HTTP communication with the Ollama API.

```javascript
const axios = require('axios');

/**
 * Sends a prompt to the Ollama API and returns the AI response text.
 * @param {string} prompt - The fully built prompt string.
 * @returns {Promise<string>} - Raw text response from the AI model.
 */
const analyzeCode = async (prompt) => {
  try {
    const response = await axios.post(
      process.env.OLLAMA_API,
      {
        model: process.env.AI_MODEL,
        prompt: prompt,
        stream: false,        // Synchronous response
        options: {
          temperature: 0.1,   // Low temperature = more deterministic, structured output
          num_predict: 2048,  // Max tokens to generate
        },
      },
      {
        timeout: 120000, // 2 minute timeout — LLMs can be slow locally
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.data || !response.data.response) {
      throw new Error('Empty or invalid response from Ollama');
    }

    return response.data.response;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error(
        'Cannot connect to Ollama. Make sure it is running at ' +
        process.env.OLLAMA_API
      );
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('Ollama request timed out. The model may be loading.');
    }
    throw new Error(`AI service error: ${error.message}`);
  }
};

module.exports = { analyzeCode };
```

**Key design decisions:**

| Option | Value | Reason |
|---|---|---|
| `stream: false` | Synchronous | Simpler to handle; streaming added in v2 |
| `temperature: 0.1` | Near-zero | Produces consistent, parseable JSON |
| `timeout: 120000` | 2 minutes | First-run model load can be slow |
| Error wrapping | Custom messages | Gives the controller meaningful errors |

---

### 8.5 Controller — `reviewController.js`

**File:** `src/controllers/reviewController.js`

**Purpose:** Orchestrates the full review pipeline — validate, prompt, call AI, parse, save, respond.

```javascript
const { validationResult } = require('express-validator');
const { buildPrompt } = require('../utils/promptBuilder');
const { analyzeCode } = require('../services/aiService');
const Review = require('../models/reviewModel');

/**
 * POST /api/review
 * Handles the full code review pipeline.
 */
const reviewCode = async (req, res) => {
  // Step 1: Check for validation errors from express-validator middleware
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { code, language } = req.body;

  try {
    // Step 2: Build the structured prompt
    console.log(`📝 Building prompt for language: ${language}`);
    const prompt = buildPrompt(code, language);

    // Step 3: Send to Ollama and get raw AI text
    console.log(`🤖 Sending request to AI model: ${process.env.AI_MODEL}`);
    const rawResponse = await analyzeCode(prompt);

    // Step 4: Parse the AI response as JSON
    let parsedResponse;
    try {
      // Strip any accidental markdown fences the model may include
      const cleaned = rawResponse
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      parsedResponse = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('⚠️ Failed to parse AI response as JSON:', rawResponse);
      // Return a safe fallback instead of a 500 error
      parsedResponse = {
        issues: ['AI response could not be parsed. Please retry.'],
        security: [],
        suggestions: [],
        optimizedCode: code, // Return original code unchanged
      };
    }

    // Step 5: Normalize the parsed response (ensure all fields exist)
    const aiResponse = {
      issues: Array.isArray(parsedResponse.issues) ? parsedResponse.issues : [],
      security: Array.isArray(parsedResponse.security) ? parsedResponse.security : [],
      suggestions: Array.isArray(parsedResponse.suggestions) ? parsedResponse.suggestions : [],
      optimizedCode: parsedResponse.optimizedCode || '',
    };

    // Step 6: Save review to MongoDB
    const review = await Review.create({
      code,
      language,
      aiResponse,
    });

    console.log(`✅ Review saved to DB with ID: ${review._id}`);

    // Step 7: Return structured result to client
    return res.status(200).json({
      success: true,
      reviewId: review._id,
      language: review.language,
      createdAt: review.createdAt,
      ...aiResponse,
    });

  } catch (error) {
    console.error(`❌ Review controller error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * GET /api/review/history
 * Returns the last 20 reviews from MongoDB.
 */
const getReviewHistory = async (req, res) => {
  try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-__v'); // Exclude internal Mongoose version key

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/review/:id
 * Returns a single review by MongoDB ID.
 */
const getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).select('-__v');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    return res.status(200).json({ success: true, review });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { reviewCode, getReviewHistory, getReviewById };
```

**Controller pipeline:**

```
Incoming Request
      │
      ▼
[1] Validate Input (express-validator)
      │
      ▼
[2] Build Prompt (promptBuilder)
      │
      ▼
[3] Call Ollama (aiService)
      │
      ▼
[4] Parse JSON Response
      │
      ▼ (parse fail)→ Safe fallback object
      │
      ▼
[5] Normalize fields
      │
      ▼
[6] Save to MongoDB
      │
      ▼
[7] Return to client
```

---

### 8.6 Routes — `reviewRoutes.js`

**File:** `src/routes/reviewRoutes.js`

**Purpose:** Defines all API routes and attaches input validation middleware.

```javascript
const express = require('express');
const { body } = require('express-validator');
const {
  reviewCode,
  getReviewHistory,
  getReviewById,
} = require('../controllers/reviewController');

const router = express.Router();

// Validation middleware for code review requests
const reviewValidation = [
  body('code')
    .notEmpty()
    .withMessage('Code is required')
    .isString()
    .withMessage('Code must be a string')
    .isLength({ min: 1, max: 50000 })
    .withMessage('Code must be between 1 and 50,000 characters')
    .trim(),

  body('language')
    .notEmpty()
    .withMessage('Language is required')
    .isString()
    .withMessage('Language must be a string')
    .isIn([
      'javascript', 'typescript', 'python', 'java', 'c', 'cpp',
      'csharp', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin',
      'html', 'css', 'sql', 'bash', 'other'
    ])
    .withMessage('Unsupported language'),
];

// Routes
router.post('/', reviewValidation, reviewCode);          // POST /api/review
router.get('/history', getReviewHistory);                // GET  /api/review/history
router.get('/:id', getReviewById);                       // GET  /api/review/:id

module.exports = router;
```

---

### 8.7 Entry Point — `server.js`

**File:** `src/server.js`

**Purpose:** Bootstraps the entire Express application, registers middleware, mounts routes, and starts listening.

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();

// ─── Connect to Database ───────────────────────────────────────────────────
connectDB();

// ─── Security & Parsing Middleware ────────────────────────────────────────

// CORS — allow frontend origin
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST'],
}));

// Rate limiting — prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,                   // max 50 requests per window per IP
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});
app.use('/api/', limiter);

// Body parsers
app.use(express.json({ limit: process.env.MAX_REQUEST_SIZE || '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Routes ───────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'Server running',
    timestamp: new Date().toISOString(),
    model: process.env.AI_MODEL,
    environment: process.env.NODE_ENV,
  });
});

// Review routes
app.use('/api/review', reviewRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 SentinelAI backend running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Review API:   http://localhost:${PORT}/api/review`);
  console.log(`   Environment:  ${process.env.NODE_ENV}\n`);
});
```

---

## 9. API Reference

### `GET /api/health`

Verifies the server is running. Use this before testing any other endpoint.

**Response `200`:**
```json
{
  "status": "Server running",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "model": "deepseek-coder",
  "environment": "development"
}
```

---

### `POST /api/review`

Submits code for AI analysis. This is the primary endpoint.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "code": "function add(a, b) { return a + b; }",
  "language": "javascript"
}
```

**Response `200` (success):**
```json
{
  "success": true,
  "reviewId": "64f3a1b2c3d4e5f6a7b8c9d0",
  "language": "javascript",
  "createdAt": "2024-01-15T12:00:00.000Z",
  "issues": ["Missing JSDoc comment", "No type checking on parameters"],
  "security": [],
  "suggestions": ["Add TypeScript types", "Validate input types"],
  "optimizedCode": "/**\n * Adds two numbers.\n * @param {number} a\n * @param {number} b\n * @returns {number}\n */\nfunction add(a, b) {\n  if (typeof a !== 'number' || typeof b !== 'number') {\n    throw new TypeError('Both arguments must be numbers');\n  }\n  return a + b;\n}"
}
```

**Response `400` (validation error):**
```json
{
  "success": false,
  "errors": [
    {
      "type": "field",
      "msg": "Language is required",
      "path": "language",
      "location": "body"
    }
  ]
}
```

**Response `500` (server/AI error):**
```json
{
  "success": false,
  "message": "Cannot connect to Ollama. Make sure it is running at http://localhost:11434/api/generate"
}
```

---

### `GET /api/review/history`

Returns the last 20 code reviews stored in MongoDB.

**Response `200`:**
```json
{
  "success": true,
  "count": 3,
  "reviews": [
    {
      "_id": "64f3a1b2c3d4e5f6a7b8c9d0",
      "code": "function add(a, b) { return a + b; }",
      "language": "javascript",
      "aiResponse": { "issues": [], "security": [], "suggestions": [], "optimizedCode": "..." },
      "createdAt": "2024-01-15T12:00:00.000Z",
      "updatedAt": "2024-01-15T12:00:00.000Z"
    }
  ]
}
```

---

### `GET /api/review/:id`

Retrieves a single review by its MongoDB ObjectId.

**Example:** `GET /api/review/64f3a1b2c3d4e5f6a7b8c9d0`

**Response `404`:**
```json
{
  "success": false,
  "message": "Review not found"
}
```

---

## 10. API Testing — Step by Step

Test each endpoint in this exact order. Do not skip steps.

### Step 1 — Start the Server

```bash
npm run dev
```

**Expected output:**
```
✅ MongoDB connected: localhost
🚀 SentinelAI backend running on port 5000
   Health check: http://localhost:5000/api/health
```

If you see a MongoDB error, check that `mongod` is running.  
If you see an Ollama error later, check that `ollama serve` is running.

---

### Step 2 — Test Health Check

```bash
curl http://localhost:5000/api/health
```

**Expected response:**
```json
{
  "status": "Server running",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "model": "deepseek-coder",
  "environment": "development"
}
```

✅ **Pass condition:** HTTP 200 with all four fields present.

---

### Step 3 — Test Input Validation (should fail)

Send a request with a missing `language` field to verify validation works:

```bash
curl -X POST http://localhost:5000/api/review \
  -H "Content-Type: application/json" \
  -d '{"code": "console.log(1)"}'
```

**Expected response:**
```json
{
  "success": false,
  "errors": [
    {
      "msg": "Language is required",
      "path": "language"
    }
  ]
}
```

✅ **Pass condition:** HTTP 400 with validation error message.

---

### Step 4 — Test Invalid Language (should fail)

```bash
curl -X POST http://localhost:5000/api/review \
  -H "Content-Type: application/json" \
  -d '{"code": "print(1)", "language": "cobol"}'
```

**Expected response:**
```json
{
  "success": false,
  "errors": [{ "msg": "Unsupported language", "path": "language" }]
}
```

✅ **Pass condition:** HTTP 400 with "Unsupported language" message.

---

### Step 5 — Test Core Code Review (primary test)

```bash
curl -X POST http://localhost:5000/api/review \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function add(a,b){var result = a+b; return result}",
    "language": "javascript"
  }'
```

**Expected response shape:**
```json
{
  "success": true,
  "reviewId": "<mongodb-object-id>",
  "language": "javascript",
  "issues": ["..."],
  "security": [],
  "suggestions": ["..."],
  "optimizedCode": "..."
}
```

✅ **Pass condition:** HTTP 200, `success: true`, `reviewId` is a valid MongoDB ObjectId, all four AI response fields present.

> ⏱️ **Note:** First call may take 30–90 seconds while the model loads into memory. Subsequent calls are faster.

---

### Step 6 — Test Python Code Review

```bash
curl -X POST http://localhost:5000/api/review \
  -H "Content-Type: application/json" \
  -d '{
    "code": "def divide(a, b):\n    return a / b",
    "language": "python"
  }'
```

✅ **Pass condition:** HTTP 200, `issues` should mention division by zero risk.

---

### Step 7 — Test Review History

After running at least one successful review:

```bash
curl http://localhost:5000/api/review/history
```

**Expected response:**
```json
{
  "success": true,
  "count": 2,
  "reviews": [...]
}
```

✅ **Pass condition:** HTTP 200, `count` matches the number of reviews you've submitted.

---

### Step 8 — Test Get Review by ID

Copy a `reviewId` from a previous response and test:

```bash
curl http://localhost:5000/api/review/<paste-review-id-here>
```

✅ **Pass condition:** HTTP 200 with the full review object.

---

### Step 9 — Test 404 Handler

```bash
curl http://localhost:5000/api/nonexistent
```

**Expected response:**
```json
{
  "success": false,
  "message": "Route GET /api/nonexistent not found"
}
```

✅ **Pass condition:** HTTP 404.

---

### Test Checklist

| # | Test | Expected Status | Pass? |
|---|---|---|---|
| 1 | Server starts | Console logs ✅ | ☐ |
| 2 | `GET /api/health` | 200 | ☐ |
| 3 | Missing `language` | 400 | ☐ |
| 4 | Invalid language value | 400 | ☐ |
| 5 | JavaScript review | 200 | ☐ |
| 6 | Python review | 200 | ☐ |
| 7 | Review history | 200 | ☐ |
| 8 | Get review by ID | 200 | ☐ |
| 9 | Unknown route | 404 | ☐ |

---

## 11. Security Measures

| Measure | Implementation | File |
|---|---|---|
| Rate limiting | 50 req / 15 min per IP | `server.js` |
| Request size limit | 1 MB max body | `server.js` |
| Input validation | `express-validator` on all POST body fields | `reviewRoutes.js` |
| Language whitelist | Enum validation — rejects unknown languages | `reviewRoutes.js` + `reviewModel.js` |
| Code length cap | Max 50,000 characters | `reviewRoutes.js` |
| CORS restriction | Configurable origin whitelist | `server.js` |
| Error sanitization | Only expose `message`, never stack traces in production | `server.js` |
| `.gitignore` | `.env` excluded from version control | `.gitignore` |

---

## 12. Error Handling Strategy

All errors follow a three-tier hierarchy:

```
Tier 1: Validation Errors (400)
  └── express-validator catches malformed input before it reaches the controller

Tier 2: Business Logic Errors (4xx / 500)
  └── Controller try/catch handles AI failures, parse errors, DB errors
  └── AI parse failures return a safe fallback — never a 500

Tier 3: Unhandled Errors (500)
  └── Global error middleware in server.js catches anything that escapes
```

---

## 13. Future Feature Design

The backend is architected to support these features without major refactoring:

### GitHub Integration

```
POST /api/github/analyze-repo
Body: { "repoUrl": "https://github.com/user/repo", "branch": "main" }

POST /api/github/analyze-pr
Body: { "prUrl": "https://github.com/user/repo/pull/42" }
```

To add: create `src/services/githubService.js` to clone/fetch repo content, then feed files through the existing `analyzeCode` pipeline.

### Batch Analysis

```
POST /api/review/batch
Body: { "files": [{ "code": "...", "language": "python" }, ...] }
```

To add: loop through the files array in a new controller method, call `analyzeCode` for each, and return an array of results.

### AI Streaming Responses

Change `stream: false` to `stream: true` in `aiService.js` and pipe Ollama's streaming response to the client via `res.write()` and `res.end()`.

---

## 14. Development Scripts

```bash
# Start with hot-reload (development)
npm run dev

# Start without hot-reload (production)
npm start

# Check if MongoDB is accessible
mongosh --eval "db.adminCommand({ ping: 1 })"

# Check if Ollama is running and model is available
curl http://localhost:11434/api/tags | grep deepseek-coder

# List all stored reviews directly in MongoDB
mongosh sentinelai --eval "db.reviews.find().pretty()"

# Clear all reviews (reset database)
mongosh sentinelai --eval "db.reviews.deleteMany({})"
```

---

## 15. Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `MongoDB connection error` | MongoDB not running | Run `sudo systemctl start mongod` |
| `ECONNREFUSED 11434` | Ollama not running | Run `ollama serve` in a separate terminal |
| Response takes > 2 minutes | Model loading into RAM | Wait — first cold-start is slow |
| `JSON.parse error` | Model returned non-JSON | Check prompt in `promptBuilder.js`; lower temperature |
| `Unsupported language` | Language not in enum | Add it to both `reviewRoutes.js` and `reviewModel.js` |
| `PayloadTooLargeError` | Code exceeds 1 MB | Increase `MAX_REQUEST_SIZE` in `.env` |
| Empty `optimizedCode` | Model truncated output | Increase `num_predict` in `aiService.js` |
| Port already in use | Another process on 5000 | Change `PORT` in `.env` to 5001 |

---

*SentinelAI Backend Specification — v1.0.0*