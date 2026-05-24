// Orders API routes — all protected, no caching (private user data)
import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { noCacheHeaders } from '../middleware/cache.js';

const router = Router();

// All order routes require authentication and bypass cache
router.use(noCacheHeaders);
router.use(verifyToken);

// ── GET /api/orders — Current user's order history ─────────────
router.get('/', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                image: true,
                price: true,
              },
            },
          },
        },
      },
    });

    res.json(orders);
  } catch (err) {
    console.error('GET /api/orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ── POST /api/orders — Place a new order ────────────────────────
router.post('/', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Validate each item: { productId, quantity }
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        return res.status(400).json({ error: 'Each item must have productId and quantity >= 1' });
      }
      if (!UUID_REGEX.test(item.productId)) {
        return res.status(400).json({ error: `Invalid product ID format: "${item.productId}"` });
      }
    }

    // Fetch all products in the order to validate stock and get prices
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({ error: 'One or more products not found' });
    }

    // Validate stock availability
    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for "${product.title}". Available: ${product.stock}`,
        });
      }
    }

    // Calculate total
    let totalAmount = 0;
    const orderItemsData = items.map((item) => {
      const product = productMap.get(item.productId);
      const lineTotal = parseFloat(product.price) * item.quantity;
      totalAmount += lineTotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: parseFloat(product.price),
      };
    });

    // Use Prisma interactive transaction to atomically:
    // 1. Create order + items
    // 2. Deduct stock from each product
    // 3. Increment orders_count on each product
    const order = await prisma.$transaction(async (tx) => {
      // Create the order with its items
      const newOrder = await tx.order.create({
        data: {
          userId: req.user.id,
          totalAmount,
          status: 'Pending',
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, title: true, image: true, price: true },
              },
            },
          },
        },
      });

      // Deduct stock and increment orders count for each product
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            orders: { increment: item.quantity },
          },
        });
      }

      return newOrder;
    });

    res.status(201).json(order);
  } catch (err) {
    console.error('POST /api/orders error:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// ── GET /api/orders/all — Fetch all orders (Admin only) ─────────
router.get('/all', requireAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                image: true,
                price: true,
              },
            },
          },
        },
      },
    });
    res.json(orders);
  } catch (err) {
    console.error('GET /api/orders/all error:', err);
    res.status(500).json({ error: 'Failed to fetch all orders' });
  }
});

// ── GET /api/orders/history — Fetch order history records ────────
router.get('/history', async (req, res) => {
  try {
    // Check if user is admin
    const profile = await prisma.profile.findUnique({
      where: { id: req.user.id },
      select: { isAdmin: true },
    });

    const isAdmin = profile?.isAdmin || false;
    const where = isAdmin ? {} : { userId: req.user.id };

    const history = await prisma.orderHistory.findMany({
      where,
      orderBy: { completedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        order: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    title: true,
                    image: true,
                    price: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    res.json(history);
  } catch (err) {
    console.error('GET /api/orders/history error:', err);
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});

// ── PUT /api/orders/:id/status — Update order status (Admin only) ─
router.put('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const VALID_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    // Fetch the order
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
    });

    // If status is updated to 'Delivered', insert/upsert into OrderHistory
    if (status === 'Delivered') {
      await prisma.orderHistory.upsert({
        where: { orderId: id },
        update: {
          status: 'Delivered',
        },
        create: {
          orderId: id,
          userId: order.userId,
          totalAmount: order.totalAmount,
          status: 'Delivered',
        },
      });
    }

    res.json(updatedOrder);
  } catch (err) {
    console.error('PUT /api/orders/:id/status error:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

export default router;
