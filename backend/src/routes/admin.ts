import { Router, Response } from 'express';
import { dbOps } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

function requireAdmin(req: AuthRequest, res: Response, next: Function): void {
  if (!req.userId || req.userRole !== 'admin') {
    res.status(403).json({ messageKey: 'auth.admin_required' });
    return;
  }
  next();
}

const router = Router();

router.get('/stats', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await dbOps.userCount();
    const totalDonations = await dbOps.donations.totalCount();
    const availableCount = await dbOps.donations.countByStatus('available');
    const reservedCount = await dbOps.donations.countByStatus('reserved');
    const completedCount = await dbOps.donations.countByStatus('completed');
    const expiredCount = await dbOps.donations.countByStatus('expired');

    const userStatsResult = await dbOps.pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_users_30d,
        COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
        COUNT(*) FILTER (WHERE can_donate = true) as donors_count,
        COUNT(*) FILTER (WHERE can_receive = true) as receivers_count
      FROM users
    `);

    const donationStatsResult = await dbOps.pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_donations_7d,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_donations_30d,
        COUNT(*) FILTER (WHERE status = 'completed' AND updated_at > NOW() - INTERVAL '7 days') as completed_7d,
        COUNT(*) FILTER (WHERE status = 'reserved' AND updated_at > NOW() - INTERVAL '24 hours') as active_reservations
      FROM donations
    `);

    const topAreasResult = await dbOps.pool.query(`
      SELECT location_area, COUNT(*) as count 
      FROM users 
      WHERE location_area IS NOT NULL 
      GROUP BY location_area 
      ORDER BY count DESC 
      LIMIT 5
    `);

    const dailyStatsResult = await dbOps.pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM donations
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    const stats = {
      users: {
        total: totalUsers,
        newLast30Days: parseInt(userStatsResult.rows[0].new_users_30d),
        admins: parseInt(userStatsResult.rows[0].admin_count),
        donors: parseInt(userStatsResult.rows[0].donors_count),
        receivers: parseInt(userStatsResult.rows[0].receivers_count),
      },
      donations: {
        total: totalDonations,
        available: availableCount,
        reserved: reservedCount,
        completed: completedCount,
        expired: expiredCount,
        newLast7Days: parseInt(donationStatsResult.rows[0].new_donations_7d),
        newLast30Days: parseInt(donationStatsResult.rows[0].new_donations_30d),
        completedLast7Days: parseInt(donationStatsResult.rows[0].completed_7d),
        activeReservations: parseInt(donationStatsResult.rows[0].active_reservations),
      },
      charts: {
        dailyDonations: dailyStatsResult.rows.map(row => ({
          date: row.date,
          count: parseInt(row.count)
        })),
        topAreas: topAreasResult.rows.map(row => ({
          area: row.location_area,
          count: parseInt(row.count)
        })),
        statusDistribution: [
          { status: 'available', count: availableCount },
          { status: 'reserved', count: reservedCount },
          { status: 'completed', count: completedCount },
          { status: 'expired', count: expiredCount },
        ],
      }
    };

    res.json(stats);
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.get('/users', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', search } = req.query;
    const limitNum = parseInt(limit as string) || 20;
    const offsetNum = (parseInt(page as string) - 1) * limitNum;
    
    const params: any[] = [];
    
    if (search) {
      const searchPattern = `%${search}%`;
      const query = `
        SELECT id, name, email, role, can_donate, can_receive, reputation_score, total_donations, total_received, created_at 
        FROM users 
        WHERE name ILIKE $1 OR email ILIKE $1
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `;
      const result = await dbOps.pool.query(query, [searchPattern, limitNum, offsetNum]);
      return res.json({ users: result.rows });
    } else {
      const query = `
        SELECT id, name, email, role, can_donate, can_receive, reputation_score, total_donations, total_received, created_at 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `;
      const result = await dbOps.pool.query(query, [limitNum, offsetNum]);
      return res.json({ users: result.rows });
    }
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.put('/users/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, role, can_donate, can_receive, reputation_score } = req.body;
    const userId = req.params.id;

    const updated = await dbOps.users.update(userId, {
      name, role: role as any, can_donate, can_receive, reputation_score
    });

    if (!updated) {
      res.status(404).json({ messageKey: 'user.not_found' });
      return;
    }

    await dbOps.adminAudit.log(req.userId!, 'update_user', 'user', userId, { name, role, can_donate, can_receive });

    res.json({ messageKey: 'user.updated', user: updated });
  } catch (err) {
    console.error('Admin update user error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.get('/donations', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', status } = req.query;
    const { donations, total } = await dbOps.donations.findAll(
      { status: status as string },
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({ donations, pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total } });
  } catch (err) {
    console.error('Admin donations error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.put('/donations/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { status, pickup_address, pickup_date } = req.body;
    const donationId = req.params.id;

    const updated = await dbOps.donations.update(donationId, { status, pickup_address, pickup_date });

    if (!updated) {
      res.status(404).json({ messageKey: 'donation.not_found' });
      return;
    }

    await dbOps.adminAudit.log(req.userId!, 'update_donation', 'donation', donationId, { status, pickup_address });

    res.json({ messageKey: 'donation.updated', donation: updated });
  } catch (err) {
    console.error('Admin update donation error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.get('/tickets', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', status, priority } = req.query;
    const { tickets, total } = await dbOps.support.findAll(
      { status: status as string, priority: priority as string },
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({ tickets, pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total } });
  } catch (err) {
    console.error('Admin tickets error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.put('/tickets/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { status, priority, assigned_to } = req.body;
    const ticketId = req.params.id;

    const updated = await dbOps.support.updateTicket(ticketId, { status, priority, assigned_to });

    if (!updated) {
      res.status(404).json({ messageKey: 'support.ticket_not_found' });
      return;
    }

    await dbOps.adminAudit.log(req.userId!, 'update_ticket', 'ticket', ticketId, { status, priority, assigned_to });

    res.json({ messageKey: 'support.ticket_updated', ticket: updated });
  } catch (err) {
    console.error('Admin update ticket error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.get('/audit-log', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const logs = await dbOps.adminAudit.getRecent(50);
    res.json({ logs });
  } catch (err) {
    console.error('Admin audit log error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.get('/reports', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const reports = await dbOps.donationReports.findPending();
    res.json({ reports });
  } catch (err) {
    console.error('Admin reports error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.put('/reports/:id/resolve', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await dbOps.donationReports.resolve(req.params.id, req.userId!);
    await dbOps.adminAudit.log(req.userId!, 'resolve_report', 'report', req.params.id, {});
    res.json({ messageKey: 'report.resolved' });
  } catch (err) {
    console.error('Admin resolve report error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

export default router;