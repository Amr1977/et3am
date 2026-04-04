import { Router, Response } from 'express';
import { dbOps } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { reviewed_id, donation_id, rating, comment, review_type } = req.body;

    if (!reviewed_id || !rating || !review_type) {
      res.status(400).json({ messageKey: 'validation.required_field' });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({ messageKey: 'validation.invalid_rating' });
      return;
    }

    if (!['donor_to_receiver', 'receiver_to_donor'].includes(review_type)) {
      res.status(400).json({ messageKey: 'validation.invalid_field' });
      return;
    }

    const donation = donation_id ? await dbOps.donations.findById(donation_id) : null;
    if (donation && donation.status !== 'completed') {
      res.status(400).json({ messageKey: 'donation.not_completed' });
      return;
    }

    const review = await dbOps.reviews.create(req.userId!, reviewed_id, donation_id, rating, comment, review_type);
    
    const user = await dbOps.users.findById(reviewed_id);
    if (user) {
      const ratingStats = await dbOps.reviews.getUserRating(reviewed_id);
      await dbOps.users.update(reviewed_id, {
        reputation_score: Math.round(ratingStats.avgRating * 20)
      });
    }

    res.status(201).json({ messageKey: 'review.created', review });
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(400).json({ messageKey: 'review.already_exists' });
      return;
    }
    console.error('Create review error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.get('/user/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const reviews = await dbOps.reviews.findByUser(req.params.userId);
    const ratingStats = await dbOps.reviews.getUserRating(req.params.userId);
    res.json({ reviews, ratingStats });
  } catch (err) {
    console.error('Get user reviews error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.get('/donation/:donationId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const reviews = await dbOps.reviews.findByDonation(req.params.donationId);
    res.json({ reviews });
  } catch (err) {
    console.error('Get donation reviews error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

export default router;