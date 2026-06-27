import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import notificationService from '../services/notifications';
import logger from '../config/logger';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await notificationService.getForUser(req.userId!, page, limit);
    res.json(result);
  } catch (err) {
    logger.error('[Notifications] List error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.get('/unread-count', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const count = await notificationService.getUnreadCount(req.userId!);
    res.json({ count });
  } catch (err) {
    logger.error('[Notifications] Unread count error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await notificationService.markAsRead(req.params.id, req.userId!);
    res.json({ success: true });
  } catch (err) {
    logger.error('[Notifications] Mark read error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.put('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await notificationService.markAllAsRead(req.userId!);
    res.json({ success: true });
  } catch (err) {
    logger.error('[Notifications] Mark all read error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

export default router;
