
<<<<<<< HEAD
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import oauthRoutes from './routes/oauth.js'; // adjust path as needed

import cors from 'cors';
import moviesRoute from './routes/movies.js';
=======
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const moviesRoute = require('./routes/movies');
>>>>>>> 563792455fbb1a8f246001324f0f7437af621e84



const app = express();

<<<<<<< HEAD
app.use('/api', oauthRoutes);

=======
>>>>>>> 563792455fbb1a8f246001324f0f7437af621e84
// IMPORTANT: CORS middleware must be before any routes
app.use(cors({
  origin: ['http://localhost:5173','https://cine-match-fjmq.vercel.app'], // Your frontend URL exactly as shown
  methods: ['GET', 'POST', 'OPTIONS'], // Include OPTIONS for preflight
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false // Change to true if you need to send cookies
}));

// Handle preflight OPTIONS requests explicitly
app.options('*', cors());

// Body parser middleware
app.use(express.json());

// Routes
app.use('/api/movies', moviesRoute);

// Test route to verify server is running and CORS is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working with CORS enabled!' });
});

app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error', message: err.message });
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for origin: http://localhost:5173`);
});