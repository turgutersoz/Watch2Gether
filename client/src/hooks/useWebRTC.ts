import { useRef, useCallback, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

interface UseWebRTCOptions {
  socket: Socket | null;
  roomId: string | null;
  isHost: boolean;
  userId: string | null;
}

export function useWebRTC({ socket, roomId, isHost, userId }: UseWebRTCOptions) {
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

  // Peer connection oluştur
  const createPeerConnection = useCallback((targetUserId: string): RTCPeerConnection => {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const pc = new RTCPeerConnection(configuration);
    peerConnectionsRef.current.set(targetUserId, pc);

    // ICE candidate'ları gönder
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && roomId) {
        socket.emit('screen-share-ice-candidate', {
          roomId,
          candidate: event.candidate,
          targetUserId,
        });
      }
    };

    // Remote stream'i al
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        remoteStreamsRef.current.set(targetUserId, stream);
        // State'i güncelle (component re-render için)
        setRemoteStreams(new Map(remoteStreamsRef.current));
      }
    };

    // Connection state değişikliklerini dinle
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        peerConnectionsRef.current.delete(targetUserId);
        remoteStreamsRef.current.delete(targetUserId);
        // State'i güncelle
        setRemoteStreams(new Map(remoteStreamsRef.current));
      }
    };

    return pc;
  }, [socket, roomId]);

  // Host: Stream'i tüm kullanıcılara gönder
  const startScreenShare = useCallback(async (stream: MediaStream) => {
    if (!socket || !roomId || !isHost) return;

    localStreamRef.current = stream;

    // Stream'i tüm track'lere ekle
    stream.getTracks().forEach((track) => {
      peerConnectionsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track);
        } else {
          pc.addTrack(track, stream);
        }
      });
    });
  }, [socket, roomId, isHost]);

  // Host: Yeni kullanıcı geldiğinde peer connection oluştur
  const addPeer = useCallback(async (targetUserId: string) => {
    if (!socket || !roomId || !isHost || !localStreamRef.current) return;

    // Eğer zaten peer connection varsa, tekrar oluşturma
    if (peerConnectionsRef.current.has(targetUserId)) {
      return;
    }

    const pc = createPeerConnection(targetUserId);

    // Local stream'i ekle
    localStreamRef.current.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // Offer oluştur ve gönder
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('screen-share-offer', {
        roomId,
        offer,
        targetUserId,
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }, [socket, roomId, isHost, createPeerConnection]);

  // Client: Offer alındığında answer gönder
  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit, fromUserId: string) => {
    if (!socket || !roomId || isHost) return;

    const pc = createPeerConnection(fromUserId);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('screen-share-answer', {
        roomId,
        answer,
        targetUserId: fromUserId,
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, [socket, roomId, isHost, createPeerConnection]);

  // Host: Answer alındığında remote description'ı ayarla
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit, fromUserId: string) => {
    const pc = peerConnectionsRef.current.get(fromUserId);
    if (!pc) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }, []);

  // ICE candidate'ı işle
  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit, fromUserId: string) => {
    const pc = peerConnectionsRef.current.get(fromUserId);
    if (!pc) return;

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }, []);

  // Screen share'i durdur
  const stopScreenShare = useCallback(() => {
    // Tüm peer connection'ları kapat
    peerConnectionsRef.current.forEach((pc) => {
      pc.close();
    });
    peerConnectionsRef.current.clear();

    // Local stream'i durdur
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Remote stream'leri temizle
    remoteStreamsRef.current.clear();
    setRemoteStreams(new Map());

    // Server'a bildir
    if (socket && roomId && isHost) {
      socket.emit('screen-share-end', { roomId });
    }
  }, [socket, roomId, isHost]);

  // Socket event'lerini dinle
  useEffect(() => {
    if (!socket) return;

    const handleOfferEvent = (data: { offer: RTCSessionDescriptionInit; fromUserId: string }) => {
      handleOffer(data.offer, data.fromUserId);
    };

    const handleAnswerEvent = (data: { answer: RTCSessionDescriptionInit; fromUserId: string }) => {
      handleAnswer(data.answer, data.fromUserId);
    };

    const handleIceCandidateEvent = (data: { candidate: RTCIceCandidateInit; fromUserId: string }) => {
      handleIceCandidate(data.candidate, data.fromUserId);
    };

    const handleScreenShareEnd = (data: { fromUserId: string }) => {
      if (data.fromUserId !== userId) {
        const pc = peerConnectionsRef.current.get(data.fromUserId);
        if (pc) {
          pc.close();
          peerConnectionsRef.current.delete(data.fromUserId);
          remoteStreamsRef.current.delete(data.fromUserId);
          // State'i güncelle
          setRemoteStreams(new Map(remoteStreamsRef.current));
        }
      }
    };

    socket.on('screen-share-offer', handleOfferEvent);
    socket.on('screen-share-answer', handleAnswerEvent);
    socket.on('screen-share-ice-candidate', handleIceCandidateEvent);
    socket.on('screen-share-end', handleScreenShareEnd);

    return () => {
      socket.off('screen-share-offer', handleOfferEvent);
      socket.off('screen-share-answer', handleAnswerEvent);
      socket.off('screen-share-ice-candidate', handleIceCandidateEvent);
      socket.off('screen-share-end', handleScreenShareEnd);
    };
  }, [socket, userId, handleOffer, handleAnswer, handleIceCandidate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScreenShare();
    };
  }, [stopScreenShare]);

  return {
    startScreenShare,
    stopScreenShare,
    addPeer,
    remoteStreams,
  };
}

