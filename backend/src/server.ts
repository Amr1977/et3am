import express from 'express';
import cors from 'cors';
import { initDb } from './database';
import { i18nMiddleware } from './middleware/i18n';
import authRoutes from './routes/auth';
import donationRoutes from './routes/donations';
import userRoutes from './routes/users';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(i18nMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

initDb();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
