import { io } from 'socket.io-client';
import eventBus from './eventBus';

/**
 * SignalingClient — bridges Socket.IO ↔ EventBus.
 */
class SignalingClient {
  constructor() {
    this._socket = null;
  }

  connect(serverUrl) {
    const url = serverUrl || window.location.origin;
    this._socket = io(url, { transports: ['websocket', 'polling'] });

    // Incoming from server → EventBus
    this._socket.on('connect', () => {
      eventBus.emit('signaling:connected', { socketId: this._socket.id });
    });

    this._socket.on('disconnect', (reason) => {
      eventBus.emit('signaling:disconnected', { reason });
    });

    const relayEvents = [
      'room:joined', 'room:full', 'peer:joined', 'peer:left',
      'signal:offer', 'signal:answer', 'signal:ice-candidate'
    ];
    for (const evt of relayEvents) {
      this._socket.on(evt, (data) => eventBus.emit(evt, data));
    }

    // Outgoing: EventBus → server
    eventBus.on('signal:send-offer', ({ to, sdp }) => {
      this._socket?.emit('signal:offer', { to, sdp });
    });

    eventBus.on('signal:send-answer', ({ to, sdp }) => {
      this._socket?.emit('signal:answer', { to, sdp });
    });

    eventBus.on('signal:send-ice-candidate', ({ to, candidate }) => {
      this._socket?.emit('signal:ice-candidate', { to, candidate });
    });

    eventBus.on('room:join', ({ roomId, displayName }) => {
      this._socket?.emit('room:join', { roomId, displayName });
    });

    eventBus.on('room:leave', () => {
      this._socket?.emit('room:leave');
    });
  }

  get socketId() {
    return this._socket?.id ?? null;
  }

  disconnect() {
    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
    }
  }
}

const signalingClient = new SignalingClient();
export default signalingClient;
