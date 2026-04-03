import { Router, Response } from 'express';
import { dbOps, pool } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { reverseGeocode, getCachedLocation } from '../services/geocoding';

const router = Router();

router.get('/public-stats', async (_req, res: Response) => {
  try {
    const [totalDonations, completedDonations, totalUsers, donorsCount, recipientsCount] = await Promise.all([
      dbOps.donations.totalCount(),
      dbOps.donations.countByStatus('completed'),
      dbOps.userCount(),
      pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'donor'"),
      pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'recipient'"),
    ]);

    res.json({
      totalDonations,
      completedDonations,
      totalUsers,
      totalDonors: parseInt(donorsCount.rows[0].count),
      totalReceivers: parseInt(recipientsCount.rows[0].count),
    });
  } catch (err) {
    console.error('Public stats error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.get('/geo-stats', async (_req, res: Response) => {
  try {
    const { rows: donations } = await pool.query(`
      SELECT d.id, d.latitude, d.longitude, d.status, d.pickup_address, d.quantity,
             u.location_city, u.location_area
      FROM donations d
      LEFT JOIN users u ON d.donor_id = u.id
      WHERE d.status IN ('available', 'reserved')
      AND d.latitude IS NOT NULL AND d.longitude IS NOT NULL
      ORDER BY d.created_at DESC
      LIMIT 500
    `);

    const cityStats = new Map<string, { available: number; reserved: number; total: number }>();
    const areaStats = new Map<string, { city: string; available: number; reserved: number; total: number }>();

    for (const donation of donations) {
      const statusKey = donation.status as 'available' | 'reserved';
      let city = donation.location_city || 'Unknown';
      let area = donation.location_area || undefined;
      
      if (!donation.location_city) {
        const cached = getCachedLocation(donation.latitude, donation.longitude);
        if (cached) {
          city = cached.city || city;
          area = cached.area;
        }
      }

      const cityKey = city.toLowerCase();

      if (!cityStats.has(cityKey)) {
        cityStats.set(cityKey, { available: 0, reserved: 0, total: 0 });
      }
      const cityStat = cityStats.get(cityKey)!;
      cityStat[statusKey] = (cityStat[statusKey] || 0) + donation.quantity;
      cityStat.total += donation.quantity;

      if (area) {
        const areaKey = `${cityKey}::${area.toLowerCase()}`;
        if (!areaStats.has(areaKey)) {
          areaStats.set(areaKey, { city, available: 0, reserved: 0, total: 0 });
        }
        const areaStat = areaStats.get(areaKey)!;
        areaStat[statusKey] = (areaStat[statusKey] || 0) + donation.quantity;
        areaStat.total += donation.quantity;
      }
    }

    const cities = Array.from(cityStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);

    const areas = Array.from(areaStats.entries())
      .map(([key, stats]) => ({ city: stats.city, area: key.split('::')[1] || undefined, available: stats.available, reserved: stats.reserved, total: stats.total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 50);

    res.json({
      donations: donations.map(d => ({
        id: d.id,
        latitude: d.latitude,
        longitude: d.longitude,
        status: d.status,
        quantity: d.quantity,
        pickup_address: d.pickup_address,
      })),
      cities,
      areas,
    });
  } catch (err) {
    console.error('Geo stats error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

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
