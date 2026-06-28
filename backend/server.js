require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./src/routes/auth');
const testRoutes = require('./src/routes/tests');
const attemptRoutes = require('./src/routes/attempts');
const userRoutes = require('./src/routes/users');

const app = express();

app.use(express.json());
app.use(helmet());
app.use(cors({ origin: '*' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Bahut saari requests! Thoda ruko.' }
});
app.use('/api/', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.json({
    message: '🪔 Aatmgyan Backend Chal Raha Hai!',
    version: '1.0.0',
    status: 'active'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route nahi mila' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error aaya' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Aatmgyan Server port ${PORT} pe chal raha hai!`);
});