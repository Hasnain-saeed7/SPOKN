import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSocket(url = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000')): Socket {
  if (!socket) {
    socket = io(url);
  }
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
