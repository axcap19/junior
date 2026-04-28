// ==========================================
// SERVER-SIDE PROGRESS API - Express Router
// ==========================================
// Handles student progress tracking, XP, streaks, wrong answers
// Can be used as middleware or standalone server

const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Configuration
const DATA_DIR = process.env.DATA_DIR || '/var/www/html/data';
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');
const SUMMARY_FILE = path.join(DATA_DIR, 'summary.json');
const LOCK_FILE = path.join(DATA_DIR, '.write.lock');

// ==========================================
// UTILITIES
// ==========================================

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function acquireLock() {
  // Simple file-based lock (good enough for single-threaded Node)
  let attempts = 0;
  while (fs.existsSync(LOCK_FILE) && attempts < 50) {
    // Wait a tiny bit
    const now = Date.now();
    while (Date.now() - now < 10) {}
    attempts++;
  }
  fs.writeFileSync(LOCK_FILE, Date.now().toString());
}

function releaseLock() {
  try {
    fs.unlinkSync(LOCK_FILE);
  } catch (e) {}
}

function readProgress() {
  ensureDataDir();
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = fs.readFileSync(PROGRESS_FILE, 'utf8');
      return JSON.parse(data || '[]');
    }
  } catch (e) {
    console.error('Error reading progress file:', e);
  }
  return [];
}

function readSummary() {
  ensureDataDir();
  try {
    if (fs.existsSync(SUMMARY_FILE)) {
      const data = fs.readFileSync(SUMMARY_FILE, 'utf8');
      return JSON.parse(data || '{}');
    }
  } catch (e) {
    console.error('Error reading summary file:', e);
  }
  return {};
}

function writeSummary(summary) {
  ensureDataDir();
  try {
    fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2));
  } catch (e) {
    console.error('Error writing summary file:', e);
  }
}

function appendProgress(record) {
  ensureDataDir();
  try {
    const history = readProgress();
    history.push(record);
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(history, null, 2));
  } catch (e) {
    console.error('Error writing progress file:', e);
  }
}

// ==========================================
// ENDPOINTS
// ==========================================

// POST /api/progress - Save a lesson attempt
// Body: { visitorId, year, subject, lessonId, score: {correct, total}, wrongAnswers: [{q, given, correct}], passed }
router.post('/api/progress', (req, res) => {
  try {
    const { visitorId, year, subject, lessonId, score, wrongAnswers, passed } = req.body;

    // Validate
    if (!visitorId || !year || !subject || !lessonId || !score) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (typeof score.correct !== 'number' || typeof score.total !== 'number') {
      return res.status(400).json({ error: 'Invalid score format' });
    }

    acquireLock();
    try {
      // Create progress record (append-only log)
      const record = {
        visitorId,
        year,
        subject,
        lessonId,
        score,
        wrongAnswers: wrongAnswers || [],
        passed: passed || false,
        timestamp: new Date().toISOString()
      };
      appendProgress(record);

      // Update summary (current state)
      const summary = readSummary();
      if (!summary[visitorId]) {
        summary[visitorId] = {
          visitorId,
          xp: 0,
          streak: 0,
          completed: {},
          scores: {},
          wrongAnswers: {}
        };
      }

      const visitor = summary[visitorId];

      // Update XP
      if (passed) {
        visitor.xp = (visitor.xp || 0) + 10; // Bonus for completing
        visitor.streak = (visitor.streak || 0) + 1;
      }
      // Add per-correct-answer XP
      visitor.xp = (visitor.xp || 0) + score.correct * 2;

      // Mark as completed
      if (passed) {
        visitor.completed[lessonId] = true;
      }

      // Update scores
      if (!visitor.scores) visitor.scores = {};
      visitor.scores[lessonId] = score;

      // Track wrong answers by lesson
      if (wrongAnswers && wrongAnswers.length > 0) {
        if (!visitor.wrongAnswers) visitor.wrongAnswers = {};
        visitor.wrongAnswers[lessonId] = wrongAnswers;
      }

      visitor.lastActive = new Date().toISOString();

      writeSummary(summary);
      releaseLock();

      return res.json({
        success: true,
        visitorId,
        xp: visitor.xp,
        streak: visitor.streak,
        message: passed ? 'Lesson passed!' : 'Progress saved'
      });
    } catch (innerErr) {
      releaseLock();
      throw innerErr;
    }
  } catch (e) {
    console.error('POST /api/progress error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/progress?visitorId=X - Get progress for a visitor
router.get('/api/progress', (req, res) => {
  try {
    const { visitorId } = req.query;

    if (!visitorId) {
      return res.status(400).json({ error: 'Missing visitorId' });
    }

    const summary = readSummary();
    const data = summary[visitorId];

    if (!data) {
      // Return empty progress
      return res.json({
        visitorId,
        xp: 0,
        streak: 0,
        completed: {},
        scores: {},
        wrongAnswers: {}
      });
    }

    return res.json(data);
  } catch (e) {
    console.error('GET /api/progress error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin - Get all progress data (admin dashboard)
// Returns: { visitors: [{visitorId, lastActive, xp, lessonsCompleted, accuracy, history: [...]}] }
router.get('/api/admin', (req, res) => {
  try {
    const summary = readSummary();
    const history = readProgress();

    // Transform summary into admin-friendly format
    const visitors = Object.entries(summary).map(([visitorId, data]) => {
      const completedCount = Object.keys(data.completed || {}).length;
      const totalScore = Object.values(data.scores || {}).reduce((sum, s) => sum + s.correct, 0);
      const totalQuestions = Object.values(data.scores || {}).reduce((sum, s) => sum + s.total, 0);
      const accuracy = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

      return {
        visitorId,
        lastActive: data.lastActive || 'Unknown',
        xp: data.xp || 0,
        streak: data.streak || 0,
        lessonsCompleted: completedCount,
        accuracy: accuracy + '%',
        history: history.filter(h => h.visitorId === visitorId).slice(-10) // Last 10 attempts
      };
    });

    return res.json({
      totalVisitors: visitors.length,
      totalAttempts: history.length,
      visitors: visitors.sort((a, b) => (b.xp || 0) - (a.xp || 0))
    });
  } catch (e) {
    console.error('GET /api/admin error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Health check
router.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==========================================
// STANDALONE SERVER SETUP
// ==========================================

function startStandalone(port = 3002) {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use((req, res, next) => {
    // CORS for same-origin
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Mount router
  app.use(router);

  // Error handler
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(port, () => {
    console.log(`Progress API server listening on port ${port}`);
    console.log(`Data directory: ${DATA_DIR}`);
  });
}

// ==========================================
// EXPORTS
// ==========================================

module.exports = router;
module.exports.startStandalone = startStandalone;
module.exports.ensureDataDir = ensureDataDir;

// If run directly, start standalone server
if (require.main === module) {
  const port = process.env.PORT || 3002;
  startStandalone(port);
}
