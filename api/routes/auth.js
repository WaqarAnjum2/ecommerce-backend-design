import { Router } from 'express';
import '../config/env.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const buildHeaders = () => ({
  'Content-Type': 'application/json',
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
});

router.post('/login', rateLimit({ keyPrefix: 'ratelimit:auth:login', windowSeconds: 60, max: 5 }), async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(500).json({ error: 'Supabase auth is not configured.' });
    }

    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error_description || data.error || 'Login failed.' });
    }

    return res.json(data);
  } catch (err) {
    console.error('POST /api/auth/login error:', err);
    return res.status(500).json({ error: 'Failed to log in.' });
  }
});

router.post('/register', rateLimit({ keyPrefix: 'ratelimit:auth:register', windowSeconds: 60, max: 5 }), async (req, res) => {
  try {
    const { email, password, fullName } = req.body || {};
    const emailRegex = /[^@\s]+@[^@\s]+\.[^@\s]+/;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(500).json({ error: 'Supabase auth is not configured.' });
    }

    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({
        email,
        password,
        data: fullName ? { full_name: fullName } : {},
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error_description || data.error || 'Registration failed.' });
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error('POST /api/auth/register error:', err);
    return res.status(500).json({ error: 'Failed to register.' });
  }
});

export default router;
