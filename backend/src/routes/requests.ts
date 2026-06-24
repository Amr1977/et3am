import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbOps } from '../database';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { emitRequestEvent, emitToUser } from '../config/socket';
import logger from '../config/logger';

const router = Router();

router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = '1', limit = '10', lat, lng } = req.query;

    let statusFilter = status as string | undefined;

    const { requests, total } = await dbOps.donationRequests.findAll(
      { status: statusFilter },
      parseInt(page as string),
      parseInt(limit as string),
      lat ? parseFloat(lat as string) : null,
      lng ? parseFloat(lng as string) : null
    );

    const enriched = requests.map(r => ({
      ...r,
      requester_name: r.requester_id === req.userId ? 'You' : 'Anonymous',
      address: r.requester_id === req.userId ? r.address : null,
    }));

    res.json({
      messageKey: 'requests.list_retrieved',
      requests: enriched,
      pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total },
    });
  } catch (err) {
    logger.error('List requests error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.get('/my-requests', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const requests = await dbOps.donationRequests.findByRequester(req.userId!);
    res.json({ requests });
  } catch (err) {
    logger.error('My requests error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.get('/my-fulfillments', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const requests = await dbOps.donationRequests.findByFulfiller(req.userId!);
    res.json({ requests });
  } catch (err) {
    logger.error('My fulfillments error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const request = await dbOps.donationRequests.findById(req.params.id);
    if (!request) {
      res.status(404).json({ messageKey: 'requests.not_found' });
      return;
    }

    const fulfillments = await dbOps.requestFulfillments.findByRequest(req.params.id);

    const enriched = {
      ...request,
      requester_name: request.requester_id === req.userId ? 'You' : 'Anonymous',
      address: request.requester_id === req.userId ? request.address : null,
      fulfillments: req.userId ? fulfillments.map(f => ({
        ...f,
        donor_name: f.donor_id === req.userId || f.donor_id === request.requester_id ? f.donor_name : 'Anonymous',
      })) : [],
    };

    res.json({ request: enriched });
  } catch (err) {
    logger.error('Get request error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, member_count, address, latitude, longitude } = req.body;

    if (!title || !member_count || latitude == null || longitude == null) {
      res.status(400).json({ messageKey: 'validation.required_field' });
      return;
    }

    const requestData = {
      id: uuidv4(),
      requester_id: req.userId!,
      title,
      description: description || null,
      member_count,
      meals_fulfilled: 0,
      address: address || null,
      latitude,
      longitude,
      status: 'open' as const,
    };

    const created = await dbOps.donationRequests.create(requestData);

    emitRequestEvent('request_created', {
      requestId: created.id,
      title: created.title,
      requesterId: req.userId,
    });

    res.status(201).json({ messageKey: 'requests.created', request: created });
  } catch (err) {
    logger.error('Create request error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const request = await dbOps.donationRequests.findById(req.params.id);
    if (!request) {
      res.status(404).json({ messageKey: 'requests.not_found' });
      return;
    }

    if (request.requester_id !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ messageKey: 'auth.unauthorized' });
      return;
    }

    if (request.status === 'fulfilled' || request.status === 'cancelled') {
      res.status(400).json({ messageKey: 'requests.cannot_update' });
      return;
    }

    const { title, description, member_count, address, latitude, longitude } = req.body;
    const updated = await dbOps.donationRequests.update(req.params.id, {
      title,
      description,
      member_count,
      address,
      latitude: latitude != null ? parseFloat(latitude) : undefined,
      longitude: longitude != null ? parseFloat(longitude) : undefined,
    });

    res.json({ messageKey: 'requests.updated', request: updated });
  } catch (err) {
    logger.error('Update request error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const request = await dbOps.donationRequests.findById(req.params.id);
    if (!request) {
      res.status(404).json({ messageKey: 'requests.not_found' });
      return;
    }

    if (request.requester_id !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ messageKey: 'auth.unauthorized' });
      return;
    }

    if (request.status === 'fulfilled') {
      res.status(400).json({ messageKey: 'requests.cannot_delete' });
      return;
    }

    await dbOps.donationRequests.delete(req.params.id);
    res.json({ messageKey: 'requests.deleted' });
  } catch (err) {
    logger.error('Delete request error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.post('/:id/fulfill', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { meals_count, notes } = req.body;
    if (!meals_count || meals_count < 1) {
      res.status(400).json({ messageKey: 'validation.required_field' });
      return;
    }

    const request = await dbOps.donationRequests.findById(req.params.id);
    if (!request) {
      res.status(404).json({ messageKey: 'requests.not_found' });
      return;
    }

    if (request.requester_id === req.userId) {
      res.status(400).json({ messageKey: 'requests.cannot_fulfill_own' });
      return;
    }

    if (request.status !== 'open' && request.status !== 'partially_fulfilled') {
      res.status(400).json({ messageKey: 'requests.not_open' });
      return;
    }

    const remaining = request.member_count - request.meals_fulfilled;
    if (meals_count > remaining) {
      res.status(400).json({ messageKey: 'requests.exceeds_needed', remaining });
      return;
    }

    const fulfillment = await dbOps.requestFulfillments.create(req.params.id, req.userId!, meals_count, notes || null);

    const newFulfilled = request.meals_fulfilled + meals_count;
    const updated = await dbOps.donationRequests.update(req.params.id, { meals_fulfilled: newFulfilled });
    await dbOps.donationRequests.updateStatus(req.params.id);

    emitRequestEvent('request_fulfilled', {
      requestId: req.params.id,
      title: request.title,
      meals_count,
      donorId: req.userId,
    });

    emitToUser(request.requester_id, 'request_fulfillment_notification', {
      requestId: req.params.id,
      title: request.title,
      meals_count,
      donorName: req.user?.name,
    });

    const finalStatus = newFulfilled >= request.member_count ? 'fulfilled' : 'partially_fulfilled';
    if (finalStatus === 'fulfilled') {
      emitRequestEvent('request_completed', {
        requestId: req.params.id,
        title: request.title,
      });
    }

    res.status(201).json({
      messageKey: 'requests.fulfilled',
      fulfillment,
      request: updated,
      remaining: Math.max(0, request.member_count - newFulfilled),
    });
  } catch (err) {
    logger.error('Fulfill request error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

export default router;
