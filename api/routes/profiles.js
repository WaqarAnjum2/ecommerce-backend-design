import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken);

// GET /api/profiles/me — Fetch profile of the logged-in user
router.get('/me', async (req, res) => {
  try {
    let profile = await prisma.profile.findUnique({
      where: { id: req.user.id },
    });
    
    // Auto-create profile if missing (defensive fallback for existing auth users)
    if (!profile) {
      const email = req.user.email || '';
      const isAdmin = email === 'forlaptop71r172@gmail.com';
      profile = await prisma.profile.create({
        data: {
          id: req.user.id,
          email: email,
          fullName: email ? email.split('@')[0] : 'User',
          isAdmin: isAdmin,
        },
      });
    }
    
    res.json(profile);
  } catch (err) {
    console.error('GET /api/profiles/me error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/profiles/me — Update profile details (Name, Avatar)
router.put('/me', async (req, res) => {
  try {
    const { fullName, avatarUrl } = req.body;
    const profile = await prisma.profile.update({
      where: { id: req.user.id },
      data: {
        fullName: fullName !== undefined ? fullName : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
      },
    });
    res.json(profile);
  } catch (err) {
    console.error('PUT /api/profiles/me error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
