import { Router, Response } from 'express';
import { dbOps } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';
import logger from '../config/logger';

const router = Router();

function requireAdmin(req: AuthRequest, res: Response, next: () => void): void {
  if (!req.userId || req.userRole !== 'admin') {
    res.status(403).json({ messageKey: 'auth.admin_required' });
    return;
  }
  next();
}

router.get('/', async (_req, res: Response) => {
  try {
    const testimonials = await dbOps.testimonials.getApproved(20);
    res.json({ testimonials });
  } catch (err) {
    logger.error('Get testimonials error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { content, rating } = req.body;
    if (!content || !rating) {
      res.status(400).json({ messageKey: 'validation.required_field' });
      return;
    }
    if (rating < 1 || rating > 5) {
      res.status(400).json({ messageKey: 'validation.invalid_field' });
      return;
    }

    const user = await dbOps.users.findById(req.userId!);
    if (!user) {
      res.status(404).json({ messageKey: 'user.not_found' });
      return;
    }

    const testimonial = await dbOps.testimonials.create(
      req.userId!,
      user.name,
      user.role,
      content,
      rating
    );
    res.status(201).json({ messageKey: 'testimonial.created', testimonial });
  } catch (err) {
    logger.error('Create testimonial error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.get('/all', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const filters: any = {};
    if (req.query.is_approved !== undefined) filters.is_approved = req.query.is_approved === 'true';
    if (req.query.is_featured !== undefined) filters.is_featured = req.query.is_featured === 'true';

    const result = await dbOps.testimonials.findAll(filters, page, limit);
    res.json(result);
  } catch (err) {
    logger.error('Get all testimonials error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { is_approved, is_featured } = req.body;
    const testimonial = await dbOps.testimonials.update(req.params.id, { is_approved, is_featured });
    if (!testimonial) {
      res.status(404).json({ messageKey: 'testimonial.not_found' });
      return;
    }
    res.json({ messageKey: 'testimonial.updated', testimonial });
  } catch (err) {
    logger.error('Update testimonial error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await dbOps.testimonials.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ messageKey: 'testimonial.not_found' });
      return;
    }
    res.json({ messageKey: 'testimonial.deleted' });
  } catch (err) {
    logger.error('Delete testimonial error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

export default router;
