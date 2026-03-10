import { useState, useRef, useEffect } from 'react';
import { Video, Plus, ArrowRight, AlertCircle } from 'lucide-react';
import VideoPreview from './VideoPreview';
import '../styles/JoinScreen.css';

export default function JoinScreen({ localStream, mediaError, roomFull, onJoin }) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const roomInputRef = useRef(null);

  function generateRoomId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const arr = new Uint8Array(8);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => chars[b % chars.length]).join('');
  }

  function handleJoin() {
    if (!roomCode.trim()) {
      roomInputRef.current?.focus();
      return;
    }
    onJoin(roomCode.trim(), name.trim() || 'Anonymous');
  }

  function handleCreate() {
    const id = generateRoomId();
    setRoomCode(id);
    onJoin(id, name.trim() || 'Anonymous');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleJoin();
  }

  return (
    <div className="join-screen">
      {/* Background gradient blobs */}
      <div className="join-bg">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className="join-container">
        {/* Left: Video preview (Google Meet style) */}
        <div className="join-preview">
          <VideoPreview stream={localStream} />
          {mediaError && (
            <div className="media-error">
              <AlertCircle size={16} />
              <span>Camera/mic unavailable</span>
            </div>
          )}
        </div>

        {/* Right: Join form */}
        <div className="join-card">
          <div className="join-brand">
            <div className="brand-icon">
              <Video size={28} />
            </div>
            <h1>sLime<span>Meet</span></h1>
            <p className="tagline">Premium video meetings. Free for everyone.</p>
          </div>

          <div className="join-form">
            <div className="input-group">
              <label htmlFor="name-input">Your name</label>
              <input
                id="name-input"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                autoComplete="off"
              />
            </div>

            <div className="input-group">
              <label htmlFor="room-input">Room code</label>
              <div className="room-input-row">
                <input
                  id="room-input"
                  ref={roomInputRef}
                  type="text"
                  placeholder="Enter a code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={50}
                  autoComplete="off"
                />
                <button className="btn btn-primary" onClick={handleJoin}>
                  <span>Join</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            <div className="divider">
              <span>or start a new meeting</span>
            </div>

            <button className="btn btn-secondary" onClick={handleCreate}>
              <Plus size={18} />
              <span>New Meeting</span>
            </button>
          </div>

          {roomFull && (
            <div className="toast toast-error">
              <AlertCircle size={16} />
              <span>Room is full (max 4 participants)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
