import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import ACTIONS from './pages/Actions.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(express.static('build'));

const userSocketMap = {};

const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => ({
    socketId,
    username: userSocketMap[socketId],
    userId: io.sockets.sockets.get(socketId)?.data?.userId || '',
  }));
};

io.on('connection', (socket) => {
  socket.on(ACTIONS.JOIN, ({ roomId, username, userId }) => {
    if (!roomId || !username || !userId) {
      socket.emit(ACTIONS.JOIN_REJECTED, {
        reason: 'Missing room, username, or unique user id.',
      });
      return;
    }

    const roomSockets = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    const duplicateUserId = roomSockets.some((socketId) => {
      const roomSocket = io.sockets.sockets.get(socketId);
      return roomSocket?.data?.userId === userId;
    });

    if (duplicateUserId) {
      socket.emit(ACTIONS.JOIN_REJECTED, {
        reason: 'User id already exists in this room.',
      });
      return;
    }

    userSocketMap[socket.id] = username;
    socket.data.userId = userId;
    socket.join(roomId);

    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });

  });
  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });
  socket.on('disconnecting', () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      if (roomId === socket.id) return;
      socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
