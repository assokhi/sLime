const MAX_ROOM_SIZE = 4;

/**
 * Register all signaling event handlers for a connected socket.
 */
function registerSocketHandlers(io, socket, roomManager) {

  socket.on('room:join', ({ roomId, displayName }) => {
    if (!roomId || typeof roomId !== 'string') return;
    const safeName = String(displayName || 'Anonymous').slice(0, 30);
    const safeRoom = roomId.slice(0, 50);

    // Enforce room size limit (Mesh can't handle more than 4)
    if (roomManager.getParticipantCount(safeRoom) >= MAX_ROOM_SIZE) {
      socket.emit('room:full', { roomId: safeRoom });
      return;
    }

    // Get existing peers before joining
    const existingPeers = roomManager.join(safeRoom, socket.id, safeName);

    // Join the Socket.IO room for broadcasting
    socket.join(safeRoom);

    // Tell the new joiner about everyone already in the room
    socket.emit('room:joined', {
      roomId: safeRoom,
      peers: existingPeers
    });

    // Tell existing peers about the new joiner
    socket.to(safeRoom).emit('peer:joined', {
      socketId: socket.id,
      displayName: safeName
    });
  });

  // ----- WebRTC Signaling Relay -----

  socket.on('signal:offer', ({ to, sdp }) => {
    if (!to || !sdp) return;
    io.to(to).emit('signal:offer', {
      from: socket.id,
      sdp
    });
  });

  socket.on('signal:answer', ({ to, sdp }) => {
    if (!to || !sdp) return;
    io.to(to).emit('signal:answer', {
      from: socket.id,
      sdp
    });
  });

  socket.on('signal:ice-candidate', ({ to, candidate }) => {
    if (!to || !candidate) return;
    io.to(to).emit('signal:ice-candidate', {
      from: socket.id,
      candidate
    });
  });

  // ----- Disconnect -----

  socket.on('disconnect', () => {
    handleLeave(io, socket, roomManager);
  });

  socket.on('room:leave', () => {
    handleLeave(io, socket, roomManager);
  });
}

function handleLeave(io, socket, roomManager) {
  const roomId = roomManager.getRoomBySocket(socket.id);
  if (!roomId) return;

  roomManager.leave(roomId, socket.id);
  socket.to(roomId).emit('peer:left', { socketId: socket.id });
  socket.leave(roomId);
}

module.exports = { registerSocketHandlers };
