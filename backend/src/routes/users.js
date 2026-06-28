const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Token nahi mila!' });
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token galat hai!' });
  }
};

// ── LEADERBOARD ──────────────────────────────────
router.get('/leaderboard', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.xp, u.streak,
              COUNT(a.id) as total_tests,
              COALESCE(MAX(a.score), 0) as best_score
       FROM users u
       LEFT JOIN attempts a ON u.id = a.student_id AND a.status = 'completed'
       WHERE u.role = 'student'
       GROUP BY u.id, u.name, u.xp, u.streak
       ORDER BY u.xp DESC, total_tests DESC
       LIMIT 20`,
    );
    res.json({ leaderboard: result.rows });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Server error aaya!' });
  }
});

// ── MY PROFILE ───────────────────────────────────
router.get('/me', verifyToken, async (req, res) => {
  try {
    const userRes = await pool.query(
      'SELECT id, name, email, role, xp, streak FROM users WHERE id = $1',
      [req.user.id]
    );
    const badgesRes = await pool.query(
      'SELECT badge_type, earned_at FROM badges WHERE user_id = $1 ORDER BY earned_at DESC',
      [req.user.id]
    );
    res.json({ user: userRes.rows[0], badges: badgesRes.rows });
  } catch (error) {
    res.status(500).json({ error: 'Server error aaya!' });
  }
});

module.exports = router;