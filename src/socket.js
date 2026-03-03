import { io } from 'socket.io-client';

export const initSocket = () => {
  const options = {
    forceNew: true,
    reconnectionAttempts: Infinity,
    timeout: 10000,
    transports: ['websocket'],
  };

  const socketURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  return io(socketURL, options);
};
