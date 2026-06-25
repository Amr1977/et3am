import { Router, Response } from 'express';
import { dbOps } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';
import logger from '../config/logger';

const router = Router();

// Request chat endpoints (must come before /:donationId to avoid "request" being matched as donationId)
router.get('/request/:requestId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const request = await dbOps.donationRequests.findById(req.params.requestId);
    if (!request) {
      res.status(404).json({ messageKey: 'requests.not_found' });
      return;
    }

    const isRequester = request.requester_id === req.userId;
    const fulfillments = await dbOps.requestFulfillments.findByRequest(req.params.requestId);
    const isFulfiller = fulfillments.some(f => f.donor_id === req.userId);

    if (!isRequester && !isFulfiller) {
      res.status(403).json({ messageKey: 'auth.unauthorized' });
      return;
    }

    const messages = await dbOps.chat.findByRequest(req.params.requestId);
    res.json({ messages });
  } catch (err) {
    logger.error('Get request chat messages error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.post('/request/:requestId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body;
    if (!message || message.trim() === '') {
      res.status(400).json({ messageKey: 'validation.required_field' });
      return;
    }

    const request = await dbOps.donationRequests.findById(req.params.requestId);
    if (!request) {
      res.status(404).json({ messageKey: 'requests.not_found' });
      return;
    }

    const isRequester = request.requester_id === req.userId;
    const fulfillments = await dbOps.requestFulfillments.findByRequest(req.params.requestId);
    const isFulfiller = fulfillments.some(f => f.donor_id === req.userId);

    if (!isRequester && !isFulfiller) {
      res.status(403).json({ messageKey: 'auth.unauthorized' });
      return;
    }

    let receiverId: string;
    if (isRequester) {
      const lastFulfiller = fulfillments[fulfillments.length - 1];
      if (!lastFulfiller) {
        res.status(400).json({ messageKey: 'requests.no_donor_to_chat' });
        return;
      }
      receiverId = lastFulfiller.donor_id;
    } else {
      receiverId = request.requester_id;
    }

    const savedMessage = await dbOps.chat.createForRequest(req.params.requestId, req.userId!, receiverId, message);
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
    logger.error('Send request chat message error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.put('/request/:requestId/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const request = await dbOps.donationRequests.findById(req.params.requestId);
    if (!request) {
      res.status(404).json({ messageKey: 'requests.not_found' });
      return;
    }

    const isRequester = request.requester_id === req.userId;
    const fulfillments = await dbOps.requestFulfillments.findByRequest(req.params.requestId);
    const isFulfiller = fulfillments.some(f => f.donor_id === req.userId);

    if (!isRequester && !isFulfiller) {
      res.status(403).json({ messageKey: 'auth.unauthorized' });
      return;
    }

    await dbOps.chat.markRequestAsRead(req.params.requestId, req.userId!);
    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    logger.error('Mark request read error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

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
    logger.error('Get chat messages error:', err);
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
    if (!receiverId) {
      res.status(400).json({ messageKey: 'donation.no_receiver' });
      return;
    }
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
    logger.error('Send chat message error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.put('/:donationId/read', authenticate, async (req: AuthRequest, res: Response) => {
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

    await dbOps.chat.markAsRead(req.params.donationId, req.userId!);
    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    logger.error('Mark read error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.get('/unread/count', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const count = await dbOps.chat.getUnreadCount(req.userId!);
    res.json({ unreadCount: count });
  } catch (err) {
    logger.error('Unread count error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

export default router;