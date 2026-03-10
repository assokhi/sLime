import { Mic, MicOff, Camera, CameraOff, PhoneOff } from 'lucide-react';
import '../styles/ControlsBar.css';

export default function ControlsBar({ isMicOn, isCamOn, onToggleMic, onToggleCam, onLeave }) {
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
