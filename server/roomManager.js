/**
 * RoomManager — in-memory room state.
 * Maps roomId → Map<socketId, { displayName }>
 */
class RoomManager {
  constructor() {
    /** @type {Map<string, Map<string, { displayName: string }>>} */
    this.rooms = new Map();
  }

  /** Create room if needed, add participant. Returns list of existing peer IDs. */
  join(roomId, socketId, displayName) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Map());
    }
    const room = this.rooms.get(roomId);
    const existingPeers = Array.from(room.entries()).map(([id, meta]) => ({
      socketId: id,
      displayName: meta.displayName
    }));
    room.set(socketId, { displayName });
    return existingPeers;
  }

  /** Remove participant. Deletes room if empty. Returns true if room still exists. */
  leave(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    room.delete(socketId);
    if (room.size === 0) {
      this.rooms.delete(roomId);
      return false;
    }
    return true;
  }

  /** Find which room a socket is in. */
  getRoomBySocket(socketId) {
    for (const [roomId, room] of this.rooms) {
      if (room.has(socketId)) return roomId;
    }
    return null;
  }

  /** Get participant count for a room. */
  getParticipantCount(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.size : 0;
  }
}

module.exports = { RoomManager };
