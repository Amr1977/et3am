import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { pool } from '../database';
import { sendTelegramMessage } from '../services/telegram';

const router = Router();

router.post('/link-telegram', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.body;
    
    if (!chatId) {
      res.status(400).json({ message: 'chatId is required' });
      return;
    }

    await pool.query(
      'UPDATE users SET telegram_chat_id = $1 WHERE id = $2',
      [chatId, req.userId]
    );

    await sendTelegramMessage(chatId, '🎉 *Telegram Linked!*\n\nYou will now receive notifications about:\n• New donations available\n• Your reservation confirmations\n• Donation status updates\n\nThank you for being part of Et3am! 🕌');

    res.json({ success: true, message: 'Telegram account linked successfully' });
  } catch (error) {
    console.error('Link telegram error:', error);
    res.status(500).json({ message: 'Failed to link telegram account' });
  }
});

router.delete('/unlink-telegram', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query(
      'UPDATE users SET telegram_chat_id = NULL WHERE id = $1',
      [req.userId]
    );

    res.json({ success: true, message: 'Telegram account unlinked successfully' });
  } catch (error) {
    console.error('Unlink telegram error:', error);
    res.status(500).json({ message: 'Failed to unlink telegram account' });
  }
});

export default router;
