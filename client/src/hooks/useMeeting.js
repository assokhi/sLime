import { useState, useEffect, useRef, useCallback } from 'react';
import eventBus from '../core/eventBus';
import signalingClient from '../core/signalingClient';
import webrtcManager from '../core/webrtcManager';

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

  useEffect(() => {
    signalingClient.connect();

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
