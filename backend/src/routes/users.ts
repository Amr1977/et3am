import { Router, Response } from 'express';
import { dbOps } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate, (req: AuthRequest, res: Response) => {
  const totalDonations = dbOps.donations.totalCount();
  const availableDonations = dbOps.donations.countByStatus('available');
  const reservedDonations = dbOps.donations.countByStatus('reserved');
  const completedDonations = dbOps.donations.countByStatus('completed');
  const totalUsers = dbOps.userCount();

  let myDonations = 0;
  let myReservations = 0;

  if (req.userRole === 'donor') {
    myDonations = dbOps.donations.countByDonor(req.userId!);
  } else if (req.userRole === 'recipient') {
    myReservations = dbOps.donations.countByReserved(req.userId!);
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
});

export default router;
