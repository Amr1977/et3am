import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';
import { initDb, dbOps, warmupDatabase, pool, runMigrations } from './database';
import { i18nMiddleware } from './middleware/i18n';
import { generateToken } from './middleware/auth';
import { serviceAccount } from './firebase-admin';
import { SERVER_ID, startServerRegistry, getHealthyServers } from './services/serverRegistry';
import authRoutes from './routes/auth';
import donationRoutes from './routes/donations';
import userRoutes from './routes/users';
import mapsRoutes from './routes/maps';

let firebaseInitialized = false;

if (serviceAccount?.privateKey) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
    });
    firebaseInitialized = true;
    console.log('Firebase Admin initialized');
  } catch (err) {
    console.warn('Firebase Admin initialization failed:', err);
  }
} else {
  console.warn('Firebase private key not configured - Google auth via Firebase will be disabled');
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(i18nMiddleware);
app.use(passport.initialize());

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID || 'placeholder-google-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder-google-secret',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || `http://localhost:${PORT}/api/auth/google/callback`,
  },
  async (_accessToken: string, _refreshToken: string, profile: Profile, done) => {
    try {
      let user = await dbOps.users.findByGoogleId(profile.id);
      if (!user) {
        const email = profile.emails?.[0]?.value;
        if (email) {
          user = await dbOps.users.findByEmail(email);
          if (user) {
            user = await dbOps.users.update(user.id, {
              google_id: profile.id,
              avatar_url: profile.photos?.[0]?.value || null,
            });
          }
        }
        if (!user) {
          user = await dbOps.users.create({
            id: uuidv4(),
            name: profile.displayName || 'Google User',
            email: email || `google_${profile.id}@et3am.com`,
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
            preferred_language: 'en',
            google_id: profile.id,
            avatar_url: profile.photos?.[0]?.value || null,
          });
        }
      }
      done(null, user);
    } catch (err) {
      done(err as Error, undefined);
    }
  }
));

app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

app.get('/api/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=google' }),
  (req, res) => {
    const user = req.user as any;
    const token = generateToken(user.id, user.role);
    const redirectUrl = (process.env.FRONTEND_URL || 'http://localhost:5173') + `?token=${token}`;
    res.redirect(redirectUrl);
  }
);

app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/maps', mapsRoutes);

app.get('/api/health', (_req, res) => {
  const healthyServers = getHealthyServers();
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    serverId: SERVER_ID,
    healthyServers,
  });
});

app.get('/api/health/detailed', async (_req, res) => {
  try {
    const poolStats = {
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingClients: pool.waitingCount,
    };
    const dbResult = await pool.query('SELECT COUNT(*) as user_count FROM users');
    const healthyServers = getHealthyServers();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      serverId: SERVER_ID,
      poolStats,
      userCount: parseInt(dbResult.rows[0].user_count),
      healthyServers,
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: String(error) });
  }
});

initDb().then(async () => {
  await runMigrations();
  await warmupDatabase();
  await startServerRegistry();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Server ID: ${SERVER_ID}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

export default app;
