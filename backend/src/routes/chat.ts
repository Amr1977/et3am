import { Router, Response } from 'express';
import { dbOps } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/:donationId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const donation = await dbOps.donations.findById(req.params.donationId);
    if (!donation) {
      res.status(404).json({ messageKey: 'donation.not_found' });
      return;
    }

    const isParticipant = donation.donor_id === req.userId || donation.reserved_by === req.userId;
    if (!isParticipant) {
      res.status(403).json({ messageKey: 'auth.unauthorized' });
      return;
    }

    const messages = await dbOps.chat.findByDonation(req.params.donationId);
    res.json({ messages });
  } catch (err) {
    console.error('Get chat messages error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.post('/:donationId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body;
    if (!message || message.trim() === '') {
      res.status(400).json({ messageKey: 'validation.required_field' });
      return;
    }

    const donation = await dbOps.donations.findById(req.params.donationId);
    if (!donation || donation.status !== 'reserved') {
      res.status(400).json({ messageKey: 'donation.not_available' });
      return;
    }

    const isParticipant = donation.donor_id === req.userId || donation.reserved_by === req.userId;
    if (!isParticipant) {
      res.status(403).json({ messageKey: 'auth.unauthorized' });
      return;
    }

    const receiverId = donation.donor_id === req.userId ? donation.reserved_by : donation.donor_id;
    const savedMessage = await dbOps.chat.create(req.params.donationId, req.userId!, receiverId, message);
    const user = await dbOps.users.findById(req.userId!);
    
    res.json({ 
      message: 'Message sent',
      data: {
        ...savedMessage,
        sender_name: user?.name || 'Unknown',
        sender_avatar: user?.avatar_url || null,
      }
    });
  } catch (err) {
    console.error('Send chat message error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.put('/:donationId/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await dbOps.chat.markAsRead(req.params.donationId, req.userId!);
    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.get('/unread/count', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const count = await dbOps.chat.getUnreadCount(req.userId!);
    res.json({ unreadCount: count });
  } catch (err) {
    console.error('Unread count error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

export default router;