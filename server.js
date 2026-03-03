import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import ACTIONS from './src/pages/Actions.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.get('/', (_req, res) => {
  res.send('Socket server running');
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
    if (err) {
      next(err);
    }
  });
});

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

    socket.join(roomId);
    socket.data.username = username;
    socket.data.userId = userId;

    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
      const s = io.sockets.sockets.get(socketId);
      return {
        socketId,
        username: s?.data?.username || 'User',
        userId: s?.data?.userId || '',
      };
    });

    io.to(roomId).emit(ACTIONS.JOINED, {
      clients,
      username,
      socketId: socket.id,
    });
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on('disconnecting', () => {
    socket.rooms.forEach((roomId) => {
      if (roomId !== socket.id) {
        socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
          socketId: socket.id,
          username: socket.data?.username,
        });
      }
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
