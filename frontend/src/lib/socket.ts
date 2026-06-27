import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSocket(
  url = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'
): Socket {
  // If socket exists and is already connected, return it immediately
  if (socket && socket.connected) return socket;

  // If socket exists but is disconnected, reconnect it
  if (socket && !socket.connected) {
    socket.connect();
    return socket;
  }

  // Create a fresh socket with robust reconnection settings
  socket = io(url, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    transports: ['websocket', 'polling'], // try websocket first, fall back to polling
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners(); // clean up all event listeners before disconnecting
    socket.disconnect();
    socket = null;
  }
}