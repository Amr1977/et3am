import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getServerUrl } from '../services/api';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinDonationRoom: (donationId: string) => void;
  leaveDonationRoom: (donationId: string) => void;
  sendMessage: (donationId: string, message: string) => void;
  onNewMessage: (callback: (message: any) => void) => () => void;
  onChatNotification: (callback: (data: any) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const setupSocket = async () => {
      const serverUrl = await getServerUrl();
      
      const socketInstance = io(serverUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
      });

      socketInstance.on('connect', () => {
        console.log('[Socket] Connected to', serverUrl);
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('[Socket] Disconnected');
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('[Socket] Connection error:', error.message);
        setIsConnected(false);
      });

      setSocket(socketInstance);
    };

    setupSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [token, isAuthenticated]);

  const joinDonationRoom = (donationId: string) => {
    socket?.emit('join_donation', { donationId });
  };

  const leaveDonationRoom = (donationId: string) => {
    socket?.emit('leave_donation', { donationId });
  };

  const sendMessage = (donationId: string, message: string) => {
    socket?.emit('send_message', { donationId, message });
  };

  const onNewMessage = (callback: (message: any) => void) => {
    socket?.on('new_message', callback);
    return () => {
      socket?.off('new_message', callback);
    };
  };

  const onChatNotification = (callback: (data: any) => void) => {
    socket?.on('chat_notification', callback);
    return () => {
      socket?.off('chat_notification', callback);
    };
  };

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      joinDonationRoom,
      leaveDonationRoom,
      sendMessage,
      onNewMessage,
      onChatNotification,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}