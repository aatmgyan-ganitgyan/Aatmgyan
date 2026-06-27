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

router.post('/start', verifyToken, async (req, res) => {
  try {
    const { test_id } = req.body;
    const student_id = req.user.id;

    const testRes = await pool.query(
      'SELECT * FROM tests WHERE id = $1 AND is_published = true',
      [test_id]
    );
    if (testRes.rows.length === 0)
      return res.status(404).json({ error: 'Test nahi mila!' });
    const test = testRes.rows[0];

    const existing = await pool.query(
      `SELECT * FROM attempts WHERE test_id = $1 AND student_id = $2 AND status = 'in_progress'`,
      [test_id, student_id]
    );

    let attempt;
    if (existing.rows.length > 0) {
      attempt = existing.rows[0];
    } else {
      const newAttempt = await pool.query(
        `INSERT INTO attempts (test_id, student_id, status) VALUES ($1, $2, 'in_progress') RETURNING *`,
        [test_id, student_id]
      );
      attempt = newAttempt.rows[0];
    }

    const questions = await pool.query(
      `SELECT id, question_text, question_type, opt_a, opt_b, opt_c, opt_d, marks
       FROM questions WHERE test_id = $1 ORDER BY id`,
      [test_id]
    );

    res.json({ attempt, test, questions: questions.rows });
  } catch (error) {
    console.error('Start attempt error:', error);
    res.status(500).json({ error: 'Server error aaya!' });
  }
});

router.post('/submit', verifyToken, async (req, res) => {
  try {
    const { attempt_id, responses } = req.body;

    const attemptRes = await pool.query(
      `SELECT a.*, t.negative_marking FROM attempts a 
       JOIN tests t ON a.test_id = t.id WHERE a.id = $1`,
      [attempt_id]
    );
    if (attemptRes.rows.length === 0)
      return res.status(404).json({ error: 'Attempt nahi mila!' });
    const attempt = attemptRes.rows[0];

    // Pehle purane responses delete karo (agar koi hai)
    await pool.query('DELETE FROM responses WHERE attempt_id = $1', [attempt_id]);

    let score = 0, correct = 0, wrong = 0, skipped = 0;

    for (const r of responses) {
      const qRes = await pool.query(
        'SELECT * FROM questions WHERE id = $1',
        [r.question_id]
      );
      if (qRes.rows.length === 0) continue;
      const q = qRes.rows[0];

      let is_correct = false;
      let marks_obtained = 0;

      if (!r.selected_opt) {
        skipped++;
      } else if (r.selected_opt === q.correct_opt) {
        is_correct = true;
        marks_obtained = q.marks;
        score += q.marks;
        correct++;
      } else {
        wrong++;
        if (attempt.negative_marking === 'yes') {
          marks_obtained = -(q.marks / 4);
          score -= q.marks / 4;
        }
      }

      await pool.query(
        `INSERT INTO responses (attempt_id, question_id, selected_opt, is_correct, marks_obtained)
         VALUES ($1, $2, $3, $4, $5)`,
        [attempt_id, r.question_id, r.selected_opt || null, is_correct, marks_obtained]
      );
    }

    const total = responses.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    await pool.query(
      `UPDATE attempts SET status = 'completed', score = $1, submitted_at = NOW() WHERE id = $2`,
      [score, attempt_id]
    );

    res.json({
      message: 'Test submit ho gaya!',
      result: { score, correct, wrong, skipped, total, percentage }
    });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ error: 'Server error aaya!' });
  }
});

router.get('/:attemptId/result', verifyToken, async (req, res) => {
  try {
    const { attemptId } = req.params;
    const result = await pool.query(
      `SELECT r.*, q.question_text, q.opt_a, q.opt_b, q.opt_c, q.opt_d, 
              q.correct_opt, q.explanation
       FROM responses r 
       JOIN questions q ON r.question_id = q.id
       WHERE r.attempt_id = $1 ORDER BY q.id`,
      [attemptId]
    );
    res.json({ responses: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Server error aaya!' });
  }
});

module.exports = router;