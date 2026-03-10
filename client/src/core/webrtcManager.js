import eventBus from './eventBus';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

const DC_LABEL = 'sLimeData';

/**
 * WebRTCManager — manages RTCPeerConnection + DataChannel lifecycle per remote peer.
 */
class WebRTCManager {
  constructor() {
    /** @type {Map<string, RTCPeerConnection>} */
    this._peers = new Map();
    /** @type {Map<string, RTCDataChannel>} */
    this._dataChannels = new Map();
    /** @type {MediaStream|null} */
    this._localStream = null;
    /** @type {MediaStream|null} */
    this._screenStream = null;
    /** @type {Map<string, RTCRtpSender>} */
    this._videoSenders = new Map();
    this._bindEvents();
  }

  async acquireLocalStream(constraints = { video: true, audio: true }) {
    try {
      this._localStream = await navigator.mediaDevices.getUserMedia(constraints);
      eventBus.emit('media:local-stream-ready', { stream: this._localStream });
      return this._localStream;
    } catch (err) {
      console.error('[WebRTCManager] getUserMedia failed:', err);
      eventBus.emit('media:error', { error: err.message });
      return null;
    }
  }

  getLocalStream() {
    return this._localStream;
  }

  // ─── Screen Share ──────────────────────────────────────
  async startScreenShare() {
    try {
      this._screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      });
      const screenTrack = this._screenStream.getVideoTracks()[0];

      // Replace camera track with screen track in all peer connections
      for (const [remoteId, sender] of this._videoSenders) {
        await sender.replaceTrack(screenTrack);
      }

      // When user clicks browser's "Stop sharing" button
      screenTrack.onended = () => this.stopScreenShare();

      eventBus.emit('screenshare:started', { stream: this._screenStream });
      return this._screenStream;
    } catch (err) {
      console.error('[WebRTCManager] getDisplayMedia failed:', err);
      return null;
    }
  }

  async stopScreenShare() {
    if (!this._screenStream) return;

    // Stop screen tracks
    for (const track of this._screenStream.getTracks()) {
      track.stop();
    }
    this._screenStream = null;

    // Revert to camera track in all peer connections
    const camTrack = this._localStream?.getVideoTracks()[0];
    if (camTrack) {
      for (const [, sender] of this._videoSenders) {
        await sender.replaceTrack(camTrack);
      }
    }

    eventBus.emit('screenshare:stopped');
  }

  // ─── DataChannel ───────────────────────────────────────
  sendData(message) {
    const payload = JSON.stringify(message);
    for (const [, dc] of this._dataChannels) {
      if (dc.readyState === 'open') {
        dc.send(payload);
      }
    }
  }

  _setupDataChannel(dc, remoteId) {
    this._dataChannels.set(remoteId, dc);

    dc.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        eventBus.emit('datachannel:message', { from: remoteId, ...msg });
      } catch { /* ignore malformed */ }
    };

    dc.onclose = () => {
      this._dataChannels.delete(remoteId);
    };
  }

  _bindEvents() {
    eventBus.on('room:joined', ({ peers }) => {
      for (const peer of peers) {
        this._createPeerConnection(peer.socketId, true);
      }
    });

    eventBus.on('signal:offer', async ({ from, sdp }) => {
      let pc = this._peers.get(from);
      if (!pc) {
        pc = this._createPeerConnection(from, false);
      }
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      eventBus.emit('signal:send-answer', { to: from, sdp: pc.localDescription });
    });

    eventBus.on('signal:answer', async ({ from, sdp }) => {
      const pc = this._peers.get(from);
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    eventBus.on('signal:ice-candidate', async ({ from, candidate }) => {
      const pc = this._peers.get(from);
      if (!pc) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('[WebRTCManager] ICE candidate error:', err);
      }
    });

    eventBus.on('peer:left', ({ socketId }) => {
      this._closePeer(socketId);
    });

    eventBus.on('ui:toggle-mic', () => {
      if (!this._localStream) return;
      for (const track of this._localStream.getAudioTracks()) {
        track.enabled = !track.enabled;
        eventBus.emit('media:mic-toggled', { enabled: track.enabled });
      }
    });

    eventBus.on('ui:toggle-camera', () => {
      if (!this._localStream) return;
      for (const track of this._localStream.getVideoTracks()) {
        track.enabled = !track.enabled;
        eventBus.emit('media:camera-toggled', { enabled: track.enabled });
      }
    });

    eventBus.on('ui:leave', () => {
      this.destroy();
      eventBus.emit('room:leave');
    });

    // Plugin hook: send data via datachannel
    eventBus.on('datachannel:send', (message) => {
      this.sendData(message);
    });

    // Plugin hook: screen share toggle
    eventBus.on('ui:toggle-screenshare', () => {
      if (this._screenStream) {
        this.stopScreenShare();
      } else {
        this.startScreenShare();
      }
    });
  }

  _createPeerConnection(remoteId, isInitiator) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this._peers.set(remoteId, pc);

    if (this._localStream) {
      for (const track of this._localStream.getTracks()) {
        const sender = pc.addTrack(track, this._localStream);
        // Keep track of video sender for screen share replacement
        if (track.kind === 'video') {
          this._videoSenders.set(remoteId, sender);
        }
      }
    }

    // If currently screen sharing, replace the video track immediately
    if (this._screenStream) {
      const screenTrack = this._screenStream.getVideoTracks()[0];
      const sender = this._videoSenders.get(remoteId);
      if (sender && screenTrack) {
        sender.replaceTrack(screenTrack);
      }
    }

    // DataChannel: initiator creates, responder listens
    if (isInitiator) {
      const dc = pc.createDataChannel(DC_LABEL);
      this._setupDataChannel(dc, remoteId);
    } else {
      pc.ondatachannel = (event) => {
        this._setupDataChannel(event.channel, remoteId);
      };
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        eventBus.emit('signal:send-ice-candidate', {
          to: remoteId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      eventBus.emit('media:remote-track-added', {
        socketId: remoteId,
        streams: event.streams,
        track: event.track
      });
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        this._closePeer(remoteId);
        eventBus.emit('peer:connection-lost', { socketId: remoteId });
      }
    };

    if (isInitiator) {
      this._negotiate(pc, remoteId);
    }

    return pc;
  }

  async _negotiate(pc, remoteId) {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      eventBus.emit('signal:send-offer', { to: remoteId, sdp: pc.localDescription });
    } catch (err) {
      console.error('[WebRTCManager] Negotiation failed:', err);
    }
  }

  _closePeer(remoteId) {
    const pc = this._peers.get(remoteId);
    if (!pc) return;
    pc.close();
    this._peers.delete(remoteId);
    this._dataChannels.delete(remoteId);
    this._videoSenders.delete(remoteId);
    eventBus.emit('media:remote-track-removed', { socketId: remoteId });
  }

  destroy() {
    // Stop screen share if active
    if (this._screenStream) {
      for (const track of this._screenStream.getTracks()) track.stop();
      this._screenStream = null;
    }
    for (const [id] of this._peers) {
      this._closePeer(id);
    }
    if (this._localStream) {
      for (const track of this._localStream.getTracks()) {
        track.stop();
      }
      this._localStream = null;
    }
  }
}

const webrtcManager = new WebRTCManager();
export default webrtcManager;
