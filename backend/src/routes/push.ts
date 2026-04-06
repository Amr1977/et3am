import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import pushService from '../services/push';
import { emitToUser } from '../config/socket';

const router = Router();

router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: pushService.vapidPublicKey });
});

router.post('/subscribe', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const subscription = req.body;
    if (!subscription?.endpoint || !subscription?.keys) {
      res.status(400).json({ messageKey: 'validation.invalid_input' });
      return;
    }

    await pushService.saveSubscription(req.userId!, subscription);
    res.json({ messageKey: 'push.subscribed' });
  } catch (err) {
    console.error('Push subscribe error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.delete('/unsubscribe', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { endpoint } = req.body;
    await pushService.removeSubscription(req.userId!, endpoint);
    res.json({ messageKey: 'push.unsubscribed' });
  } catch (err) {
    console.error('Push unsubscribe error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

export default router;