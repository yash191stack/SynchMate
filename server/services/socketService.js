import { Server } from 'socket.io';
import Message from '../models/Message.js';

let io = null;
const activeConnections = new Map(); // Maps userId -> socketId

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Allow broad connections in development
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    socket.on('identify', (userId) => {
      if (userId) {
        activeConnections.set(userId.toString(), socket.id);
        console.log(`User identified: ${userId} -> Socket: ${socket.id}`);
      }
    });

    // Real-time message exchange and db persistence
    socket.on('send_message', async (data) => {
      try {
        const { senderId, recipientId, text } = data;
        
        if (!senderId || !recipientId || !text) return;

        // Persist message record in DB
        const savedMessage = await Message.create({
          sender: senderId,
          recipient: recipientId,
          text: text
        });

        // Pack message for socket dispatch
        const packedMsg = {
          _id: savedMessage._id,
          senderId,
          recipientId,
          text,
          timestamp: savedMessage.createdAt
        };

        // Emit message back to sender (acknowledgement)
        socket.emit('receive_message', packedMsg);

        // Deliver to recipient socket if online
        const recipientSocketId = activeConnections.get(recipientId.toString());
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('receive_message', packedMsg);
        }
      } catch (err) {
        console.error('Socket send_message handler failed:', err);
      }
    });

    socket.on('disconnect', () => {
      for (const [userId, socketId] of activeConnections.entries()) {
        if (socketId === socket.id) {
          activeConnections.delete(userId);
          console.log(`Socket disconnect cleaned mapping for user: ${userId}`);
          break;
        }
      }
    });
  });

  return io;
};

/**
 * Sends real-time notification to matched parties
 */
export const notifyMatch = (userAId, userBId, matchInfo) => {
  if (!io) return;

  const socketA = activeConnections.get(userAId.toString());
  const socketB = activeConnections.get(userBId.toString());

  if (socketA) {
    io.to(socketA).emit('match_created', matchInfo);
  }
  if (socketB) {
    io.to(socketB).emit('match_created', matchInfo);
  }
};

/**
 * Gets a user's active socket ID for custom delivery (like chat)
 */
export const getActiveSocket = (userId) => {
  return activeConnections.get(userId.toString());
};

export const getIO = () => io;
