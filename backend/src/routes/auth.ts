import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { dbOps } from '../database';
import { authenticate, generateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', (req: AuthRequest, res: Response) => {
  const { name, email, password, role, phone, address, preferred_language } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ messageKey: 'validation.required_field' });
    return;
  }

  const existing = dbOps.users.findByEmail(email);
  if (existing) {
    res.status(409).json({ messageKey: 'auth.email_exists' });
    return;
  }

  const id = uuidv4();
  const hashedPassword = bcrypt.hashSync(password, 10);
  const lang = ['en', 'ar'].includes(preferred_language) ? preferred_language : (req as any).lang || 'en';

  const user = dbOps.users.create({
    id,
    name,
    email,
    password: hashedPassword,
    role: role || 'donor',
    phone: phone || null,
    address: address || null,
    preferred_language: lang as 'en' | 'ar',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const token = generateToken(id, user.role);

  res.status(201).json({
    messageKey: 'auth.register_success',
    token,
    user: { id, name, email, role: user.role, preferred_language: lang }
  });
});

router.post('/login', (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ messageKey: 'validation.required_field' });
    return;
  }

  const user = dbOps.users.findByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
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
      preferred_language: user.preferred_language
    }
  });
});

router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  const user = dbOps.users.findById(req.userId!);
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
      created_at: user.created_at
    }
  });
});

router.put('/language', authenticate, (req: AuthRequest, res: Response) => {
  const { preferred_language } = req.body;

  if (!['en', 'ar'].includes(preferred_language)) {
    res.status(400).json({ messageKey: 'validation.invalid_language' });
    return;
  }

  dbOps.users.update(req.userId!, { preferred_language });
  res.json({ messageKey: 'user.language_updated', preferred_language });
});

export default router;
