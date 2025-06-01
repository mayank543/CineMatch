import express from 'express';
import axios from 'axios';
import qs from 'querystring'; // to encode form data
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();


// ✅ Step 1: Start OAuth flow — redirect to Google
router.get('/auth/google', (req, res) => {
  const redirectUri = 'https://accounts.google.com/o/oauth2/v2/auth?' +
    qs.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email',
      access_type: 'offline',
      prompt: 'consent',
    });

  res.redirect(redirectUri);
});


// ✅ Step 2: Handle OAuth callback
router.get('/api/oauth2callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('No code provided');
  }

  try {
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

    // TODO: Save access_token and refresh_token if needed

    return res.redirect('http://localhost:5173/calendar-connected');
  } catch (error) {
    console.error('OAuth error:', error.response?.data || error.message);
    return res.status(500).send('OAuth2 callback failed');
  }
});

export default router;