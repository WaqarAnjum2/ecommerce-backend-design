import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { cacheMiddleware, storeInCache } from '../middleware/cache.js';

const router = Router();

// GET /api/categories — Returns all categories, cached in Redis for 24 hours
router.get('/', cacheMiddleware('cache:categories', 86400), async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    
    await storeInCache(res, categories);
    res.json(categories);
  } catch (err) {
    console.error('GET /api/categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
