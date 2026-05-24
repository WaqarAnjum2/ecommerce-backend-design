// JWT Authentication middleware using Supabase JWT secret
import '../config/env.js';
import jwt from 'jsonwebtoken';
import { createPublicKey } from 'crypto';
import prisma from '../lib/prisma.js';

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const JWKS_CACHE_TTL_MS = 60 * 60 * 1000;
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
    const header = jwt.decode(token, { complete: true })?.header;
    if (!header?.alg) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    let decoded;
    if (header.alg.startsWith('HS')) {
      if (!JWT_SECRET) {
        return res.status(500).json({ error: 'JWT secret not configured' });
      }

      try {
        // Try verifying with the raw secret string
        decoded = jwt.verify(token, JWT_SECRET, { algorithms: [header.alg] });
      } catch (verifyErr) {
        // If that fails, try decoding the secret as base64 (common for Supabase JWT secrets)
        const secretBuffer = Buffer.from(JWT_SECRET, 'base64');
        decoded = jwt.verify(token, secretBuffer, { algorithms: [header.alg] });
      }
    } else if (header.alg.startsWith('RS') || header.alg.startsWith('ES')) {
      const publicKey = await getPublicKeyForKid(header.kid);
      decoded = jwt.verify(token, publicKey, { algorithms: [header.alg] });
    } else {
      return res.status(401).json({ error: 'Unsupported token algorithm' });
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
