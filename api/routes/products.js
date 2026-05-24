// Products API routes
import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { cacheMiddleware, storeInCache, invalidateCache, noCacheHeaders } from '../middleware/cache.js';

const router = Router();

// ── GET /api/products — Public, cached 1 hour ──────────────────
router.get('/', cacheMiddleware('cache:products:query', 3600), async (req, res) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      rating,
      brand,
      sort,
      page = '1',
      limit = '10',
    } = req.query;

    // Build Prisma where clause
    const where = {};

    if (category) {
      // Accept category slug or UUID (prevent invalid UUID casting error)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
      if (isUuid) {
        where.categoryId = category;
      } else {
        where.category = { is: { slug: category } };
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { desc: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { category: { is: { name: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (rating) {
      where.rating = { gte: parseFloat(rating) };
    }

    if (brand) {
      // Support comma-separated brands: ?brand=Samsung,Apple
      const brands = brand.split(',').map((b) => b.trim());
      where.brand = { in: brands, mode: 'insensitive' };
    }

    // Build orderBy
    let orderBy = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    else if (sort === 'price_desc') orderBy = { price: 'desc' };
    else if (sort === 'rating') orderBy = { rating: 'desc' };
    else if (sort === 'orders_desc') orderBy = { orders: 'desc' };

    // Pagination
    const take = Math.min(parseInt(limit) || 10, 50);
    const skip = ((parseInt(page) || 1) - 1) * take;

    // Execute query and count in parallel
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        take,
        skip,
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const result = {
      products,
      pagination: {
        page: parseInt(page) || 1,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };

    await storeInCache(res, result);
    res.json(result);
  } catch (err) {
    console.error('GET /api/products error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ── GET /api/products/:id — Public, cached 2 hours ─────────────
router.get('/:id', cacheMiddleware('cache:products:detail', 7200), async (req, res) => {
  try {
    // Validate UUID format to prevent database casting exceptions
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id);
    if (!isUuid) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await storeInCache(res, product);
    res.json(product);
  } catch (err) {
    console.error('GET /api/products/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// ── POST /api/products — Admin only, invalidates cache ─────────
router.post('/', noCacheHeaders, verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      title, price, oldPrice, desc, categoryId,
      image, imageUrls, brand, rating, shipping, stock, features,
    } = req.body;

    if (!title || price === undefined) {
      return res.status(400).json({ error: 'title and price are required' });
    }

    // Set first image URL as primary thumbnail if not specified
    const finalImageUrls = Array.isArray(imageUrls) ? imageUrls : [];
    const finalImage = image || (finalImageUrls.length > 0 ? finalImageUrls[0] : null);

    const product = await prisma.product.create({
      data: {
        title,
        price: parseFloat(price),
        oldPrice: oldPrice ? parseFloat(oldPrice) : null,
        desc: desc || null,
        categoryId: categoryId || null,
        image: finalImage,
        imageUrls: finalImageUrls,
        brand: brand || null,
        rating: rating ? parseFloat(rating) : 0.0,
        shipping: shipping || 'Free Shipping',
        stock: stock ? parseInt(stock) : 0,
        features: features || [],
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    // Invalidate all product and category caches
    await invalidateCache('cache:products', 'cache:categories');

    res.status(201).json(product);
  } catch (err) {
    console.error('POST /api/products error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// ── PUT /api/products/:id — Admin only, invalidates cache ────────
router.put('/:id', noCacheHeaders, verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, price, oldPrice, desc, categoryId,
      image, imageUrls, brand, rating, shipping, stock, features,
    } = req.body;

    // Validate product existence
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const finalImageUrls = Array.isArray(imageUrls) ? imageUrls : undefined;
    const finalImage = image !== undefined ? image : (finalImageUrls && finalImageUrls.length > 0 ? finalImageUrls[0] : undefined);

    const product = await prisma.product.update({
      where: { id },
      data: {
        title: title !== undefined ? title : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        oldPrice: oldPrice !== undefined ? (oldPrice ? parseFloat(oldPrice) : null) : undefined,
        desc: desc !== undefined ? desc : undefined,
        categoryId: categoryId !== undefined ? (categoryId || null) : undefined,
        image: finalImage,
        imageUrls: finalImageUrls,
        brand: brand !== undefined ? brand : undefined,
        rating: rating !== undefined ? parseFloat(rating) : undefined,
        shipping: shipping !== undefined ? shipping : undefined,
        stock: stock !== undefined ? parseInt(stock) : undefined,
        features: features !== undefined ? features : undefined,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    // Invalidate caches
    await invalidateCache('cache:products', `cache:products:detail:${id}`, 'cache:categories');

    res.json(product);
  } catch (err) {
    console.error('PUT /api/products/:id error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// ── DELETE /api/products/:id — Admin only, invalidates cache ─────
router.delete('/:id', noCacheHeaders, verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await prisma.product.delete({
      where: { id },
    });

    // Invalidate caches
    await invalidateCache('cache:products', `cache:products:detail:${id}`, 'cache:categories');

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/products/:id error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
