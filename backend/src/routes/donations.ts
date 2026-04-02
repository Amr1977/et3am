import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbOps } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', (req: AuthRequest, res: Response) => {
  const { status, food_type, page = '1', limit = '10' } = req.query;
  const { donations, total } = dbOps.donations.findAll(
    { status: status as string, food_type: food_type as string },
    parseInt(page as string),
    parseInt(limit as string)
  );

  const enriched = donations.map(d => {
    const donor = dbOps.users.findById(d.donor_id);
    const reservedBy = d.reserved_by ? dbOps.users.findById(d.reserved_by) : null;
    return {
      ...d,
      donor_name: donor?.name,
      donor_phone: donor?.phone,
      reserved_by_name: reservedBy?.name,
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
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  const donation = dbOps.donations.findById(req.params.id);
  if (!donation) {
    res.status(404).json({ messageKey: 'donation.not_found' });
    return;
  }

  const donor = dbOps.users.findById(donation.donor_id);
  const reservedBy = donation.reserved_by ? dbOps.users.findById(donation.reserved_by) : null;

  res.json({
    donation: {
      ...donation,
      donor_name: donor?.name,
      donor_phone: donor?.phone,
      reserved_by_name: reservedBy?.name
    }
  });
});

router.post('/', authenticate, (req: AuthRequest, res: Response) => {
  const { title, description, food_type, quantity, unit, expiry_date, pickup_address, pickup_date, latitude, longitude } = req.body;

  if (!title || !food_type || !pickup_address) {
    res.status(400).json({ messageKey: 'validation.required_field' });
    return;
  }

  const donation = dbOps.donations.create({
    id: uuidv4(),
    donor_id: req.userId!,
    title,
    description: description || null,
    food_type,
    quantity: quantity || 1,
    unit: unit || 'portion',
    expiry_date: expiry_date || null,
    pickup_address,
    latitude: latitude != null ? parseFloat(latitude) : null,
    longitude: longitude != null ? parseFloat(longitude) : null,
    pickup_date: pickup_date || null,
    status: 'available',
    reserved_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  res.status(201).json({ messageKey: 'donation.created', donation });
});

router.put('/:id', authenticate, (req: AuthRequest, res: Response) => {
  const donation = dbOps.donations.findById(req.params.id);
  if (!donation) {
    res.status(404).json({ messageKey: 'donation.not_found' });
    return;
  }

  if (donation.donor_id !== req.userId && req.userRole !== 'admin') {
    res.status(403).json({ messageKey: 'auth.unauthorized' });
    return;
  }

  const { title, description, food_type, quantity, unit, expiry_date, pickup_address, pickup_date, status, latitude, longitude } = req.body;
  const updated = dbOps.donations.update(req.params.id, {
    title, description, food_type, quantity, unit, expiry_date, pickup_address, pickup_date, status,
    latitude: latitude != null ? parseFloat(latitude) : undefined,
    longitude: longitude != null ? parseFloat(longitude) : undefined,
  });

  res.json({ messageKey: 'donation.updated', donation: updated });
});

router.post('/:id/reserve', authenticate, (req: AuthRequest, res: Response) => {
  const donation = dbOps.donations.findById(req.params.id);
  if (!donation) {
    res.status(404).json({ messageKey: 'donation.not_found' });
    return;
  }

  if (donation.status !== 'available') {
    res.status(400).json({ messageKey: 'donation.not_available' });
    return;
  }

  const updated = dbOps.donations.update(req.params.id, {
    status: 'reserved',
    reserved_by: req.userId
  });

  res.json({ messageKey: 'donation.reserved', donation: updated });
});

router.post('/:id/cancel-reservation', authenticate, (req: AuthRequest, res: Response) => {
  const donation = dbOps.donations.findById(req.params.id);
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

  const updated = dbOps.donations.update(req.params.id, {
    status: 'available',
    reserved_by: null
  });

  res.json({ messageKey: 'donation.reservation_cancelled', donation: updated });
});

router.post('/:id/complete', authenticate, (req: AuthRequest, res: Response) => {
  const donation = dbOps.donations.findById(req.params.id);
  if (!donation) {
    res.status(404).json({ messageKey: 'donation.not_found' });
    return;
  }

  if (donation.donor_id !== req.userId && req.userRole !== 'admin') {
    res.status(403).json({ messageKey: 'auth.unauthorized' });
    return;
  }

  const updated = dbOps.donations.update(req.params.id, { status: 'completed' });
  res.json({ messageKey: 'donation.completed', donation: updated });
});

router.delete('/:id', authenticate, (req: AuthRequest, res: Response) => {
  const donation = dbOps.donations.findById(req.params.id);
  if (!donation) {
    res.status(404).json({ messageKey: 'donation.not_found' });
    return;
  }

  if (donation.donor_id !== req.userId && req.userRole !== 'admin') {
    res.status(403).json({ messageKey: 'auth.unauthorized' });
    return;
  }

  dbOps.donations.delete(req.params.id);
  res.json({ messageKey: 'donation.deleted' });
});

export default router;
