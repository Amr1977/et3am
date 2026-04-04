import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { dbOps } from '../database';

const JWT_SECRET = process.env.JWT_SECRET || 'et3am-secret-key-2024';

let io: SocketIOServer | null = null;

export function initSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
      const user = await dbOps.users.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.userId = decoded.userId;
      socket.data.userRole = decoded.role;
      socket.data.userName = user.name;

      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    socket.join(`user_${userId}`);

    console.log(`[Socket] User ${userId} connected: ${socket.id}`);

    socket.on('join_donation', async (data) => {
      const { donationId } = data;
      
      try {
        const donation = await dbOps.donations.findById(donationId);
        if (!donation) {
          socket.emit('error', { message: 'Donation not found' });
          return;
        }

        const isParticipant = donation.donor_id === userId || donation.reserved_by === userId;
        if (!isParticipant) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        socket.join(`donation_${donationId}`);
        console.log(`[Socket] User ${userId} joined donation room: ${donationId}`);
      } catch (error) {
        console.error('[Socket] Join donation error:', error);
        socket.emit('error', { message: 'Failed to join donation chat' });
      }
    });

    socket.on('leave_donation', (data) => {
      const { donationId } = data;
      socket.leave(`donation_${donationId}`);
    });

    socket.on('send_message', async (data) => {
      const { donationId, message } = data;
      
      try {
        const donation = await dbOps.donations.findById(donationId);
        if (!donation || donation.status !== 'reserved') {
          socket.emit('error', { message: 'Donation not available for chat' });
          return;
        }

        const receiverId = donation.donor_id === userId ? donation.reserved_by : donation.donor_id;
        if (!receiverId) {
          socket.emit('error', { message: 'No participant found' });
          return;
        }

        const savedMessage = await dbOps.chat.create(donationId, userId, receiverId, message);
        const user = await dbOps.users.findById(userId);
        
        const messageWithSender = {
          ...savedMessage,
          sender_name: user?.name || 'Unknown',
          sender_avatar: user?.avatar_url || null,
        };

        io?.to(`donation_${donationId}`).emit('new_message', messageWithSender);
        io?.to(`user_${receiverId}`).emit('chat_notification', {
          donationId,
          senderId: userId,
          senderName: user?.name,
        });
      } catch (error) {
        console.error('[Socket] Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] User ${userId} disconnected: ${reason}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitDonationEvent(event: string, data: any): void {
  if (io) {
    io.emit(event, data);
  }
}

export function emitToDonationRoom(donationId: string, event: string, data: any): void {
  if (io) {
    io.to(`donation_${donationId}`).emit(event, data);
  }
}

export function emitToUser(userId: string, event: string, data: any): void {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
}