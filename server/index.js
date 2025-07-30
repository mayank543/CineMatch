import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import moviesRoute from './routes/movies.js';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://cine-match-fjmq.vercel.app'
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

app.use(express.json());

app.use('/api/movies', moviesRoute);

app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working with CORS enabled!' });
});

// Important for Render to not show "Bad Gateway"
app.get('/', (req, res) => {
  res.send('CineMatch backend is running 🚀');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error', message: err.message });
});

// Always use process.env.PORT on Render!
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ CORS enabled for: ${allowedOrigins.join(', ')}`);
});