import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useSound } from '../context/SoundContext';
import { fetchWithFailover } from '../services/api';

interface Message {
  id: string;
  donation_id?: string;
  request_id?: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  sender_avatar: string | null;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

interface ChatItem {
  type: 'message' | 'date';
  date?: string;
  msg?: Message;
}

export default function Chat() {
  const { donationId, requestId } = useParams<{ donationId?: string; requestId?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, token, isAuthenticated } = useAuth();
  const { joinDonationRoom, leaveDonationRoom, sendMessage, joinRequestRoom, leaveRequestRoom, sendRequestMessage, onNewMessage, onChatNotification, isConnected } = useSocket();
  const { playSound } = useSound();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isRequestChat = !!requestId;

  const chatItems = useMemo<ChatItem[]>(() => {
    if (messages.length === 0) return [];
    const items: ChatItem[] = [];
    let lastDate = '';
    for (const msg of messages) {
      const msgDate = new Date(msg.created_at).toDateString();
      if (msgDate !== lastDate) {
        items.push({ type: 'date', date: msg.created_at });
        lastDate = msgDate;
      }
      items.push({ type: 'message', msg });
    }
    return items;
  }, [messages]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setError(t('auth.login_required'));
      return;
    }
    const chatId = donationId || requestId;
    if (!chatId) {
      setLoading(false);
      setError('Invalid chat');
      return;
    }

    const endpointPrefix = isRequestChat ? `/api/chat/request/${requestId}` : `/api/chat/${donationId}`;

    const fetchMessages = async () => {
      try {
        const res = await fetchWithFailover(endpointPrefix, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages);
        } else {
          const body = await res.json().catch(() => ({}));
          setError(body.messageKey || t('chat.error'));
        }
      } catch (err) {
        setError(t('chat.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    if (isRequestChat && requestId) {
      joinRequestRoom(requestId);
    } else if (donationId) {
      joinDonationRoom(donationId);
    }

    const unsubMessage = onNewMessage((msg: Message) => {
      const isRelevant = donationId ? msg.donation_id === donationId : msg.request_id === requestId;
      if (isRelevant) {
        setMessages(prev => [...prev, msg]);
        playSound('message');
      }
    });

    const unsubNotification = onChatNotification((data: any) => {
      const isRelevant = donationId ? data.donationId === donationId : data.requestId === requestId;
      if (isRelevant && data.senderId !== user?.id) {
        playSound('message');
      }
    });

    return () => {
      if (isRequestChat && requestId) {
        leaveRequestRoom(requestId);
      } else if (donationId) {
        leaveDonationRoom(donationId);
      }
      unsubMessage();
      unsubNotification();
    };
  }, [donationId, requestId, isRequestChat, isAuthenticated, token, isConnected]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !token) return;

    if (isRequestChat && requestId) {
      sendRequestMessage(requestId, newMessage.trim());
    } else if (donationId) {
      sendMessage(donationId, newMessage.trim());
    }
    setNewMessage('');
  };

  if (loading) {
    return (
      <div className="chat-loading">
        <div className="loading-spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="chat-header">
          <button className="chat-back-btn" onClick={() => navigate(-1)} aria-label="Back">
            ←
          </button>
          <div className="chat-header-info">
            <h2>{t('chat.title')}</h2>
            <span className="chat-subtitle">{t('chat.subtitle')}</span>
          </div>
        </div>

        <div className="chat-messages">
          {chatItems.length === 0 ? (
            <div className="chat-empty">
              <span className="chat-empty-icon">💬</span>
              <p>{t('chat.no_messages')}</p>
            </div>
          ) : (
            chatItems.map((item, idx) => {
              if (item.type === 'date') {
                return (
                  <div key={`date-${idx}`} className="chat-date-label">
                    <span>{formatDateLabel(item.date!)}</span>
                  </div>
                );
              }
              const msg = item.msg!;
              const isOwn = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`chat-message ${isOwn ? 'own' : 'other'}`}>
                  {!isOwn && (
                    <div className="message-sender-row">
                      <div className="message-avatar">{getInitials(msg.sender_name)}</div>
                      <span className="message-sender-name">{msg.sender_name}</span>
                    </div>
                  )}
                  <div className="message-bubble">
                    <p>{msg.message}</p>
                    <span className="message-time">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-form" onSubmit={handleSend}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('chat.placeholder')}
            className="chat-input"
          />
          <button type="submit" className="btn btn-primary" disabled={!newMessage.trim()}>
            {t('chat.send')}
          </button>
        </form>
      </div>
    </div>
  );
}