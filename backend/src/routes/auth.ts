import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { dbOps } from '../database';
import { authenticate, generateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role, phone, address, preferred_language } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ messageKey: 'validation.required_field' });
      return;
    }

    const existing = await dbOps.users.findByEmail(email);
    if (existing) {
      res.status(409).json({ messageKey: 'auth.email_exists' });
      return;
    }

    const id = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);
    const lang = ['en', 'ar'].includes(preferred_language) ? preferred_language : (req as any).lang || 'en';

    const user = await dbOps.users.create({
      id,
      name,
      email,
      password: hashedPassword,
      role: role || 'donor',
      phone: phone || null,
      address: address || null,
      preferred_language: lang as 'en' | 'ar',
      google_id: null,
      avatar_url: null,
    });

    const token = generateToken(id, user.role);

    res.status(201).json({
      messageKey: 'auth.register_success',
      token,
      user: { id, name, email, role: user.role, preferred_language: lang }
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
    if (!user || !user.password || !bcrypt.compareSync(password, user.password)) {
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
        phone: null,
        address: null,
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
