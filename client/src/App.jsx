import { useState } from 'react';
import { useLocalStream, useMeeting } from './hooks/useMeeting';
import JoinScreen from './components/JoinScreen';
import MeetScreen from './components/MeetScreen';

export default function App() {
  const { localStream, mediaError, acquire } = useLocalStream();
  const meeting = useMeeting();

  // Acquire media on first render
  const [mediaRequested, setMediaRequested] = useState(false);
  if (!mediaRequested) {
    setMediaRequested(true);
    acquire();
  }

  if (!meeting.inMeeting) {
    return (
      <JoinScreen
        localStream={localStream}
        mediaError={mediaError}
        roomFull={meeting.roomFull}
        onJoin={(roomId, displayName) => meeting.joinRoom(roomId, displayName)}
      />
    );
  }

  return (
    <MeetScreen
      localStream={localStream}
      roomId={meeting.roomId}
      peers={meeting.peers}
      remoteStreams={meeting.remoteStreams}
      isMicOn={meeting.isMicOn}
      isCamOn={meeting.isCamOn}
      onToggleMic={meeting.toggleMic}
      onToggleCam={meeting.toggleCam}
      onLeave={meeting.leaveRoom}
    />
  );
}
