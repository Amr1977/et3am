import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbOps } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

function generateHashCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, food_type, page = '1', limit = '10' } = req.query;
    const { donations, total } = await dbOps.donations.findAll(
      { status: status as string, food_type: food_type as string },
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

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, food_type, quantity, unit, expiry_date, pickup_address, pickup_date, latitude, longitude } = req.body;

    console.log('Creating donation:', { title, food_type, pickup_address, quantity, userId: req.userId });

    if (!title || !food_type || !pickup_address) {
      res.status(400).json({ messageKey: 'validation.required_field' });
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

    res.status(201).json({ messageKey: 'donation.created', donation });
  } catch (err: any) {
    console.error('Create donation error:', err);
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
    const donation = await dbOps.donations.findById(req.params.id);
    if (!donation) {
      res.status(404).json({ messageKey: 'donation.not_found' });
      return;
    }

    if (donation.status !== 'available') {
      res.status(400).json({ messageKey: 'donation.not_available' });
      return;
    }

    const hashCode = generateHashCode();
    
    const updated = await dbOps.donations.update(req.params.id, {
      status: 'reserved',
      reserved_by: req.userId,
      hash_code: hashCode
    });

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

    const updated = await dbOps.donations.update(req.params.id, {
      status: 'available',
      reserved_by: null,
      hash_code: null
    });

    res.json({ messageKey: 'donation.reservation_cancelled', donation: updated });
  } catch (err) {
    console.error('Cancel reservation error:', err);
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
