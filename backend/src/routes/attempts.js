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

// ── START ATTEMPT ──────────────────────────────
router.post('/start', verifyToken, async (req, res) => {
  try {
    const { test_id } = req.body;
    if (!test_id) return res.status(400).json({ error: 'Test ID zaroori hai!' });

    // Check test exists
    const test = await pool.query(
      'SELECT * FROM tests WHERE id = $1 AND is_published = true', [test_id]
    );
    if (test.rows.length === 0) {
      return res.status(404).json({ error: 'Test nahi mila!' });
    }

    // Check already attempted
    const existing = await pool.query(
      'SELECT * FROM attempts WHERE student_id = $1 AND test_id = $2 AND status = $3',
      [req.user.id, test_id, 'ongoing']
    );
    if (existing.rows.length > 0) {
      return res.json({ message: 'Test pehle se chal raha hai!', attempt: existing.rows[0] });
    }

    // Create attempt
    const result = await pool.query(
      `INSERT INTO attempts (student_id, test_id, status)
       VALUES ($1, $2, 'ongoing') RETURNING *`,
      [req.user.id, test_id]
    );

    // Get questions (without correct answers)
    const questions = await pool.query(
      `SELECT id, question_text, question_type, opt_a, opt_b, opt_c, opt_d, marks, difficulty
       FROM questions WHERE test_id = $1`,
      [test_id]
    );

    res.status(201).json({
      message: 'Test shuru ho gaya! All the best! 🎯',
      attempt: result.rows[0],
      test: test.rows[0],
      questions: questions.rows
    });
  } catch (error) {
    console.error('Start attempt error:', error);
    res.status(500).json({ error: 'Server error aaya!' });
  }
});

// ── SUBMIT ATTEMPT ─────────────────────────────
router.post('/submit', verifyToken, async (req, res) => {
  try {
    const { attempt_id, responses } = req.body;
    if (!attempt_id || !responses) {
      return res.status(400).json({ error: 'Attempt ID aur responses zaroori hain!' });
    }

    // Get attempt
    const attempt = await pool.query(
      'SELECT * FROM attempts WHERE id = $1 AND student_id = $2',
      [attempt_id, req.user.id]
    );
    if (attempt.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt nahi mila!' });
    }

    // Get correct answers
    const questions = await pool.query(
      'SELECT id, correct_opt, marks FROM questions WHERE test_id = $1',
      [attempt.rows[0].test_id]
    );

    // Calculate score
    let score = 0, correct = 0, wrong = 0, skipped = 0;
    const negativeMarking = 0.25;

    for (const question of questions.rows) {
      const response = responses.find(r => r.question_id === question.id);
      if (!response || !response.selected_opt) {
        skipped++;
        await pool.query(
          `INSERT INTO responses (attempt_id, question_id, selected_opt, is_correct)
           VALUES ($1, $2, NULL, false)`,
          [attempt_id, question.id]
        );
      } else if (response.selected_opt === question.correct_opt) {
        correct++;
        score += question.marks;
        await pool.query(
          `INSERT INTO responses (attempt_id, question_id, selected_opt, is_correct)
           VALUES ($1, $2, $3, true)`,
          [attempt_id, question.id, response.selected_opt]
        );
      } else {
        wrong++;
        score -= question.marks * negativeMarking;
        await pool.query(
          `INSERT INTO responses (attempt_id, question_id, selected_opt, is_correct)
           VALUES ($1, $2, $3, false)`,
          [attempt_id, question.id, response.selected_opt]
        );
      }
    }

    // Update attempt
    await pool.query(
      `UPDATE attempts SET 
       submitted_at = NOW(), score = $1, correct = $2, 
       wrong = $3, skipped = $4, status = 'completed'
       WHERE id = $5`,
      [score, correct, wrong, skipped, attempt_id]
    );

    res.json({
      message: 'Test submit ho gaya! 🎉',
      result: { score, correct, wrong, skipped,
        total: questions.rows.length,
        percentage: Math.round((score / (questions.rows.length * 4)) * 100)
      }
    });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ error: 'Server error aaya!' });
  }
});

// ── GET RESULT ─────────────────────────────────
router.get('/:attemptId/result', verifyToken, async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await pool.query(
      'SELECT * FROM attempts WHERE id = $1 AND student_id = $2',
      [attemptId, req.user.id]
    );
    if (attempt.rows.length === 0) {
      return res.status(404).json({ error: 'Result nahi mila!' });
    }

    const responses = await pool.query(
      `SELECT r.*, q.question_text, q.correct_opt, q.explanation,
       q.opt_a, q.opt_b, q.opt_c, q.opt_d
       FROM responses r
       JOIN questions q ON r.question_id = q.id
       WHERE r.attempt_id = $1`,
      [attemptId]
    );

    res.json({
      attempt: attempt.rows[0],
      responses: responses.rows
    });
  } catch (error) {
    console.error('Get result error:', error);
    res.status(500).json({ error: 'Server error aaya!' });
  }
});

module.exports = router;