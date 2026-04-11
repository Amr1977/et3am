import { Router, Response } from 'express';
import { dbOps, pool } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { reverseGeocode, getCachedLocation } from '../services/geocoding';

const router = Router();

router.get('/public-stats', async (_req, res: Response) => {
  try {
    const totalDonations = await dbOps.donations.totalCount();
    const completedDonations = await dbOps.donations.countByStatus('completed');
    const totalUsers = await dbOps.userCount();

    let donorsCount = 0;
    let recipientsCount = 0;

    try {
      const donorsResult = await pool.query("SELECT COUNT(*) as count FROM users WHERE can_donate = true");
      donorsCount = parseInt(donorsResult.rows[0]?.count || '0');
    } catch (e) {
      console.warn('donors count query failed:', e);
    }

    try {
      const recipientsResult = await pool.query("SELECT COUNT(*) as count FROM users WHERE can_receive = true");
      recipientsCount = parseInt(recipientsResult.rows[0]?.count || '0');
    } catch (e) {
      console.warn('recipients count query failed:', e);
    }

    res.json({
      totalDonations,
      completedDonations,
      totalUsers,
      totalDonors: donorsCount,
      totalReceivers: recipientsCount,
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

    const myDonations = await dbOps.donations.countByDonor(req.userId!);
    const myReservations = await dbOps.donations.countByReserved(req.userId!);

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

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await dbOps.users.findById(req.userId!);
    if (!user) {
      res.status(404).json({ messageKey: 'user.not_found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        can_donate: user.can_donate,
        can_receive: user.can_receive,
        reputation_score: user.reputation_score,
        total_donations: user.total_donations,
        total_received: user.total_received,
        sound_enabled: user.sound_enabled,
        notifications_enabled: user.notifications_enabled,
        avatar_url: user.avatar_url,
        preferred_language: user.preferred_language,
      }
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.put('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, sound_enabled, notifications_enabled, preferred_language } = req.body;
    
    const updates: any = {};
    if (name) updates.name = name;
    if (sound_enabled !== undefined) updates.sound_enabled = sound_enabled;
    if (notifications_enabled !== undefined) updates.notifications_enabled = notifications_enabled;
    if (preferred_language) updates.preferred_language = preferred_language;

    const updated = await dbOps.users.update(req.userId!, updates);
    if (!updated) {
      res.status(404).json({ messageKey: 'user.not_found' });
      return;
    }

    res.json({ messageKey: 'user.updated', user: updated });
  } catch (err) {
    console.error('Update me error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

export default router;
