const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { RoomManager } = require('./roomManager');
const { registerSocketHandlers } = require('./socketHandler');

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Serve static client files (React build output)
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// Catch-all: serve index.html for any route (SPA-style room URLs)
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

const roomManager = new RoomManager();

io.on('connection', (socket) => {
  registerSocketHandlers(io, socket, roomManager);
});

server.listen(PORT, () => {
  console.log(`sLime Meet signaling server running on http://localhost:${PORT}`);
});
