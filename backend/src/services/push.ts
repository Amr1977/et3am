import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

const distPath = dirname(require.main?.filename || __filename || './');
const basePath = distPath.includes('dist') ? join(distPath, '..') : distPath;
const envPath = join(basePath, '.env.production');
const devEnvPath = join(basePath, '.env');

if (existsSync(envPath)) {
  console.log('[push] Loading production env from:', envPath);
  dotenv.config({ path: envPath });
} else if (existsSync(devEnvPath)) {
  console.log('[push] Loading dev env from:', devEnvPath);
  dotenv.config({ path: devEnvPath });
} else {
  dotenv.config();
}

import { pool } from '../database';
import logger from '../config/logger';
import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@et3am.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

interface PushSubscription {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at?: string;
}

export const pushService = {
  async saveSubscription(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    const existing = await pool.query(
      'SELECT id FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2',
      [userId, subscription.endpoint]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE push_subscriptions SET p256dh = $1, auth = $2, updated_at = NOW() WHERE user_id = $3 AND endpoint = $4',
        [subscription.keys.p256dh, subscription.keys.auth, userId, subscription.endpoint]
      );
    } else {
      await pool.query(
        'INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES ($1, $2, $3, $4)',
        [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
      );
    }
  },

  async removeSubscription(userId: string, endpoint?: string) {
    if (endpoint) {
      await pool.query('DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2', [userId, endpoint]);
    } else {
      await pool.query('DELETE FROM push_subscriptions WHERE user_id = $1', [userId]);
    }
  },

  async getSubscriptions(userId: string): Promise<PushSubscription[]> {
    const result = await pool.query(
      'SELECT * FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );
    return result.rows;
  },

  async getAllSubscriptions(): Promise<PushSubscription[]> {
    const result = await pool.query('SELECT * FROM push_subscriptions');
    return result.rows;
  },

  async sendPushNotification(userId: string, title: string, body?: string, data?: Record<string, any>) {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return;
    }

    const subs = await this.getSubscriptions(userId);
    if (subs.length === 0) return;

    let url = '/';
    if (data) {
      if (data.donation_id) {
        url = `/donations/${data.donation_id}`;
      } else if (data.request_id) {
        url = `/requests/${data.request_id}`;
      }
    }

    const payload = JSON.stringify({
      title,
      body: body || '',
      data: url,
      icon: '/images/defaulticon.png',
      badge: '/images/defaulticon.png',
    });

    for (const sub of subs) {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        }, payload);
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await this.removeSubscription(userId, sub.endpoint);
        } else {
          logger.error(`[Push] Send failed for ${userId}:`, err.message);
        }
      }
    }
  },

  vapidPublicKey: VAPID_PUBLIC_KEY,
};

export default pushService;
