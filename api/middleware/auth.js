// JWT Authentication middleware using Supabase JWT secret
import '../config/env.js';
import jwt from 'jsonwebtoken';
import { createPublicKey } from 'crypto';
import prisma from '../lib/prisma.js';

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const JWKS_CACHE_TTL_MS = 60 * 60 * 1000;
const HS_ALGORITHMS = ['HS256', 'HS384', 'HS512'];
const ASYMMETRIC_ALGORITHMS = ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512', 'EdDSA'];
let jwksCache = { keys: null, expiresAt: 0 };

async function getJwksKeys() {
  if (jwksCache.keys && Date.now() < jwksCache.expiresAt) {
    return jwksCache.keys;
  }

  if (!SUPABASE_URL) {
    throw new Error('SUPABASE_URL is not configured');
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`);
  if (!response.ok) {
    throw new Error('Failed to fetch JWKS');
  }

  const data = await response.json();
  jwksCache = {
    keys: Array.isArray(data.keys) ? data.keys : [],
    expiresAt: Date.now() + JWKS_CACHE_TTL_MS,
  };

  return jwksCache.keys;
}

async function getPublicKeyForKid(kid) {
  const keys = await getJwksKeys();
  const jwk = keys.find((k) => k.kid === kid);
  if (!jwk) {
    throw new Error('JWKS key not found for token');
  }
  return createPublicKey({ key: jwk, format: 'jwk' });
}

async function verifyWithSecret(token) {
  if (!JWT_SECRET) {
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: HS_ALGORITHMS });
  } catch (err) {
    // Retry with base64-decoded secret when Supabase provides base64 values
    try {
      const secretBuffer = Buffer.from(JWT_SECRET, 'base64');
      return jwt.verify(token, secretBuffer, { algorithms: HS_ALGORITHMS });
    } catch (innerErr) {
      return null;
    }
  }
}

async function verifyWithJwks(token) {
  const header = jwt.decode(token, { complete: true })?.header;
  if (!header?.kid) {
    return null;
  }

  const publicKey = await getPublicKeyForKid(header.kid);
  return jwt.verify(token, publicKey, { algorithms: ASYMMETRIC_ALGORITHMS });
}

/**
 * Middleware: verifyToken
 * Extracts and verifies Supabase JWT from Authorization header.
 * Attaches req.user = { id, email } on success.
 */
export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    let decoded = await verifyWithSecret(token);

    if (!decoded) {
      decoded = await verifyWithJwks(token);
    }

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = {
      id: decoded.sub,      // Supabase stores user UUID in 'sub' claim
      email: decoded.email,
    };
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware: requireAdmin
 * Must be used AFTER verifyToken.
 * Checks that the authenticated user has is_admin = true in profiles table.
 */
export async function requireAdmin(req, res, next) {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: req.user.id },
      select: { isAdmin: true },
    });

    if (!profile || !profile.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify admin status' });
  }
}
