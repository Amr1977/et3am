import dotenv from 'dotenv';
dotenv.config();

import { pool } from '../database';
import { emitToUser } from '../config/socket';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

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

  vapidPublicKey: VAPID_PUBLIC_KEY,
};

export default pushService;