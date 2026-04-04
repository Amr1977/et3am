import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbOps } from '../database';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { emitDonationEvent, emitToUser } from '../config/socket';
import { createDonationLimiter } from '../middleware/rateLimit';
import logger from '../config/logger';

function generateHashCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const router = Router();

// Get all donations (public) or user's reserved/completed (authenticated)
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { status, food_type, page = '1', limit = '10', filter } = req.query;
    
    // Handle filter parameter: 'available', 'reserved', 'completed', 'all'
    // For unauthenticated users, always show available
    if (!req.userId) {
      if (filter && filter !== 'available') {
        res.status(401).json({ messageKey: 'auth.login_required' });
        return;
      }
    }

    let statusFilter = status as string;
    
    // Apply filter logic
    if (filter === 'available' || (!req.userId && !status)) {
      statusFilter = 'available';
    } else if (filter === 'reserved' && req.userId) {
      // Reserved donations where user is either donor or receiver
      const myReserved = await dbOps.donations.findByReserved(req.userId!);
      const myDonationsReserved = (await dbOps.donations.findByDonor(req.userId!)).filter(d => d.status === 'reserved');
      
      const donations = [...myReserved, ...myDonationsReserved];
      const enriched = donations.map(d => ({
        ...d,
        donor_name: d.donor_id === req.userId ? 'You' : 'Anonymous',
        pickup_address: d.donor_id === req.userId || d.reserved_by === req.userId ? d.pickup_address : null,
        hash_code: d.reserved_by === req.userId || d.donor_id === req.userId ? d.hash_code : null,
      }));
      
      res.json({
        messageKey: 'donation.list_retrieved',
        donations: enriched,
        pagination: { page: 1, limit: donations.length, total: donations.length }
      });
      return;
    } else if (filter === 'completed' && req.userId) {
      const myCompleted = (await dbOps.donations.findByDonor(req.userId!)).filter(d => d.status === 'completed');
      const myReceived = (await dbOps.donations.findByReserved(req.userId!)).filter(d => d.status === 'completed');
      const donations = [...myCompleted, ...myReceived];
      
      const enriched = donations.map(d => ({
        ...d,
        donor_name: d.donor_id === req.userId ? 'You' : 'Anonymous',
      }));
      
      res.json({
        messageKey: 'donation.list_retrieved',
        donations: enriched,
        pagination: { page: 1, limit: donations.length, total: donations.length }
      });
      return;
    } else if (statusFilter) {
      // Keep the explicit status filter
    } else {
      // Default to available for public
      statusFilter = 'available';
    }

    const { donations, total } = await dbOps.donations.findAll(
      { status: statusFilter, food_type: food_type as string },
      parseInt(page as string),
      parseInt(limit as string)
    );

    const isAuthenticated = !!req.userId;
    const isDonor = isAuthenticated && donations.some(d => d.donor_id === req.userId);
    const isReceiver = isAuthenticated && donations.some(d => d.reserved_by === req.userId);

    const enriched = donations.map(d => {
      const isOwner = req.userId && d.donor_id === req.userId;
      const isReserver = req.userId && d.reserved_by === req.userId;
      
      const base = {
        id: d.id,
        donor_id: d.donor_id,
        title: d.title,
        description: d.description,
        food_type: d.food_type,
        quantity: d.quantity,
        unit: d.unit,
        expiry_date: d.expiry_date,
        latitude: d.latitude,
        longitude: d.longitude,
        pickup_date: d.pickup_date,
        status: d.status,
        reserved_by: d.reserved_by,
        created_at: d.created_at,
      };

      if (!req.userId) {
        return { 
          ...base, 
          donor_name: 'Anonymous',
          pickup_address: null,
        };
      }

      if (isOwner) {
        return {
          ...base,
          donor_name: 'You',
          pickup_address: d.pickup_address,
          hash_code: d.hash_code,
          reserved_by_name: d.reserved_by ? 'Someone' : null,
        };
      }

      if (isReserver) {
        return {
          ...base,
          donor_name: 'Anonymous',
          pickup_address: d.pickup_address,
          hash_code: d.hash_code,
        };
      }

      return { 
        ...base, 
        donor_name: 'Anonymous',
        pickup_address: null,
      };
    });

    res.json({
      messageKey: 'donation.list_retrieved',
      donations: enriched,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total
      }
    });
  } catch (err) {
    console.error('Get donations error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.get('/my-donations', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const donations = await dbOps.donations.findByDonor(req.userId!);
    
    const enriched = donations.map(d => ({
      ...d,
      donor_name: 'You',
      reserved_by_name: d.reserved_by ? 'Reserved' : null,
    }));

    res.json({ donations: enriched });
  } catch (err) {
    console.error('My donations error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.get('/my-reservations', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const donations = await dbOps.donations.findByReserved(req.userId!);
    
    const enriched = donations.map(d => ({
      ...d,
      donor_name: 'Anonymous',
      hash_code: d.hash_code,
    }));

    res.json({ donations: enriched });
  } catch (err) {
    console.error('My reservations error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const donation = await dbOps.donations.findById(req.params.id);
    if (!donation) {
      res.status(404).json({ messageKey: 'donation.not_found' });
      return;
    }

    const isOwner = req.userId === donation.donor_id;
    const isReceiver = req.userId === donation.reserved_by;

    let responseData: any = {
      id: donation.id,
      title: donation.title,
      description: donation.description,
      food_type: donation.food_type,
      quantity: donation.quantity,
      unit: donation.unit,
      expiry_date: donation.expiry_date,
      latitude: donation.latitude,
      longitude: donation.longitude,
      pickup_date: donation.pickup_date,
      status: donation.status,
      created_at: donation.created_at,
      donor_id: donation.donor_id,
      reserved_by: donation.reserved_by,
    };

    if (!req.userId) {
      responseData.donor_name = 'Anonymous';
      responseData.pickup_address = null;
    } else if (isOwner) {
      responseData.donor_name = 'You';
      responseData.pickup_address = donation.pickup_address;
      responseData.hash_code = donation.hash_code;
    } else if (isReceiver) {
      responseData.donor_name = 'Anonymous';
      responseData.pickup_address = donation.pickup_address;
      responseData.hash_code = donation.hash_code;
    } else {
      responseData.donor_name = 'Anonymous';
      responseData.pickup_address = null;
    }

    res.json({ donation: responseData });
  } catch (err) {
    console.error('Get donation error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.post('/', createDonationLimiter, authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, food_type, quantity, unit, expiry_date, pickup_address, pickup_date, latitude, longitude } = req.body;

    console.log('Creating donation:', { title, food_type, pickup_address, quantity, userId: req.userId });

    if (!title || !food_type || !pickup_address) {
      res.status(400).json({ messageKey: 'validation.required_field' });
      return;
    }

    const user = await dbOps.users.findById(req.userId!);
    if (!user || !user.can_donate) {
      res.status(403).json({ messageKey: 'auth.cannot_donate' });
      return;
    }

    const donation = await dbOps.donations.create({
      id: uuidv4(),
      donor_id: req.userId!,
      title,
      description: description || null,
      food_type,
      quantity: Number(quantity) || 1,
      unit: unit || 'portions',
      expiry_date: expiry_date || null,
      pickup_address,
      latitude: latitude != null && latitude !== '' ? parseFloat(latitude) : null,
      longitude: longitude != null && longitude !== '' ? parseFloat(longitude) : null,
      pickup_date: pickup_date || null,
      status: 'available',
      reserved_by: null,
      hash_code: null,
    });

    (logger as any).donation('New donation created', { donationId: donation.id, donorId: req.userId, title, food_type, quantity });
    res.status(201).json({ messageKey: 'donation.created', donation });
  } catch (err: any) {
    logger.error('Create donation error:', err);
    res.status(500).json({ messageKey: 'general.server_error', error: err.message });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const donation = await dbOps.donations.findById(req.params.id);
    if (!donation) {
      res.status(404).json({ messageKey: 'donation.not_found' });
      return;
    }

    if (donation.donor_id !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ messageKey: 'auth.unauthorized' });
      return;
    }

    const { title, description, food_type, quantity, unit, expiry_date, pickup_address, pickup_date, status, latitude, longitude } = req.body;
    const updated = await dbOps.donations.update(req.params.id, {
      title, description, food_type, quantity, unit, expiry_date, pickup_address, pickup_date, status,
      latitude: latitude != null ? parseFloat(latitude) : undefined,
      longitude: longitude != null ? parseFloat(longitude) : undefined,
    });

    res.json({ messageKey: 'donation.updated', donation: updated });
  } catch (err) {
    console.error('Update donation error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.post('/:id/reserve', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Check daily limit
    const actionCount = await dbOps.dailyReservations.checkTodayAction(req.userId!);
    if (actionCount > 0) {
      res.status(429).json({ messageKey: 'donation.daily_limit_reached' });
      return;
    }

    const donation = await dbOps.donations.findById(req.params.id);
    if (!donation) {
      res.status(404).json({ messageKey: 'donation.not_found' });
      return;
    }

    if (donation.status !== 'available') {
      res.status(400).json({ messageKey: 'donation.not_available' });
      return;
    }

    if (donation.donor_id === req.userId) {
      res.status(400).json({ messageKey: 'donation.cannot_reserve_own' });
      return;
    }

    const user = await dbOps.users.findById(req.userId!);
    if (!user || !user.can_receive) {
      res.status(403).json({ messageKey: 'auth.cannot_receive' });
      return;
    }

    const hashCode = generateHashCode();
    
    await dbOps.dailyReservations.create(req.userId!, req.params.id, 'reserve');
    
    const updated = await dbOps.donations.update(req.params.id, {
      status: 'reserved',
      reserved_by: req.userId,
      hash_code: hashCode
    });

    // Emit real-time events
    const donor = await dbOps.users.findById(donation.donor_id);
    emitDonationEvent('meal_reserved', {
      donationId: req.params.id,
      title: donation.title,
      reserverId: req.userId,
      reserverName: user?.name,
    });
    
    if (donor) {
      emitToUser(donation.donor_id, 'reservation_notification', {
        donationId: req.params.id,
        title: donation.title,
        reserverName: user?.name,
      });
    }
    
    res.json({ 
      messageKey: 'donation.reserved', 
      donation: { ...updated, hash_code: hashCode },
      hash_code: hashCode 
    });
  } catch (err) {
    console.error('Reserve error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.post('/:id/verify-hash', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { hash_code } = req.body;
    const donation = await dbOps.donations.findById(req.params.id);
    
    if (!donation) {
      res.status(404).json({ messageKey: 'donation.not_found' });
      return;
    }

    if (donation.donor_id !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ messageKey: 'auth.unauthorized' });
      return;
    }

    if (!donation.hash_code || donation.hash_code !== hash_code?.toUpperCase()) {
      res.status(400).json({ messageKey: 'donation.invalid_hash', valid: false });
      return;
    }

    res.json({ messageKey: 'donation.hash_verified', valid: true });
  } catch (err) {
    console.error('Verify hash error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.post('/:id/cancel-reservation', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const donation = await dbOps.donations.findById(req.params.id);
    if (!donation) {
      res.status(404).json({ messageKey: 'donation.not_found' });
      return;
    }

    if (donation.status !== 'reserved') {
      res.status(400).json({ messageKey: 'donation.not_reserved' });
      return;
    }

    if (donation.reserved_by !== req.userId && donation.donor_id !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ messageKey: 'auth.unauthorized' });
      return;
    }

    // Release daily reservation slot so user can reserve again
    if (donation.reserved_by) {
      await dbOps.dailyReservations.delete(donation.reserved_by, req.params.id);
    }

    const updated = await dbOps.donations.update(req.params.id, {
      status: 'available',
      reserved_by: null,
      hash_code: null
    });

    emitDonationEvent('reservation_cancelled', {
      donationId: req.params.id,
      title: donation.title,
    });

    if (donation.reserved_by) {
      emitToUser(donation.reserved_by, 'reservation_cancelled', {
        donationId: req.params.id,
        title: donation.title,
      });
    }

    res.json({ messageKey: 'donation.reservation_cancelled', donation: updated });
  } catch (err: any) {
    logger.error('Cancel reservation error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

// Mark as received - Receiver confirms they have picked up the meal
router.post('/:id/mark-received', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const donation = await dbOps.donations.findById(req.params.id);
    if (!donation) {
      res.status(404).json({ messageKey: 'donation.not_found' });
      return;
    }

    if (donation.reserved_by !== req.userId) {
      res.status(403).json({ messageKey: 'auth.unauthorized' });
      return;
    }

    if (donation.status !== 'reserved') {
      res.status(400).json({ messageKey: 'donation.not_reserved' });
      return;
    }

    const updated = await dbOps.donations.update(req.params.id, { 
      status: 'received'
    });

    (logger as any).donation('Meal marked as received', { 
      donationId: req.params.id, 
      receiverId: req.userId,
      pickupCode: donation.hash_code 
    });

    // Notify donor
    if (donation.donor_id) {
      emitToUser(donation.donor_id, 'meal_received', {
        donationId: req.params.id,
        title: donation.title,
      });
    }

    res.json({ messageKey: 'donation.received', donation: updated });
  } catch (err: any) {
    logger.error('Mark received error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.post('/:id/complete', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const donation = await dbOps.donations.findById(req.params.id);
    if (!donation) {
      res.status(404).json({ messageKey: 'donation.not_found' });
      return;
    }

    if (donation.donor_id !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ messageKey: 'auth.unauthorized' });
      return;
    }

    if (!donation.hash_code) {
      res.status(400).json({ messageKey: 'donation.no_hash' });
      return;
    }

    const updated = await dbOps.donations.update(req.params.id, { 
      status: 'completed',
      hash_code: null 
    });
    
    // Update user stats
    const user = await dbOps.users.findById(req.userId!);
    if (user) {
      await dbOps.users.update(req.userId!, {
        total_received: (user.total_received || 0) + 1,
        reputation_score: (user.reputation_score || 0) + 10
      });
    }

    emitDonationEvent('meal_delivered', {
      donationId: req.params.id,
      title: donation.title,
    });

    if (donation.reserved_by) {
      emitToUser(donation.reserved_by, 'delivery_completed', {
        donationId: req.params.id,
        title: donation.title,
      });
    }
    
    res.json({ messageKey: 'donation.completed', donation: updated });
  } catch (err) {
    console.error('Complete error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const donation = await dbOps.donations.findById(req.params.id);
    if (!donation) {
      res.status(404).json({ messageKey: 'donation.not_found' });
      return;
    }

    if (donation.donor_id !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ messageKey: 'auth.unauthorized' });
      return;
    }

    await dbOps.donations.delete(req.params.id);
    res.json({ messageKey: 'donation.deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

export default router;
