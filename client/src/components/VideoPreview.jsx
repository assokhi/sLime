import { useRef, useEffect } from 'react';
import '../styles/VideoPreview.css';

export default function VideoPreview({ stream }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="video-preview">
      {stream ? (
        <video ref={videoRef} autoPlay playsInline muted />
      ) : (
        <div className="preview-placeholder">
          <div className="avatar-circle">
            <span>?</span>
          </div>
          <p>Camera is loading…</p>
        </div>
      )}
    </div>
  );
}
