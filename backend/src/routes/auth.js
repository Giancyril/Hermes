const express = require('express');
const jwt = require('jsonwebtoken');
const oauth2Client = require('../config/google');
const { google } = require('googleapis');
// Prisma or DB connection can be imported here once ready
// For now, let's write routes structure with placeholder database logic
const router = express.Router();

const prisma = require('../config/db');

// GET /auth/google
router.get('/google', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });

  res.redirect(url);
});

// GET /auth/callback
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ error: 'Auth code is missing' });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user details
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const email = userInfo.data.email;
    const name = userInfo.data.name;
    const picture = userInfo.data.picture;

    // Upsert User in DB
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, picture },
      create: { email, name, picture }
    });

    // Store OAuth tokens
    if (tokens.access_token) {
      const expiresAt = tokens.expiry_date 
        ? new Date(tokens.expiry_date) 
        : new Date(Date.now() + 3600 * 1000); // fallback 1 hour

      // Delete existing tokens for user to avoid token leakage/multi-tokens
      await prisma.oAuthToken.deleteMany({
        where: { userId: user.id }
      });

      await prisma.oAuthToken.create({
        data: {
          userId: user.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || '', // Google only returns refresh_token on prompt consent
          expiresAt: expiresAt
        }
      });
    }
    
    // Create JWT
    const token = jwt.sign(
      { id: user.id, email, name, picture },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    // Redirect to frontend dashboard with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login/callback?token=${token}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`);
  }
});

// GET /auth/me
router.get('/me', (req, res) => {
  // authMiddleware handles authentication, injects req.user
  res.json({ user: req.user });
});

module.exports = router;
