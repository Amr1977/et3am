import { Router, Response } from 'express';
import { dbOps } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { type, title, description } = req.body;

    if (!type || !title || !description) {
      res.status(400).json({ messageKey: 'validation.required_field' });
      return;
    }

    if (!['bug', 'feature', 'support'].includes(type)) {
      res.status(400).json({ messageKey: 'validation.invalid_field' });
      return;
    }

    const ticket = await dbOps.support.createTicket(req.userId!, type, title, description);
    res.status(201).json({ messageKey: 'support.ticket_created', ticket });
  } catch (err) {
    console.error('Create ticket error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const tickets = await dbOps.support.findByUser(req.userId!);
    res.json({ tickets });
  } catch (err) {
    console.error('Get tickets error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await dbOps.support.findById(req.params.id);
    if (!ticket) {
      res.status(404).json({ messageKey: 'support.ticket_not_found' });
      return;
    }

    if (ticket.user_id !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ messageKey: 'auth.unauthorized' });
      return;
    }

    res.json({ ticket });
  } catch (err) {
    console.error('Get ticket error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

export default router;