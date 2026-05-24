// Express server entry point — wrapped with serverless-http for Vercel
import './config/env.js';

import express from 'express';
import serverless from 'serverless-http';
import helmet from 'helmet';
import cors from 'cors';

// Import route modules
import categoriesRouter from './routes/categories.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import profilesRouter from './routes/profiles.js';
import authRouter from './routes/auth.js';
import { rateLimit } from './middleware/rateLimit.js';

const app = express();

// ── Middleware ──────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use(helmet());

// CORS — allow origins via env `ALLOWED_ORIGINS` (comma-separated), default to allow all
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const corsOptions = {};
if (allowedOrigins.length > 0) {
  corsOptions.origin = (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error('CORS blocked by policy'), false);
  };
} else {
  // no origins specified — allow all (useful for local/dev)
  corsOptions.origin = true;
}
app.use(cors(corsOptions));

// ── Routes ─────────────────────────────────────────────────────
const publicRateLimit = rateLimit({ keyPrefix: 'ratelimit:public', windowSeconds: 60, max: 60 });

app.use('/api/categories', publicRateLimit, categoriesRouter);
app.use('/api/products', publicRateLimit, productsRouter);
app.use('/api/auth', publicRateLimit, authRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/profiles', profilesRouter);

// ── Health check ───────────────────────────────────────────────
app.get('/api/health', publicRateLimit, (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ── 404 handler ────────────────────────────────────────────────
app.use('/api/*splat', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// ── Global error handler ───────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

// ── Export for Vercel Serverless ────────────────────────────────
export default serverless(app);

// ── Local development server ───────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 API server running at http://localhost:${PORT}/api`);
  });
}
