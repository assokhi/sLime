import eventBus from './eventBus';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

/**
 * WebRTCManager — manages RTCPeerConnection lifecycle per remote peer.
 */
class WebRTCManager {
  constructor() {
    /** @type {Map<string, RTCPeerConnection>} */
    this._peers = new Map();
    /** @type {MediaStream|null} */
    this._localStream = null;
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

    // Plugin hook: add extra tracks
    eventBus.on('media:add-track', ({ track }) => {
      for (const [, pc] of this._peers) {
        pc.addTrack(track, this._localStream);
      }
    });
  }

  _createPeerConnection(remoteId, isInitiator) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this._peers.set(remoteId, pc);

    if (this._localStream) {
      for (const track of this._localStream.getTracks()) {
        pc.addTrack(track, this._localStream);
      }
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
    eventBus.emit('media:remote-track-removed', { socketId: remoteId });
  }

  destroy() {
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
