import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useSound } from '../context/SoundContext';
import { fetchWithFailover } from '../services/api';

interface Message {
  id: string;
  donation_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  sender_avatar: string | null;
}

export default function Chat() {
  const { donationId } = useParams<{ donationId: string }>();
  const { t } = useTranslation();
  const { user, token, isAuthenticated } = useAuth();
  const { joinDonationRoom, leaveDonationRoom, sendMessage, onNewMessage, onChatNotification } = useSocket();
  const { playSound } = useSound();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!donationId || !isAuthenticated) return;

    const fetchMessages = async () => {
      try {
        const res = await fetchWithFailover(`/api/chat/${donationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages);
        }
      } catch (err) {
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    joinDonationRoom(donationId);

    const unsubMessage = onNewMessage((msg: Message) => {
      if (msg.donation_id === donationId) {
        setMessages(prev => [...prev, msg]);
        playSound('message');
      }
    });

    const unsubNotification = onChatNotification((data: any) => {
      if (data.donationId === donationId && data.senderId !== user?.id) {
        playSound('message');
      }
    });

    return () => {
      leaveDonationRoom(donationId);
      unsubMessage();
      unsubNotification();
    };
  }, [donationId, isAuthenticated, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !donationId || !token) return;

    sendMessage(donationId, newMessage.trim());
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
          <h2>{t('chat.title')}</h2>
          <span className="chat-subtitle">{t('chat.subtitle')}</span>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <span className="chat-empty-icon">💬</span>
              <p>{t('chat.no_messages')}</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`chat-message ${isOwn ? 'own' : 'other'}`}>
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