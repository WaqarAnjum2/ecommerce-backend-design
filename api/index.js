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
import inquiriesRouter from './routes/inquiries.js';
import { rateLimit } from './middleware/rateLimit.js';

const app = express();
const apiRouter = express.Router();

// ── Middleware ──────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Diagnostic request logger (temporary) ───────────────────────
app.use((req, res, next) => {
  try {
    console.log('[api] %s %s', req.method, req.originalUrl);
  } catch (e) {
    // ignore
  }
  next();
});

// Security headers
app.use(helmet());

// CORS — allow origins via env `ALLOWED_ORIGINS` (comma-separated)
const localOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];
const vercelOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
const defaultAllowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://ecommerce-backend-design-79rt.vercel.app', vercelOrigin].filter(Boolean)
  : [];
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const effectiveOrigins = Array.from(new Set([
  ...(allowedOrigins.length > 0 ? allowedOrigins : defaultAllowedOrigins),
  ...localOrigins,
]));
const corsOptions = {};
if (effectiveOrigins.length > 0) {
  corsOptions.origin = (origin, callback) => {
    if (!origin) return callback(null, true);
    if (effectiveOrigins.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error('CORS blocked by policy'), false);
  };
} else {
  // no origins specified — allow all (useful for local/dev)
  corsOptions.origin = true;
}
app.use(cors(corsOptions));

// ── Routes ─────────────────────────────────────────────────────
// Skip rate limiting in development to prevent issues with React StrictMode double renders
const publicRateLimit = process.env.NODE_ENV === 'production' 
  ? rateLimit({ keyPrefix: 'ratelimit:public', windowSeconds: 60, max: 60 })
  : (req, res, next) => next();

apiRouter.use('/categories', publicRateLimit, categoriesRouter);
apiRouter.use('/products', publicRateLimit, productsRouter);
apiRouter.use('/auth', publicRateLimit, authRouter);
apiRouter.use('/inquiries', publicRateLimit, inquiriesRouter);
apiRouter.use('/orders', ordersRouter);
apiRouter.use('/profiles', profilesRouter);

// ── Health check ───────────────────────────────────────────────
apiRouter.get('/health', publicRateLimit, (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ── Diagnostics: list mounted routes (temporary) ─────────────────
app.get('/__routes', (req, res) => {
  try {
    const routes = [];
    app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        // routes registered directly on the app
        const methods = Object.keys(middleware.route.methods).join(',');
        routes.push({ path: middleware.route.path, methods });
      } else if (middleware.name === 'router' && middleware.handle && middleware.handle.stack) {
        // router middleware
        middleware.handle.stack.forEach((handler) => {
          if (handler.route) {
            const methods = Object.keys(handler.route.methods).join(',');
            routes.push({ path: handler.route.path, methods });
          }
        });
      }
    });
    res.json({ routes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to enumerate routes', detail: String(err) });
  }
});

// ── API 404 handler ────────────────────────────────────────────
apiRouter.use((req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Mount API router for environments that preserve or strip /api
app.use('/api', apiRouter);
app.use('/', apiRouter);

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
const handler = process.env.VERCEL ? app : serverless(app);
export default handler;

// ── Local development server ───────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 API server running at http://localhost:${PORT}/api`);
  });
}
