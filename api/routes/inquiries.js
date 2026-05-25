import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyToken, requireAdmin, optionalVerifyToken } from '../middleware/auth.js';

const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '..', 'data');
const filePath = path.join(dataDir, 'inquiries.json');

const ensureDataDir = () => {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '[]');
  } catch (err) {
    console.error('Failed to ensure data dir for inquiries:', err);
  }
};

router.post('/', optionalVerifyToken, async (req, res) => {
  try {
    ensureDataDir();
    const { subject, details, quantity, unit } = req.body || {};
    if (!subject || !details) {
      return res.status(400).json({ error: 'subject and details are required' });
    }

    const createdAt = new Date().toISOString();
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      subject: String(subject).slice(0, 250),
      details: String(details).slice(0, 2000),
      quantity: quantity || null,
      unit: unit || null,
      userId: req.user?.id || null,
      userEmail: req.user?.email || null,
      status: 'new',
      createdAt,
      updatedAt: createdAt,
    };

    const raw = fs.readFileSync(filePath, 'utf8');
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2));

    // In production you might send an email/notification to admin here.
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('POST /api/inquiries error:', err);
    res.status(500).json({ error: 'Failed to save inquiry' });
  }
});

// Admin: list inquiries
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    ensureDataDir();
    const raw = fs.readFileSync(filePath, 'utf8');
    const list = raw ? JSON.parse(raw) : [];
    res.json(list);
  } catch (err) {
    console.error('GET /api/inquiries error:', err);
    res.status(500).json({ error: 'Failed to load inquiries' });
  }
});

// Public: list all inquiries (read-only) - useful for debugging or public view
router.get('/public', async (req, res) => {
  try {
    ensureDataDir();
    const raw = fs.readFileSync(filePath, 'utf8');
    const list = raw ? JSON.parse(raw) : [];
    // return a sanitized view (omit userEmail)
    const view = list.map(({ id, subject, details, quantity, unit, status, createdAt, updatedAt }) => ({ id, subject, details, quantity, unit, status, createdAt, updatedAt }));
    res.json(view);
  } catch (err) {
    console.error('GET /api/inquiries/public error:', err);
    res.status(500).json({ error: 'Failed to load inquiries' });
  }
});

// Authenticated user: list their own inquiries
router.get('/mine', verifyToken, async (req, res) => {
  try {
    ensureDataDir();
    const raw = fs.readFileSync(filePath, 'utf8');
    const list = raw ? JSON.parse(raw) : [];
    const mine = list.filter((i) => i.userId === req.user.id);
    res.json(mine);
  } catch (err) {
    console.error('GET /api/inquiries/mine error:', err);
    res.status(500).json({ error: 'Failed to load inquiries' });
  }
});

// Admin: update inquiry (e.g., status)
router.patch('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    ensureDataDir();
    const id = req.params.id;
    const { status } = req.body || {};
    const allowed = ['new', 'open', 'in_progress', 'closed', 'resolved'];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const list = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((i) => i.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    if (status) list[idx].status = status;
    list[idx].updatedAt = new Date().toISOString();

    fs.writeFileSync(filePath, JSON.stringify(list, null, 2));
    res.json({ success: true, inquiry: list[idx] });
  } catch (err) {
    console.error('PATCH /api/inquiries/:id error:', err);
    res.status(500).json({ error: 'Failed to update inquiry' });
  }
});

// Admin: delete an inquiry by id
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    ensureDataDir();
    const id = req.params.id;
    const raw = fs.readFileSync(filePath, 'utf8');
    const list = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((i) => i.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    list.splice(idx, 1);
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2));
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/inquiries/:id error:', err);
    res.status(500).json({ error: 'Failed to delete inquiry' });
  }
});

export default router;
