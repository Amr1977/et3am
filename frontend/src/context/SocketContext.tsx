import React, { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
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
  onAdminNotification: (callback: (data: any) => void) => () => void;
  joinRequestRoom: (requestId: string) => void;
  leaveRequestRoom: (requestId: string) => void;
  sendRequestMessage: (requestId: string, message: string) => void;
}

interface QueuedListener {
  event: string;
  callback: (...args: any[]) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const listenerQueue = useRef<QueuedListener[]>([]);

  // Keep ref in sync
  socketRef.current = socket;

  // Flush queued listeners when socket connects
  useEffect(() => {
    if (!socket) return;
    if (listenerQueue.current.length === 0) return;

    for (const { event, callback } of listenerQueue.current) {
      socket.on(event, callback as any);
    }
    listenerQueue.current = [];
  }, [socket]);

  function on(event: string, callback: (...args: any[]) => void) {
    if (socketRef.current) {
      socketRef.current.on(event, callback as any);
    } else {
      listenerQueue.current.push({ event, callback });
    }
    return () => {
      socketRef.current?.off(event, callback as any);
    };
  }

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    let disconnected = false;

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

      if (!disconnected) {
        setSocket(socketInstance);
      }
    };

    setupSocket();

    return () => {
      disconnected = true;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token, isAuthenticated]);

  const joinDonationRoom = useCallback((donationId: string) => {
    socketRef.current?.emit('join_donation', { donationId });
  }, []);

  const leaveDonationRoom = useCallback((donationId: string) => {
    socketRef.current?.emit('leave_donation', { donationId });
  }, []);

  const sendMessage = useCallback((donationId: string, message: string) => {
    socketRef.current?.emit('send_message', { donationId, message });
  }, []);

  const joinRequestRoom = useCallback((requestId: string) => {
    socketRef.current?.emit('join_request', { requestId });
  }, []);

  const leaveRequestRoom = useCallback((requestId: string) => {
    socketRef.current?.emit('leave_request', { requestId });
  }, []);

  const sendRequestMessage = useCallback((requestId: string, message: string) => {
    socketRef.current?.emit('send_request_message', { requestId, message });
  }, []);

  const onNewMessage = useCallback((callback: (message: any) => void) => {
    return on('new_message', callback);
  }, []);

  const onChatNotification = useCallback((callback: (data: any) => void) => {
    return on('chat_notification', callback);
  }, []);

  const onAdminNotification = useCallback((callback: (data: any) => void) => {
    const unsub1 = on('new_user_registered', callback);
    const unsub2 = on('new_donation_added', callback);
    const unsub3 = on('meal_picked_up', callback);
    const unsub4 = on('donation_completed', callback);
    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    };
  }, []);

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      joinDonationRoom,
      leaveDonationRoom,
      sendMessage,
      onNewMessage,
      onChatNotification,
      onAdminNotification,
      joinRequestRoom,
      leaveRequestRoom,
      sendRequestMessage,
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