import { Server } from 'socket.io';

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
