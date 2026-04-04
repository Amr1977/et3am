import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { dbOps, User } from '../database';
import { authenticate, generateToken, AuthRequest } from '../middleware/auth';
import { registerSchema, loginSchema } from '../utils/validators';
import { sanitizeString, sanitizeEmail } from '../utils/sanitizers';
import logger from '../config/logger';

const router = Router();

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ messageKey: 'validation.invalid_input', errors: validation.error.errors });
      return;
    }

    const { name, email, password, preferred_language, role } = req.body;
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedName = sanitizeString(name, 255);

    const existing = await dbOps.users.findByEmail(sanitizedEmail);
    if (existing) {
      (logger as any).auth('Registration failed - email exists', { email: sanitizedEmail });
      res.status(409).json({ messageKey: 'auth.email_exists' });
      return;
    }

    const id = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);
    const lang = ['en', 'ar'].includes(preferred_language) ? preferred_language : (req as any).lang || 'en';
    
    const userRole = ['donor', 'recipient', 'admin'].includes(role) ? role : 'donor';

    (logger as any).auth('New user registration', { userId: id, email: sanitizedEmail, role: userRole });

    const user = await dbOps.users.create({
      id,
      name: sanitizedName,
      email: sanitizedEmail,
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
      user: { id, name: sanitizedName, email: sanitizedEmail, role: user.role, can_donate: user.can_donate, can_receive: user.can_receive, preferred_language: lang }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ messageKey: 'validation.invalid_input', errors: validation.error.errors });
      return;
    }

    const { email, password } = req.body;
    const sanitizedEmail = sanitizeEmail(email);

    const user = await dbOps.users.findByEmail(sanitizedEmail);
    if (!user || !user.password) {
      res.status(401).json({ messageKey: 'auth.invalid_credentials' });
      return;
    }
    
    const passwordValid = bcrypt.compareSync(password, user.password);
    if (!passwordValid) {
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

// Password Reset - Request reset token
router.post('/reset-password-request', async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({ messageKey: 'validation.invalid_input' });
      return;
    }

    const sanitizedEmail = sanitizeEmail(email);
    const user = await dbOps.users.findByEmail(sanitizedEmail);

    // Always return success to prevent email enumeration
    if (!user) {
      res.json({ messageKey: 'auth.reset_email_sent' });
      return;
    }

    // Don't allow reset for Google OAuth users
    if (user.google_id) {
      res.json({ messageKey: 'auth.reset_email_sent' });
      return;
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await dbOps.users.update(user.id, {
      reset_token: resetToken,
      reset_token_expiry: resetTokenExpiry,
    } as any);

    (logger as any).auth('Password reset requested', { userId: user.id, email: sanitizedEmail });

    // In production, send email with reset link
    // For now, log the token (development only)
    console.log(`🔐 Password reset for ${sanitizedEmail}: ${resetToken}`);

    res.json({ messageKey: 'auth.reset_email_sent' });
  } catch (err) {
    console.error('Password reset request error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

// Password Reset - Verify token and set new password
router.post('/reset-password', async (req: AuthRequest, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ messageKey: 'validation.invalid_input' });
      return;
    }

    // Validate password strength
    if (newPassword.length < 6) {
      res.status(400).json({ messageKey: 'auth.weak_password' });
      return;
    }

    const user = await dbOps.users.findByResetToken(token);

    if (!user) {
      res.status(400).json({ messageKey: 'auth.invalid_reset_token' });
      return;
    }

    // Check if token expired
    if (user.reset_token_expiry && new Date(user.reset_token_expiry) < new Date()) {
      res.status(400).json({ messageKey: 'auth.reset_token_expired' });
      return;
    }

    // Hash new password and clear reset token
    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    await dbOps.users.update(user.id, {
      password: hashedPassword,
      reset_token: null,
      reset_token_expiry: null,
    } as any);

    (logger as any).auth('Password reset completed', { userId: user.id });

    res.json({ messageKey: 'auth.password_reset_success' });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ messageKey: 'general.server_error' });
  }
});

export default router;

router.post('/test-db-user', async (req, res) => {
  const { email } = req.body;
  const user = await dbOps.users.findByEmail(email);
  const hashFromDb = user?.password;
  
  // Test bcryptjs directly in the endpoint
  const bcrypt = require('bcryptjs');
  const testResult1 = bcrypt.compareSync('TestPass123', hashFromDb || '');
  const testResult2 = bcrypt.compareSync('TestPass123', '$2a$10$VamOWtj1Z2AQYOtEmTgrKezQwQIkqKsvXC0RIDLGDf6hrJE3Sid6m');
  
  // Manual comparison
  const testResult3 = await new Promise<boolean>((resolve) => {
    bcrypt.compare('TestPass123', hashFromDb || '', (err: Error | null, result: boolean) => {
      resolve(result);
    });
  });
  
  res.json({ 
    email, 
    userFound: !!user, 
    hashFromDb: hashFromDb?.substring(0, 40),
    bcryptAsyncValid: testResult3,
    bcryptSyncValid: testResult1,
    knownHashValid: testResult2
  });
});
