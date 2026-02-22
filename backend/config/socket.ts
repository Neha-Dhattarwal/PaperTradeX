
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import * as yahooService from '../services/yahooService';

let io: Server;
const activeSubscriptions = new Map<string, NodeJS.Timeout>();

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: '*', // In production, restrict this to your frontend URL
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('subscribe_price', (symbol: string) => {
      socket.join(symbol);
      console.log(`User ${socket.id} subscribed to price: ${symbol}`);
      
      if (!activeSubscriptions.has(symbol)) {
        const interval = setInterval(async () => {
          try {
            const quote = await yahooService.getLivePrice(symbol);
            io.to(symbol).emit('price_update', quote);
          } catch (error) {
            console.error(`Socket update error for ${symbol}:`, error);
          }
        }, 5000); // 5 second updates
        activeSubscriptions.set(symbol, interval);
      }
    });

    socket.on('unsubscribe_price', (symbol: string) => {
      socket.leave(symbol);
      // Clean up interval if no more users in room
      const room = io.sockets.adapter.rooms.get(symbol);
      if (!room || room.size === 0) {
        clearInterval(activeSubscriptions.get(symbol));
        activeSubscriptions.delete(symbol);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
