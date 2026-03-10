import { useRef, useEffect } from 'react';
import { UserRound } from 'lucide-react';
import '../styles/VideoTile.css';

export default function VideoTile({ stream, label, muted, isLocal, isCamOn = true, compact = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const showPlaceholder = isLocal && !isCamOn;

  return (
    <div className={`video-tile ${compact ? 'compact' : ''} ${isLocal ? 'local' : ''}`}>
      {showPlaceholder ? (
        <div className="tile-placeholder">
          <div className="tile-avatar">
            <UserRound size={compact ? 24 : 48} />
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={isLocal ? 'mirrored' : ''}
        />
      )}
      <div className="tile-label">
        <span>{label}</span>
      </div>
    </div>
  );
}
