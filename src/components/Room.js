import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import io from 'socket.io-client';
import Peer from 'simple-peer';

const RoomContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #1a1a1a;
  color: white;
`;

const Controls = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 20px;
  background-color: #2a2a2a;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 4px;
  border: none;
  background-color: ${props => props.active ? '#5865F2' : '#4a4a4a'};
  color: white;
  cursor: pointer;

  &:hover {
    background-color: ${props => props.active ? '#4752c4' : '#3a3a3a'};
  }
`;

const ParticipantsList = styled.div`
  padding: 20px;
  background-color: #2a2a2a;
  width: 200px;
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
`;

const Room = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const socketRef = useRef();
  const userAudioRef = useRef();
  const peersRef = useRef([]);
  const streamRef = useRef();

  useEffect(() => {
    if (!location.state?.username) {
      navigate('/');
      return;
    }

    socketRef.current = io('http://localhost:5000');

    // Ses akışını al
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        streamRef.current = stream;
        
        // Odaya katıl
        socketRef.current.emit('join-room', {
          roomId,
          username: location.state.username
        });

        // Yeni kullanıcı bağlandığında
        socketRef.current.on('user-connected', ({ userId, username }) => {
          console.log('Yeni kullanıcı bağlandı:', username);
          const peer = createPeer(userId, socketRef.current.id, stream);
          peersRef.current.push({ peerId: userId, peer, username });
          setParticipants(prev => [...prev, { id: userId, username }]);
        });

        // Kullanıcı ayrıldığında
        socketRef.current.on('user-disconnected', userId => {
          const peerObj = peersRef.current.find(p => p.peerId === userId);
          if (peerObj) {
            peerObj.peer.destroy();
          }
          peersRef.current = peersRef.current.filter(p => p.peerId !== userId);
          setParticipants(prev => prev.filter(p => p.id !== userId));
        });
      });

    return () => {
      socketRef.current.disconnect();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      peersRef.current.forEach(({ peer }) => peer.destroy());
    };
  }, [roomId, location.state, navigate]);

  const createPeer = (userId, myId, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream
    });

    peer.on('signal', signal => {
      socketRef.current.emit('signal', { userId, signal });
    });

    return peer;
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          cursor: true
        });
        
        // Ekran paylaşımını diğer kullanıcılara gönder
        peersRef.current.forEach(({ peer }) => {
          peer.replaceTrack(
            streamRef.current.getVideoTracks()[0],
            screenStream.getVideoTracks()[0],
            streamRef.current
          );
        });

        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error('Ekran paylaşımı hatası:', err);
      }
    } else {
      setIsScreenSharing(false);
    }
  };

  return (
    <RoomContainer>
      <Controls>
        <Button onClick={toggleMute} active={!isMuted}>
          {isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
        </Button>
        <Button onClick={toggleScreenShare} active={isScreenSharing}>
          {isScreenSharing ? 'Paylaşımı Durdur' : 'Ekran Paylaş'}
        </Button>
        <Button onClick={() => navigate('/')}>
          Odadan Ayrıl
        </Button>
      </Controls>
      <MainContent>
        <ParticipantsList>
          <h3>Katılımcılar</h3>
          <ul>
            <li>{location.state?.username} (Sen)</li>
            {participants.map(p => (
              <li key={p.id}>{p.username}</li>
            ))}
          </ul>
        </ParticipantsList>
      </MainContent>
    </RoomContainer>
  );
};

export default Room;