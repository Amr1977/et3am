import { pool } from '../database';
import { emitToUser } from '../config/socket';
import { pushService } from './push';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export const notificationService = {
  async create(
    userId: string,
    type: string,
    title: string,
    body?: string,
    data?: Record<string, any>
  ): Promise<Notification> {
    const { rows } = await pool.query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, type, title, body || null, JSON.stringify(data || {})]
    );
    const notification = rows[0];

    emitToUser(userId, 'new_notification', notification);

    pushService.sendPushNotification(userId, title, body, { type, ...data });

    return notification;
  },

  async getForUser(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ notifications: Notification[]; total: number; unread: number }> {
    const offset = (page - 1) * limit;
    const [notifResult, totalResult, unreadResult] = await Promise.all([
      pool.query(
        `SELECT * FROM notifications WHERE user_id = $1
         ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      ),
      pool.query('SELECT COUNT(*) as total FROM notifications WHERE user_id = $1', [userId]),
      pool.query(
        'SELECT COUNT(*) as unread FROM notifications WHERE user_id = $1 AND is_read = false',
        [userId]
      ),
    ]);

    return {
      notifications: notifResult.rows,
      total: parseInt(totalResult.rows[0].total),
      unread: parseInt(unreadResult.rows[0].unread),
    };
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { rows } = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return parseInt(rows[0].count);
  },

  async markAsRead(id: string, userId: string): Promise<void> {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
  },

  async markAllAsRead(userId: string): Promise<void> {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );
  },

  async delete(id: string, userId: string): Promise<void> {
    await pool.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [id, userId]);
  },
};

export default notificationService;
