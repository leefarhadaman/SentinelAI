require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const reviewRoutes = require('./routes/reviewRoutes');
const githubRoutes = require('./routes/githubRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// ─── Database ──────────────────────────────────────────────────────────────
connectDB();

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Routes ───────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'Server running',
    timestamp: new Date().toISOString(),
    model: process.env.AI_MODEL,
    environment: process.env.NODE_ENV,
    endpoints: {
      health: 'GET /api/health',
      singleReview: 'POST /api/review',
      reviewHistory: 'GET /api/review/history',
      githubAnalyze: 'POST /api/github/analyze',
      githubScans: 'GET /api/github/scans',
      uploadAnalyze: 'POST /api/upload/analyze',
    },
  });
});

app.use('/api/review', reviewRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/upload', uploadRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled error:', err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

// ─── Start ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`\n🚀 SentinelAI backend running on port ${PORT}`);
  console.log(`   Health:   http://localhost:${PORT}/api/health`);
  console.log(`   GitHub:   POST http://localhost:${PORT}/api/github/analyze`);
  console.log(`   Upload:   POST http://localhost:${PORT}/api/upload/analyze`);
  console.log(`   Review:   POST http://localhost:${PORT}/api/review\n`);
});
