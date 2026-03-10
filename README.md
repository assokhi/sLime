<p align="center">
  <img src="assets/logo.png" width="500" alt="sLime Logo">
</p>

<h1 align="center">sLime Meet</h1>
<p align="center"><strong>Scalable Live Interaction Media — Browser-Based Video Meetings</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/Protocol-WebRTC-f97316?style=plastic&logo=webrtc&logoColor=white">
  <img src="https://img.shields.io/badge/Server-Node.js-3b82f6?style=plastic&logo=node.js&logoColor=white">
  <img src="https://img.shields.io/badge/Frontend-React-61dafb?style=plastic&logo=react&logoColor=white">
  <img src="https://img.shields.io/badge/Build-Vite-646cff?style=plastic&logo=vite&logoColor=white">
  <img src="https://img.shields.io/badge/Version-1.0_MVP-22c55e?style=plastic">
</p>

---

## Quick Start

```bash
# Install all dependencies (server + client)
npm install

# Build the React frontend
npm run build

# Start the production server
npm start
```

Open **http://localhost:3000** in your browser.

### Development Mode

```bash
# Run server + Vite dev server with hot reload
npm run dev
```

Vite dev server runs on `http://localhost:5173` with auto-proxy to the signaling server.

---

## How to Use

1. Open the app in your browser. Allow camera/microphone access when prompted.
2. **Create a room** — click "Create New Room" to generate a random room code.
3. **Join a room** — enter the room code in a second browser tab/window and click "Join".
4. Up to **4 participants** can join the same room (Mesh topology limit).

> **Tip:** To test locally, open two tabs to `http://localhost:3000` and join the same room code.

---

## Project Structure

```
sLime/
├── server/
│   ├── index.js              # Express + Socket.IO entry point
│   ├── roomManager.js        # In-memory room state
│   └── socketHandler.js      # Signaling event handlers
├── client/                   # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx           # Root component (router)
│   │   ├── main.jsx          # React entry point
│   │   ├── core/
│   │   │   ├── eventBus.js       # Central pub/sub system
│   │   │   ├── signalingClient.js# Socket.IO ↔ EventBus bridge
│   │   │   ├── webrtcManager.js  # RTCPeerConnection lifecycle
│   │   │   └── pluginManager.js  # Plugin registration system
│   │   ├── hooks/
│   │   │   └── useMeeting.js     # React hooks for meeting state
│   │   ├── components/
│   │   │   ├── JoinScreen.jsx    # Pre-join screen with video preview
│   │   │   ├── MeetScreen.jsx    # Main meeting view + video grid
│   │   │   ├── ControlsBar.jsx   # Floating controls (mic/cam/leave)
│   │   │   ├── VideoTile.jsx     # Individual video participant tile
│   │   │   └── VideoPreview.jsx  # Camera preview on join screen
│   │   └── styles/               # Component-scoped CSS
│   └── vite.config.js
├── package.json
└── README.md
```

---

## Architecture

All modules communicate through a central **EventBus** — no module imports or calls another directly. This makes it trivial to add features via **plugins** in future versions.

```
EventBus (pub/sub spine)
  ├── SignalingClient   (WebSocket ↔ EventBus bridge)
  ├── WebRTCManager     (peer connections, media tracks)
  ├── React Components  (JoinScreen, MeetScreen, VideoTile, ...)
  │   └── useMeeting()  (React hook — subscribes to EventBus)
  └── PluginManager     (register/unregister plugins)
```

### Adding a Plugin (V2+)

```js
// Open browser console and register a plugin:
window.__sLime.pluginManager.register({
  name: 'my-feature',
  init(eventBus) {
    eventBus.on('some:event', (data) => { /* ... */ });
  },
  destroy(eventBus) {
    eventBus.off('some:event');
  }
});
```

---

## Version Roadmap

| Version | Scope |
|---------|-------|
| **V1** (current) | P2P Mesh calls (≤4 users), signaling, basic UI |
| **V2** | Screen share, text chat, emoji reactions (plugins) |
| **V3** | SFU (Mediasoup), Simulcast, lobby, admin controls |
| **V4** | SFU cascading, Kubernetes, geo-routing, WebTransport |

---

## License

MIT