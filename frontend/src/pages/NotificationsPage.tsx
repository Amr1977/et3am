import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../context/NotificationContext';

const typeIcons: Record<string, string> = {
  chat_message: '💬',
  reservation: '📌',
  cancellation: '❌',
  meal_received: '🍽️',
  completed: '✅',
  fulfillment: '🎁',
  admin: '🔔',
};

export default function NotificationsPage() {
  const { t } = useTranslation();
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  } = useNotifications();

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const handleClick = (n: typeof notifications[0]) => {
    if (!n.is_read) markAsRead(n.id);
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="main-content">
        <div className="notifications-page">
          <div className="notifications-loading">
            <div className="loading-spinner" />
            <p>{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="notifications-page">
        <div className="notifications-header">
          <h1>
            {t('notifications.title') || 'Notifications'}
            {unreadCount > 0 && <span className="notif-badge" style={{ position: 'relative', top: '-8px', transform: 'none', display: 'inline-block', marginLeft: '0.5rem' }}>{unreadCount}</span>}
          </h1>
          {unreadCount > 0 && (
            <button className="btn btn-outline btn-sm" onClick={markAllAsRead}>
              {t('notifications.mark_all_read') || 'Mark all as read'}
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="notifications-empty">
            <span className="notifications-empty-icon">🔔</span>
            <p>{t('notifications.empty') || 'No notifications yet'}</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`notification-card ${n.is_read ? '' : 'unread'}`}
                onClick={() => handleClick(n)}
              >
                <div className="notification-icon">
                  {typeIcons[n.type] || '🔔'}
                </div>
                <div className="notification-content">
                  <div className="notification-title">{n.title}</div>
                  {n.body && <div className="notification-body">{n.body}</div>}
                  <div className="notification-time">
                    {new Date(n.created_at).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
