import { useState, useCallback } from 'react';
import { Copy, Check, Users } from 'lucide-react';
import VideoTile from './VideoTile';
import ControlsBar from './ControlsBar';
import ChatPanel from './ChatPanel';
import EmojiOverlay from './EmojiOverlay';
import '../styles/MeetScreen.css';

export default function MeetScreen({
  localStream, roomId, peers, remoteStreams,
  isMicOn, isCamOn,
  onToggleMic, onToggleCam, onLeave,
  isSharing, onToggleScreenShare,
  chat, emoji, displayName
}) {
  const [copied, setCopied] = useState(false);
  const totalParticipants = peers.length + 1;

  const copyRoomId = useCallback(() => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [roomId]);

  // Build the array of tiles: remote peers + local
  const remoteEntries = Array.from(remoteStreams.entries());

  // Grid class based on participant count
  const gridClass = `video-grid grid-${Math.min(totalParticipants, 4)}`;

  return (
    <div className={`meet-screen ${chat.isOpen ? 'chat-open' : ''}`}>
      {/* Emoji Overlay */}
      <EmojiOverlay reactions={emoji.reactions} />

      {/* Header */}
      <header className="meet-header">
        <div className="header-left">
          <span className="header-brand">sLime<span>Meet</span></span>
        </div>
        <div className="header-center">
          <button className="room-code-btn" onClick={copyRoomId} title="Copy room code">
            <span className="code-text">{roomId}</span>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
        <div className="header-right">
          <div className="participant-badge">
            <Users size={14} />
            <span>{totalParticipants}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="meet-body">
        {/* Video Grid */}
        <main className="meet-main">
          <div className={gridClass}>
            {/* Remote participants */}
            {remoteEntries.map(([socketId, stream]) => {
              const peer = peers.find((p) => p.socketId === socketId);
              return (
                <VideoTile
                  key={socketId}
                  stream={stream}
                  label={peer?.displayName || 'Peer'}
                  muted={false}
                  isLocal={false}
                />
              );
            })}

          {/* Local participant (shown in grid when alone, or as PiP when others present) */}
          {remoteEntries.length === 0 ? (
            <VideoTile
              stream={localStream}
              label="You"
              muted={true}
              isLocal={true}
              isCamOn={isCamOn}
            />
          ) : null}
        </div>

        {/* Floating local video (PiP) when in a call with others */}
        {remoteEntries.length > 0 && (
          <div className="local-pip">
            <VideoTile
              stream={localStream}
              label="You"
              muted={true}
              isLocal={true}
              isCamOn={isCamOn}
              compact
            />
          </div>
        )}
        </main>

        {/* Chat Panel (slide-in side panel) */}
        {chat.isOpen && (
          <ChatPanel
            messages={chat.messages}
            onSend={chat.sendMessage}
            onClose={chat.closeChat}
            senderName={displayName}
          />
        )}
      </div>

      {/* Controls */}
      <ControlsBar
        isMicOn={isMicOn}
        isCamOn={isCamOn}
        isSharing={isSharing}
        onToggleMic={onToggleMic}
        onToggleCam={onToggleCam}
        onLeave={onLeave}
        onToggleScreenShare={onToggleScreenShare}
        onToggleChat={chat.toggleChat}
        onSendEmoji={(em) => emoji.sendEmoji(em, displayName)}
        chatUnread={chat.unreadCount}
      />
    </div>
  );
}
