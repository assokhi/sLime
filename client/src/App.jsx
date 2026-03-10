import { useState } from 'react';
import { useLocalStream, useMeeting, useScreenShare, useChat, useEmoji } from './hooks/useMeeting';
import JoinScreen from './components/JoinScreen';
import MeetScreen from './components/MeetScreen';

export default function App() {
  const { localStream, mediaError, acquire } = useLocalStream();
  const meeting = useMeeting();
  const screenShare = useScreenShare();
  const chat = useChat();
  const emoji = useEmoji();
  const [displayName, setDisplayName] = useState('Anonymous');

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
        onJoin={(roomId, name) => {
          setDisplayName(name);
          meeting.joinRoom(roomId, name);
        }}
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
      isSharing={screenShare.isSharing}
      onToggleScreenShare={screenShare.toggleScreenShare}
      chat={chat}
      emoji={emoji}
      displayName={displayName}
    />
  );
}
