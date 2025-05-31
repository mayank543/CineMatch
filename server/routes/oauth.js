import express from 'express';
import axios from 'axios';
import qs from 'querystring'; // to encode form data
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('No code provided');
  }

  try {
    // Exchange the code for tokens
    const response = await axios.post(
      'https://oauth2.googleapis.com/token',
      qs.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    // OPTIONAL: Use Clerk session token (e.g., via JWT or header) to associate tokens with a user
    // TODO: Save these tokens to your database tied to the current Clerk user

    // Redirect to frontend (you can add a state or success message)
    return res.redirect('http://localhost:5173/calendar-connected'); // or wherever you want
  } catch (error) {
    console.error('OAuth error:', error.response?.data || error.message);
    return res.status(500).send('OAuth2 callback failed');
  }
});

export default router;