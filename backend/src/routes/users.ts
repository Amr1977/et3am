import { Router, Response } from 'express';
import { dbOps } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [totalDonations, availableDonations, reservedDonations, completedDonations, totalUsers] = await Promise.all([
      dbOps.donations.totalCount(),
      dbOps.donations.countByStatus('available'),
      dbOps.donations.countByStatus('reserved'),
      dbOps.donations.countByStatus('completed'),
      dbOps.userCount(),
    ]);

    let myDonations = 0;
    let myReservations = 0;

    if (req.userRole === 'donor') {
      myDonations = await dbOps.donations.countByDonor(req.userId!);
    } else if (req.userRole === 'recipient') {
      myReservations = await dbOps.donations.countByReserved(req.userId!);
    }

    res.json({
      stats: {
        totalDonations,
        availableDonations,
        reservedDonations,
        completedDonations,
        totalUsers,
        myDonations,
        myReservations
      }
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

export default router;
