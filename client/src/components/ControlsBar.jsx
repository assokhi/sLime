import { Mic, MicOff, Camera, CameraOff, PhoneOff, ScreenShare, ScreenShareOff, MessageSquare } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import '../styles/ControlsBar.css';

export default function ControlsBar({
  isMicOn, isCamOn, isSharing = false,
  onToggleMic, onToggleCam, onLeave,
  onToggleScreenShare, onToggleChat,
  onSendEmoji, chatUnread = 0
}) {
  return (
    <footer className="controls-bar">
      <div className="controls-center">
        <button
          className={`ctrl-btn ${!isMicOn ? 'off' : ''}`}
          onClick={onToggleMic}
          title={isMicOn ? 'Mute' : 'Unmute'}
        >
          {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        <button
          className={`ctrl-btn ${!isCamOn ? 'off' : ''}`}
          onClick={onToggleCam}
          title={isCamOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {isCamOn ? <Camera size={20} /> : <CameraOff size={20} />}
        </button>

        <button
          className={`ctrl-btn ${isSharing ? 'active' : ''}`}
          onClick={onToggleScreenShare}
          title={isSharing ? 'Stop sharing' : 'Share screen'}
        >
          {isSharing ? <ScreenShareOff size={20} /> : <ScreenShare size={20} />}
        </button>

        <div className="ctrl-btn-wrapper">
          <button
            className="ctrl-btn"
            onClick={onToggleChat}
            title="Chat"
          >
            <MessageSquare size={20} />
            {chatUnread > 0 && (
              <span className="badge">{chatUnread > 9 ? '9+' : chatUnread}</span>
            )}
          </button>
        </div>

        <EmojiPicker onSelect={onSendEmoji} />

        <button
          className="ctrl-btn leave-btn"
          onClick={onLeave}
          title="Leave meeting"
        >
          <PhoneOff size={20} />
        </button>
      </div>
    </footer>
  );
}
