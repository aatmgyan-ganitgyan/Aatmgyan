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

router.post('/create', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Sirf teacher test bana sakta hai!' });
    }
    const { title, subject, class: cls, duration, negative_marking } = req.body;
    if (!title) return res.status(400).json({ error: 'Title zaroori hai!' });
    const result = await pool.query(
      `INSERT INTO tests (title, subject, "class", duration, negative_marking, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, subject, cls, duration || 30, negative_marking || 'no', req.user.id]
    );
    res.status(201).json({ message: 'Test create ho gaya!', test: result.rows[0] });
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({ error: 'Server error aaya!' });
  }
});

router.post('/:testId/questions', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Sirf teacher question add kar sakta hai!' });
    }
    const { testId } = req.params;
    const { question_text, question_type, opt_a, opt_b, opt_c, opt_d, correct_opt, explanation, marks, difficulty } = req.body;
    if (!question_text || !correct_opt) {
      return res.status(400).json({ error: 'Question aur correct answer zaroori hai!' });
    }
    const result = await pool.query(
      `INSERT INTO questions (test_id, question_text, question_type, opt_a, opt_b, opt_c, opt_d, correct_opt, explanation, marks, difficulty)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [testId, question_text, question_type || 'mcq', opt_a, opt_b, opt_c, opt_d, correct_opt, explanation, marks || 4, difficulty || 'medium']
    );
    res.status(201).json({ message: 'Question add ho gaya!', question: result.rows[0] });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ error: 'Server error aaya!' });
  }
});

router.put('/questions/:questionId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Sirf teacher edit kar sakta hai!' });
    }
    const { questionId } = req.params;
    const { question_text, opt_a, opt_b, opt_c, opt_d, correct_opt, explanation, marks, difficulty } = req.body;
    const result = await pool.query(
      `UPDATE questions SET 
       question_text = $1, opt_a = $2, opt_b = $3, opt_c = $4, opt_d = $5,
       correct_opt = $6, explanation = $7, marks = $8, difficulty = $9
       WHERE id = $10 RETURNING *`,
      [question_text, opt_a, opt_b, opt_c, opt_d, correct_opt, explanation, marks, difficulty, questionId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question nahi mila!' });
    }
    res.json({ message: 'Question update ho gaya!', question: result.rows[0] });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Server error aaya!' });
  }
});

router.delete('/questions/:questionId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Sirf teacher delete kar sakta hai!' });
    }
    const { questionId } = req.params;
    await pool.query('DELETE FROM questions WHERE id = $1', [questionId]);
    res.json({ message: 'Question delete ho gaya!' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Server error aaya!' });
  }
});

router.get('/my-tests', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM tests WHERE created_by = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ tests: result.rows });
  } catch (error) {
    console.error('Get my tests error:', error);
    res.status(500).json({ error: 'Server error aaya!' });
  }
});

router.get('/available', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.name as teacher_name FROM tests t 
       JOIN users u ON t.created_by = u.id
       WHERE t.is_published = true ORDER BY t.created_at DESC`
    );
    res.json({ tests: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Server error aaya!' });
  }
});

router.put('/:testId/publish', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Sirf teacher publish kar sakta hai!' });
    }
    const { testId } = req.params;
    await pool.query('UPDATE tests SET is_published = true WHERE id = $1', [testId]);
    res.json({ message: 'Test publish ho gaya!' });
  } catch (error) {
    res.status(500).json({ error: 'Server error aaya!' });
  }
});

router.get('/:testId/analytics', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Sirf teacher dekh sakta hai!' });
    }
    const { testId } = req.params;

    const statsRes = await pool.query(
      `SELECT 
         COUNT(*) as total_attempts,
         ROUND(AVG(score::numeric), 1) as avg_score,
         MAX(score) as max_score,
         MIN(score) as min_score
       FROM attempts 
       WHERE test_id = $1 AND status = 'completed'`,
      [testId]
    );

    const topperRes = await pool.query(
      `SELECT u.name, a.score, a.submitted_at
       FROM attempts a
       JOIN users u ON a.student_id = u.id
       WHERE a.test_id = $1 AND a.status = 'completed'
       ORDER BY a.score DESC, a.submitted_at ASC
       LIMIT 5`,
      [testId]
    );

    const questionsRes = await pool.query(
      `SELECT COUNT(*) as total_questions, COALESCE(SUM(marks), 0) as max_score
       FROM questions WHERE test_id = $1`,
      [testId]
    );

    res.json({
      stats: statsRes.rows[0],
      toppers: topperRes.rows,
      meta: questionsRes.rows[0],
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Server error aaya!' });
  }
});

router.get('/:testId', verifyToken, async (req, res) => {
  try {
    const { testId } = req.params;
    const test = await pool.query('SELECT * FROM tests WHERE id = $1', [testId]);
    if (test.rows.length === 0) return res.status(404).json({ error: 'Test nahi mila!' });
    const questions = await pool.query(
      `SELECT * FROM questions WHERE test_id = $1`, [testId]
    );
    res.json({ test: test.rows[0], questions: questions.rows });
  } catch (error) {
    res.status(500).json({ error: 'Server error aaya!' });
  }
});

module.exports = router;