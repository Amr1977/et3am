import { Router, Request, Response } from 'express';
import { dbOps } from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();

function generateFingerprint(stackTrace?: string, message?: string): string | null {
  if (!stackTrace && !message) return null;
  const base = stackTrace || message || '';
  const normalized = base.split('\n').slice(0, 5).join('\n').substring(0, 500);
  return crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 64);
}

router.post('/crash', async (req: Request, res: Response) => {
  try {
    const {
      crash_type,
      severity,
      title,
      message,
      stack_trace,
      user_id,
      session_id,
      url,
      metadata
    } = req.body;

    if (!crash_type || !title) {
      res.status(400).json({ error: 'crash_type and title are required' });
      return;
    }

    if (!['frontend', 'backend'].includes(crash_type)) {
      res.status(400).json({ error: 'crash_type must be frontend or backend' });
      return;
    }

    const fingerprint = generateFingerprint(stack_trace, message);
    
    const crashId = await dbOps.crashLogs.create({
      crash_type,
      severity: severity || 'error',
      title,
      message,
      stack_trace,
      user_id,
      session_id,
      user_agent: req.headers['user-agent'],
      url,
      metadata,
      fingerprint
    });

    const admins = await dbOps.users.findAdmins();
    
    if (admins.length > 0 && process.env.SOCKET_PORT) {
      try {
        const { io } = await import('../index.js');
        if (io) {
          admins.forEach(admin => {
            io.to(`admin:${admin.id}`).emit('crash:new', {
              id: crashId,
              crash_type,
              severity: severity || 'error',
              title,
              message,
              created_at: new Date().toISOString()
            });
          });
        }
      } catch (e) {
        console.error('Failed to emit crash notification:', e);
      }
    }

    res.status(201).json({ id: crashId, fingerprint });
  } catch (err) {
    console.error('Crash logging error:', err);
    res.status(500).json({ error: 'Failed to log crash' });
  }
});

router.get('/crash', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { crash_type, resolved, page = '1', limit = '50' } = req.query;
    
    const result = await dbOps.crashLogs.findAll({
      crash_type: crash_type as string,
      resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined
    }, parseInt(page as string), parseInt(limit as string));

    res.json(result);
  } catch (err) {
    console.error('Get crash logs error:', err);
    res.status(500).json({ error: 'Failed to fetch crash logs' });
  }
});

router.patch('/crash/:id/resolve', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    if (!adminId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await dbOps.crashLogs.resolve(id, adminId);
    res.json({ success: true });
  } catch (err) {
    console.error('Resolve crash log error:', err);
    res.status(500).json({ error: 'Failed to resolve crash log' });
  }
});

router.get('/crash/stats', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const [frontend, backend, unresolved] = await Promise.all([
      dbOps.crashLogs.countUnresolved('frontend'),
      dbOps.crashLogs.countUnresolved('backend'),
      dbOps.crashLogs.countUnresolved()
    ]);

    res.json({ frontend, backend, total: frontend + backend, unresolved });
  } catch (err) {
    console.error('Get crash stats error:', err);
    res.status(500).json({ error: 'Failed to fetch crash stats' });
  }
});

export default router;