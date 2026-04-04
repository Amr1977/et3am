import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { dbOps, User } from '../database';
import { authenticate, generateToken, AuthRequest } from '../middleware/auth';
import logger from '../config/logger';

const router = Router();

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, preferred_language, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ messageKey: 'validation.required_field' });
      return;
    }

    const existing = await dbOps.users.findByEmail(email);
    if (existing) {
      (logger as any).auth('Registration failed - email exists', { email });
      res.status(409).json({ messageKey: 'auth.email_exists' });
      return;
    }

    const id = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);
    const lang = ['en', 'ar'].includes(preferred_language) ? preferred_language : (req as any).lang || 'en';
    
    const userRole = ['donor', 'recipient', 'admin'].includes(role) ? role : 'donor';

    (logger as any).auth('New user registration', { userId: id, email, role: userRole });

    const user = await dbOps.users.create({
      id,
      name,
      email,
      password: hashedPassword,
      role: userRole,
      can_donate: true,
      can_receive: true,
      phone: null,
      address: null,
      latitude: null,
      longitude: null,
      location_city: null,
      location_area: null,
      preferred_language: lang as 'en' | 'ar',
      google_id: null,
      avatar_url: null,
    });

    const token = generateToken(id, user.role);

    res.status(201).json({
      messageKey: 'auth.register_success',
      token,
      user: { id, name, email, role: user.role, can_donate: user.can_donate, can_receive: user.can_receive, preferred_language: lang }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ messageKey: 'validation.required_field' });
      return;
    }

    const user = await dbOps.users.findByEmail(email);
    console.log('Login attempt:', email);
    console.log('User found:', !!user);
    console.log('User object:', JSON.stringify(user).substring(0, 200));
    console.log('Password in user:', user?.password?.substring(0, 30));
    if (!user || !user.password) {
      res.status(401).json({ messageKey: 'auth.invalid_credentials' });
      return;
    }
    
    const passwordValid = bcrypt.compareSync(password, user.password);
    console.log('Password valid:', passwordValid);
    console.log('Attempting bcrypt directly on user.password:');
    console.log('  bcrypt.compareSync:', bcrypt.compareSync(password, user.password));
    if (!passwordValid && user.password.startsWith('$2a$')) {
      const newHash = user.password.replace('$2a$', '$2b$');
      const newValid = bcrypt.compareSync(password, newHash);
      if (!newValid) {
        res.status(401).json({ messageKey: 'auth.invalid_credentials' });
        return;
      }
    } else if (!passwordValid) {
      res.status(401).json({ messageKey: 'auth.invalid_credentials' });
      return;
    }

    const token = generateToken(user.id, user.role);

    res.json({
      messageKey: 'auth.login_success',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        can_donate: user.can_donate,
        can_receive: user.can_receive,
        phone: user.phone,
        address: user.address,
        preferred_language: user.preferred_language,
        avatar_url: user.avatar_url,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
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
        phone: user.phone,
        address: user.address,
        preferred_language: user.preferred_language,
        avatar_url: user.avatar_url,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.put('/language', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { preferred_language } = req.body;

    if (!['en', 'ar'].includes(preferred_language)) {
      res.status(400).json({ messageKey: 'validation.invalid_language' });
      return;
    }

    await dbOps.users.update(req.userId!, { preferred_language });
    res.json({ messageKey: 'user.language_updated', preferred_language });
  } catch (err) {
    console.error('Language update error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.put('/location', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { latitude, longitude, city, area } = req.body;

    if (latitude == null || longitude == null) {
      res.status(400).json({ messageKey: 'validation.required_field', message: 'Latitude and longitude are required' });
      return;
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      res.status(400).json({ messageKey: 'validation.invalid_coordinates', message: 'Invalid coordinates' });
      return;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      res.status(400).json({ messageKey: 'validation.invalid_coordinates', message: 'Coordinates out of range' });
      return;
    }

    const locationData: Partial<User> = {
      latitude,
      longitude,
      location_city: city || null,
      location_area: area || null,
    };

    if (!city || !area) {
      const { reverseGeocode } = await import('../services/geocoding');
      const geoResult = await reverseGeocode(latitude, longitude);
      locationData.location_city = geoResult.city;
      locationData.location_area = geoResult.area;
    }

    const updatedUser = await dbOps.users.update(req.userId!, locationData);

    if (!updatedUser) {
      res.status(404).json({ messageKey: 'user.not_found' });
      return;
    }

    res.json({
      messageKey: 'user.location_updated',
      location: {
        latitude: updatedUser.latitude,
        longitude: updatedUser.longitude,
        city: updatedUser.location_city,
        area: updatedUser.location_area,
      },
    });
  } catch (err) {
    console.error('Location update error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.post('/google', async (req: AuthRequest, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({ messageKey: 'validation.required_field' });
      return;
    }

    let admin;
    try {
      admin = require('firebase-admin');
    } catch {
      res.status(503).json({ messageKey: 'auth.google_not_available' });
      return;
    }

    if (!admin.apps.length) {
      res.status(503).json({ messageKey: 'auth.google_not_available' });
      return;
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    let user = await dbOps.users.findByGoogleId(uid);

    if (!user) {
      user = await dbOps.users.findByEmail(email!);
      if (user) {
        await dbOps.users.update(user.id, { google_id: uid });
        user.google_id = uid;
      }
    }

    if (!user) {
      const id = uuidv4();
      const lang = (req as any).lang || 'en';

      user = await dbOps.users.create({
        id,
        name: name || email?.split('@')[0] || 'User',
        email: email!,
        password: null,
        role: 'donor',
        can_donate: true,
        can_receive: true,
        phone: null,
        address: null,
        latitude: null,
        longitude: null,
        location_city: null,
        location_area: null,
        preferred_language: lang as 'en' | 'ar',
        google_id: uid,
        avatar_url: picture || null,
      });
    }

    const token = generateToken(user.id, user.role);

    res.json({
      messageKey: 'auth.login_success',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        can_donate: user.can_donate,
        can_receive: user.can_receive,
        phone: user.phone,
        address: user.address,
        preferred_language: user.preferred_language,
        avatar_url: user.avatar_url,
      }
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

export default router;

router.post('/test-db-user', async (req, res) => {
  const { email } = req.body;
  const user = await dbOps.users.findByEmail(email);
  const hashFromDb = user?.password;
  const valid = bcrypt.compareSync('REDACTED_PASSWORD', hashFromDb || '');
  res.json({ 
    email, 
    userFound: !!user, 
    hashFromDb: hashFromDb?.substring(0, 40),
    bcryptValid: valid,
    testHashValid: hashFromDb === '$2a$10$9CHGqCdG.YGfiPnSDLaNVuao.XppiIaTRc33jplZjy3xGdFxm7p.2'
  });
});
