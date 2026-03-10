import { useState, useEffect, useRef, useCallback } from 'react';
import eventBus from '../core/eventBus';
import signalingClient from '../core/signalingClient';
import webrtcManager from '../core/webrtcManager';
import PluginManager from '../core/pluginManager';
import screenSharePlugin from '../plugins/screenSharePlugin';
import chatPlugin from '../plugins/chatPlugin';
import emojiPlugin from '../plugins/emojiPlugin';

/**
 * useMediaStream — acquires local media and returns the stream.
 */
export function useLocalStream() {
  const [localStream, setLocalStream] = useState(null);
  const [mediaError, setMediaError] = useState(null);

  useEffect(() => {
    const unsubReady = eventBus.on('media:local-stream-ready', ({ stream }) => {
      setLocalStream(stream);
    });
    const unsubError = eventBus.on('media:error', ({ error }) => {
      setMediaError(error);
    });

    return () => { unsubReady(); unsubError(); };
  }, []);

  const acquire = useCallback(async () => {
    return webrtcManager.acquireLocalStream();
  }, []);

  return { localStream, mediaError, acquire };
}

/**
 * useMeeting — manages room state, peers, and remote streams.
 */
export function useMeeting() {
  const [inMeeting, setInMeeting] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [peers, setPeers] = useState([]); // [{ socketId, displayName }]
  const [remoteStreams, setRemoteStreams] = useState(new Map()); // socketId → MediaStream
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [roomFull, setRoomFull] = useState(false);
  const pluginManagerRef = useRef(null);

  useEffect(() => {
    signalingClient.connect();

    // Register V2 plugins
    const pm = new PluginManager(eventBus);
    pm.register(screenSharePlugin);
    pm.register(chatPlugin);
    pm.register(emojiPlugin);
    pluginManagerRef.current = pm;

    const unsubs = [
      eventBus.on('room:joined', ({ roomId: id, peers: existingPeers }) => {
        setRoomId(id);
        setPeers(existingPeers);
        setInMeeting(true);
        setRoomFull(false);
      }),

      eventBus.on('room:full', () => {
        setRoomFull(true);
        setTimeout(() => setRoomFull(false), 4000);
      }),

      eventBus.on('peer:joined', ({ socketId, displayName }) => {
        setPeers((prev) => {
          if (prev.some((p) => p.socketId === socketId)) return prev;
          return [...prev, { socketId, displayName }];
        });
      }),

      eventBus.on('peer:left', ({ socketId }) => {
        setPeers((prev) => prev.filter((p) => p.socketId !== socketId));
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.delete(socketId);
          return next;
        });
      }),

      eventBus.on('media:remote-track-added', ({ socketId, streams }) => {
        if (streams?.[0]) {
          setRemoteStreams((prev) => {
            const next = new Map(prev);
            next.set(socketId, streams[0]);
            return next;
          });
        }
      }),

      eventBus.on('media:remote-track-removed', ({ socketId }) => {
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.delete(socketId);
          return next;
        });
      }),

      eventBus.on('media:mic-toggled', ({ enabled }) => setIsMicOn(enabled)),
      eventBus.on('media:camera-toggled', ({ enabled }) => setIsCamOn(enabled)),
    ];

    return () => {
      unsubs.forEach((u) => u());
      pm.unregisterAll();
      signalingClient.disconnect();
    };
  }, []);

  const joinRoom = useCallback((id, displayName) => {
    eventBus.emit('room:join', { roomId: id, displayName });
  }, []);

  const leaveRoom = useCallback(() => {
    eventBus.emit('ui:leave');
    setInMeeting(false);
    setRoomId('');
    setPeers([]);
    setRemoteStreams(new Map());
    setIsMicOn(true);
    setIsCamOn(true);
  }, []);

  const toggleMic = useCallback(() => eventBus.emit('ui:toggle-mic'), []);
  const toggleCam = useCallback(() => eventBus.emit('ui:toggle-camera'), []);

  return {
    inMeeting, roomId, peers, remoteStreams,
    isMicOn, isCamOn, roomFull,
    joinRoom, leaveRoom, toggleMic, toggleCam
  };
}

/**
 * useScreenShare — tracks screen sharing state.
 */
export function useScreenShare() {
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    const unsubs = [
      eventBus.on('screenshare:started', () => setIsSharing(true)),
      eventBus.on('screenshare:stopped', () => setIsSharing(false)),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const toggleScreenShare = useCallback(() => {
    eventBus.emit('ui:toggle-screenshare');
  }, []);

  return { isSharing, toggleScreenShare };
}

/**
 * useChat — manages chat message history.
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const unsub = eventBus.on('chat:received', (msg) => {
      setMessages((prev) => [...prev, msg]);
      // Only increment unread when panel is closed and message is from remote
      if (!msg.isLocal) {
        setUnreadCount((prev) => prev + 1);
      }
    });
    return unsub;
  }, []);

  const sendMessage = useCallback((text, senderName) => {
    if (!text.trim()) return;
    eventBus.emit('chat:send', { text: text.trim(), senderName });
  }, []);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) setUnreadCount(0);
      return !prev;
    });
  }, []);

  return { messages, unreadCount, isOpen, sendMessage, openChat, closeChat, toggleChat };
}

/**
 * useEmoji — manages floating emoji reactions.
 */
export function useEmoji() {
  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    const unsub = eventBus.on('emoji:received', (reaction) => {
      setReactions((prev) => [...prev, reaction]);
      // Auto-remove after animation (3s)
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 3000);
    });
    return unsub;
  }, []);

  const sendEmoji = useCallback((emoji, senderName) => {
    eventBus.emit('emoji:send', { emoji, senderName });
  }, []);

  return { reactions, sendEmoji };
}
