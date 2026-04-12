import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { v4 as uuidv4 } from 'uuid';
import { initDb, dbOps, warmupDatabase, pool, runMigrations } from './database';
import { i18nMiddleware } from './middleware/i18n';
import { generateToken } from './middleware/auth';
import { serviceAccount, firebaseInitialized } from './firebase-admin';
import { SERVER_ID, startServerRegistry, getHealthyServers } from './services/serverRegistry';
import { startMonitoring } from './services/monitor';
import { initSocket } from './config/socket';
import logger from './config/logger';
import authRoutes from './routes/auth';
import donationRoutes from './routes/donations';
import userRoutes from './routes/users';
import mapsRoutes from './routes/maps';
import chatRoutes from './routes/chat';
import supportRoutes from './routes/support';
import reviewsRoutes from './routes/reviews';
import adminRoutes from './routes/admin';
import pushRoutes from './routes/push';
import crashRoutes from './routes/crash';
import telegramRoutes from './routes/telegram';
import { setupBotCommands, bot } from './services/telegram';
import publicRoutes from './routes/public';
import { 
  helmetConfig, 
  cookieParserMiddleware, 
  strictCorsConfig, 
  additionalSecurityHeaders, 
  sanitizeRequest,
  validateSecurityConfig 
} from './middleware/security';
import { authLimiter, apiLimiter, createDonationLimiter } from './middleware/rateLimit';

import http from 'http';

validateSecurityConfig();

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);

app.use(helmetConfig);
app.use(cors(strictCorsConfig));
app.use(cookieParserMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(sanitizeRequest);
app.use(additionalSecurityHeaders);
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

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/donations', apiLimiter, donationRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/maps', apiLimiter, mapsRoutes);
app.use('/api/chat', apiLimiter, chatRoutes);
app.use('/api/support', apiLimiter, supportRoutes);
app.use('/api/reviews', apiLimiter, reviewsRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/crash', crashRoutes);
app.use('/api/telegram', telegramRoutes);

// Public API (for community/development)
app.use('/api/public', publicRoutes);

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
  startMonitoring();
  
  const httpServer = http.createServer(app);
  initSocket(httpServer);
  
  process.on('uncaughtException', async (error) => {
    console.error('Uncaught Exception:', error);
    logger.error(`[CRASH BACKEND] Uncaught Exception: ${error.message}`, {
      event: 'uncaughtException',
      message: error.message,
      stack_trace: error.stack
    });
    try {
      const crashId = await dbOps.crashLogs.create({
        crash_type: 'backend',
        severity: 'critical',
        title: `Uncaught Exception: ${error.message}`,
        message: error.message,
        stack_trace: error.stack,
        metadata: { event: 'uncaughtException' }
      });
      logger.error(`Backend crash logged with ID: ${crashId}`, { crashId, crash_type: 'backend' });
    } catch (logError) {
      logger.error('Failed to log crash:', logError);
    }
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger.error(`[CRASH BACKEND] Unhandled Rejection: ${error.message}`, {
      event: 'unhandledRejection',
      message: error.message,
      stack_trace: error.stack
    });
    try {
      const crashId = await dbOps.crashLogs.create({
        crash_type: 'backend',
        severity: 'error',
        title: `Unhandled Rejection: ${error.message}`,
        message: error.message,
        stack_trace: error.stack,
        metadata: { event: 'unhandledRejection' }
      });
      logger.error(`Backend crash logged with ID: ${crashId}`, { crashId, crash_type: 'backend' });
    } catch (logError) {
      logger.error('Failed to log crash:', logError);
    }
  });
  
  httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Server ID: ${SERVER_ID}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Initialize Telegram bot
    setupBotCommands();
    if (bot) {
      bot.launch().then(() => {
        logger.info('Telegram bot started successfully');
      }).catch((err: any) => {
        logger.error('Telegram bot failed to start:', err);
      });
    }
  });
}).catch(err => {
  logger.error('Failed to initialize database:', err);
  process.exit(1);
});

export default app;
