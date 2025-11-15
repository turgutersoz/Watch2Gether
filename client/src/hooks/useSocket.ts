import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface User {
  id: string;
  username: string;
  isHost?: boolean;
  avatar?: string;
  color?: string;
  status?: 'online' | 'away' | 'busy';
  role?: 'host' | 'moderator' | 'admin' | 'user';
}

interface PlaylistItem {
  id: string;
  url: string;
  addedBy: string;
  addedAt: number;
}

interface RoomState {
  videoUrl: string;
  isPlaying: boolean;
  currentTime: number;
  users: User[];
  hostId?: string;
  volume?: number;
  isMuted?: boolean;
  hasPassword?: boolean;
  playlist?: PlaylistItem[];
  currentPlaylistIndex?: number;
  roomName?: string;
  roomDescription?: string;
  maxUsers?: number;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  color?: string;
  message: string;
  timestamp: number;
}

export function useSocket(roomId: string, username: string, isHost: boolean) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string>(roomId);
  const [roomState, setRoomState] = useState<RoomState>({
    videoUrl: '',
    isPlaying: false,
    currentTime: 0,
    users: [],
    hostId: undefined,
    volume: 1.0,
    isMuted: false
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Socket.io server URL - environment variable'dan al, yoksa localhost kullan
    const socketUrl = import.meta.env.VITE_SOCKET_IO_URL || 'http://localhost:3001';
    const newSocket = io(socketUrl, {
      transports: ['polling', 'websocket'], // Polling'i önce dene (daha güvenilir)
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000,
      forceNew: false
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);

      if (isHost) {
        // Oda oluştur
        const password = sessionStorage.getItem('room_password') || '';
        newSocket.emit('create-room', { username, password });
        sessionStorage.removeItem('room_password');
      } else {
        // Odaya katıl - roomId'yi normalize et
        const password = sessionStorage.getItem('room_password') || '';
        const normalizedRoomId = roomId.trim().toUpperCase();
        newSocket.emit('join-room', { roomId: normalizedRoomId, username, password });
        sessionStorage.removeItem('room_password');
      }
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      // Sadece beklenmeyen bağlantı kesilmelerinde log
      if (reason === 'io server disconnect') {
        // Sunucu bağlantıyı kesti, yeniden bağlan
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      // Bağlantı hatası - sessizce yeniden bağlanmayı dene
      console.warn('Socket bağlantı hatası:', error.message);
    });

    newSocket.on('reconnect', () => {
      // Yeniden bağlandı
      setIsConnected(true);
      // Odaya tekrar katıl
      if (isHost && currentRoomId) {
        newSocket.emit('join-room', { roomId: currentRoomId, username });
      } else if (!isHost && roomId) {
        newSocket.emit('join-room', { roomId, username });
      }
    });

    newSocket.on('room-created', (data: { roomId: string }) => {
      // Host için roomId'yi güncelle
      if (isHost) {
        setCurrentRoomId(data.roomId);
        window.history.replaceState({}, '', `/${data.roomId}`);
      }
    });

    newSocket.on('room-state', (state: RoomState) => {
      setRoomState(state);
      setIsMuted(state.isMuted || false);
    });

    newSocket.on('room-error', (data: { message: string }) => {
      toast.error(data.message);
    });

    newSocket.on('user-joined', (data: { userId: string; username: string; users: User[]; hostId?: string }) => {
      if (data.userId !== socketRef.current?.id) {
        toast.success(`${data.username} odaya katıldı!`);
      }
      setRoomState(prev => ({
        ...prev,
        users: data.users,
        hostId: data.hostId || prev.hostId
      }));
    });

    newSocket.on('user-left', (data: { userId: string; username: string; users: User[]; hostId?: string }) => {
      if (data.userId !== socketRef.current?.id) {
        toast(`${data.username} odadan ayrıldı`, { icon: 'ℹ️' });
      }
      setRoomState(prev => ({
        ...prev,
        users: data.users,
        hostId: data.hostId || prev.hostId
      }));
    });

    newSocket.on('video-changed', (data: { videoUrl: string; changedBy: string }) => {
      if (data.changedBy) {
        toast.success(`${data.changedBy} yeni bir video yükledi!`);
      }
      setRoomState(prev => ({
        ...prev,
        videoUrl: data.videoUrl,
        currentTime: 0,
        isPlaying: false
      }));
    });

    // Video senkronizasyonu için throttle
    let lastSyncTimestamp = 0;
    newSocket.on('video-sync', (data: { action: string; time: number; isPlaying: boolean; volume?: number; timestamp: number }) => {
      console.log('[useSocket] video-sync event alındı:', data);
      
      // Timestamp kontrolü (duplicate mesajları filtrele)
      if (data.timestamp !== lastSyncTimestamp) {
        lastSyncTimestamp = data.timestamp;
        
        setRoomState(prev => {
          const updates: Partial<RoomState> = {
            currentTime: data.time,
            isPlaying: data.isPlaying
          };
          
          // Volume her zaman güncelle (eğer varsa) - threshold kontrolü kaldırıldı
          if (data.volume !== undefined) {
            const prevVolume = prev.volume ?? 1.0;
            const newVolume = data.volume;
            // Her zaman güncelle, çünkü server'dan gelen değer odadaki gerçek volume
            if (prevVolume !== newVolume) {
              console.log('[useSocket] Volume state güncelleniyor:', prevVolume, '->', newVolume, 'action:', data.action);
              updates.volume = newVolume;
            }
          }
          
          return {
            ...prev,
            ...updates
          };
        });
      } else {
        console.log('[useSocket] Duplicate video-sync mesajı filtrelendi (timestamp:', data.timestamp, ')');
      }
    });

    newSocket.on('chat-message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('chat-error', (data: { message: string }) => {
      toast.error(data.message);
    });

    newSocket.on('kicked', (data: { message: string }) => {
      toast.error(data.message);
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    });

    newSocket.on('mute-status', (data: { isMuted: boolean }) => {
      setIsMuted(data.isMuted);
    });

    newSocket.on('user-muted', () => {
      // UI güncellemesi için (data kullanılmıyor)
    });

    newSocket.on('host-transferred', (data: { newHostId: string; users: User[] }) => {
      const newHost = data.users.find(u => u.id === data.newHostId);
      if (newHost) {
        toast.success(`Sahiplik ${newHost.username} kullanıcısına devredildi!`);
      }
      setRoomState(prev => ({
        ...prev,
        users: data.users,
        hostId: data.newHostId
      }));
    });

    newSocket.on('room-deleted', (data: { message: string }) => {
      toast.error(data.message);
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    });

    newSocket.on('error', (data: { message: string }) => {
      toast.error(data.message);
    });

    // Playlist güncellemeleri
    newSocket.on('playlist-updated', (data: { playlist: PlaylistItem[] }) => {
      setRoomState(prev => ({
        ...prev,
        playlist: data.playlist
      }));
    });

    // Oda güncellemeleri
    newSocket.on('room-updated', (data: {
      name?: string;
      description?: string;
      maxUsers?: number;
      category?: string;
      tags?: string[];
      isPublic?: boolean;
    }) => {
      setRoomState(prev => ({
        ...prev,
        ...data
      }));
    });

    // Kullanıcı güncellemeleri
    newSocket.on('user-updated', (data: { userId: string; avatar?: string; status?: string }) => {
      setRoomState(prev => ({
        ...prev,
        users: prev.users.map(u => 
          u.id === data.userId 
            ? { ...u, avatar: data.avatar, status: data.status as 'online' | 'away' | 'busy' }
            : u
        )
      }));
    });

    // Bildirimler
    newSocket.on('notification', (data: { type: string; message: string }) => {
      // Browser bildirimleri için (izin verilmişse)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Watch Together', {
          body: data.message,
          icon: '/favicon.ico'
        });
      }
      // Toast bildirimi
      toast(data.message, { icon: '🔔' });
    });

    // Kullanıcı profil event'leri
    newSocket.on('user-profile', () => {
      // Profil bilgileri alındı - component'lerde kullanılacak
    });

    newSocket.on('user-profile-error', (data: { message: string }) => {
      toast.error(data.message);
    });

    newSocket.on('user-profile-updated', () => {
      toast.success('Profil güncellendi!');
    });

    // Admin event'leri
    newSocket.on('admin-rooms', () => {
      // Admin odalar listesi - component'lerde kullanılacak
    });

    newSocket.on('admin-users', () => {
      // Admin kullanıcı listesi - component'lerde kullanılacak
    });

    newSocket.on('admin-stats', () => {
      // Admin istatistikleri - component'lerde kullanılacak
    });

    newSocket.on('admin-error', (data: { message: string }) => {
      toast.error(data.message);
    });

    newSocket.on('admin-room-deleted', (data: { roomId: string }) => {
      toast.success(`Oda ${data.roomId} silindi!`);
    });

    newSocket.on('admin-user-banned', (data: { username: string }) => {
      toast.success(`Kullanıcı ${data.username} yasaklandı!`);
    });

    newSocket.on('banned', (data: { message: string }) => {
      toast.error(data.message);
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    });

    return () => {
      newSocket.close();
    };
  }, [roomId, username, isHost]);

  const changeVideo = (videoUrl: string) => {
    if (socket && currentRoomId) {
      socket.emit('change-video', { roomId: currentRoomId, videoUrl });
    }
  };

  const sendVideoControl = (action: 'play' | 'pause' | 'seek' | 'volume', time?: number, volume?: number) => {
    console.log('[useSocket] sendVideoControl çağrıldı:', { action, time, volume, socket: !!socket, currentRoomId });
    if (socket && currentRoomId) {
      socket.emit('video-control', { roomId: currentRoomId, action, time, volume });
      console.log('[useSocket] video-control event gönderildi');
    } else {
      console.warn('[useSocket] Socket veya roomId yok!', { socket: !!socket, currentRoomId });
    }
  };

  const sendMessage = (message: string) => {
    if (socket && !isMuted) {
      socket.emit('chat-message', { message });
    }
  };

  const kickUser = (targetUserId: string) => {
    if (socket && currentRoomId) {
      socket.emit('kick-user', { roomId: currentRoomId, targetUserId });
    }
  };

  const toggleMuteUser = (targetUserId: string) => {
    if (socket && currentRoomId) {
      socket.emit('toggle-mute-user', { roomId: currentRoomId, targetUserId });
    }
  };

  const transferHost = (newHostId: string) => {
    if (socket && currentRoomId) {
      socket.emit('transfer-host', { roomId: currentRoomId, newHostId });
    }
  };

  const deleteRoom = () => {
    if (socket && currentRoomId) {
      socket.emit('delete-room', { roomId: currentRoomId });
    }
  };

  // Playlist fonksiyonları
  const addToPlaylist = (videoUrl: string) => {
    if (socket && currentRoomId) {
      socket.emit('playlist-add', { roomId: currentRoomId, videoUrl });
    }
  };

  const removeFromPlaylist = (videoId: string) => {
    if (socket && currentRoomId) {
      socket.emit('playlist-remove', { roomId: currentRoomId, videoId });
    }
  };

  const reorderPlaylist = (fromIndex: number, toIndex: number) => {
    if (socket && currentRoomId) {
      socket.emit('playlist-reorder', { roomId: currentRoomId, fromIndex, toIndex });
    }
  };

  const nextPlaylist = () => {
    if (socket && currentRoomId) {
      socket.emit('playlist-next', { roomId: currentRoomId });
    }
  };

  const previousPlaylist = () => {
    if (socket && currentRoomId) {
      socket.emit('playlist-previous', { roomId: currentRoomId });
    }
  };

  // Oda özellikleri güncelleme
  const updateRoom = (data: {
    name?: string;
    description?: string;
    maxUsers?: number;
    category?: string;
    tags?: string[];
    isPublic?: boolean;
  }) => {
    if (socket && currentRoomId) {
      socket.emit('update-room', { roomId: currentRoomId, ...data });
    }
  };

  // Kullanıcı özellikleri güncelleme
  const updateUser = (data: { avatar?: string; status?: 'online' | 'away' | 'busy' }) => {
    if (socket) {
      socket.emit('update-user', data);
    }
  };

  // Video bitince bildir
  const notifyVideoEnded = () => {
    if (socket && currentRoomId) {
      socket.emit('video-ended', { roomId: currentRoomId });
    }
  };

  // Kullanıcı profil fonksiyonları
  const getUserProfile = (username: string) => {
    if (socket) {
      socket.emit('get-user-profile', { username });
    }
  };

  // Admin fonksiyonları
  const adminGetRooms = () => {
    if (socket) {
      socket.emit('admin-get-rooms');
    }
  };

  const adminGetUsers = () => {
    if (socket) {
      socket.emit('admin-get-users');
    }
  };

  const adminGetStats = () => {
    if (socket) {
      socket.emit('admin-get-stats');
    }
  };

  const adminDeleteRoom = (roomId: string) => {
    if (socket) {
      socket.emit('admin-delete-room', { roomId });
    }
  };

  const adminBanUser = (targetUsername: string) => {
    if (socket) {
      socket.emit('admin-ban-user', { targetUsername });
    }
  };

  return {
    socket,
    roomId: currentRoomId,
    roomState,
    messages,
    isConnected,
    isMuted,
    changeVideo,
    sendVideoControl,
    sendMessage,
    kickUser,
    toggleMuteUser,
    transferHost,
    deleteRoom,
    addToPlaylist,
    removeFromPlaylist,
    reorderPlaylist,
    nextPlaylist,
    previousPlaylist,
    updateRoom,
    updateUser,
    notifyVideoEnded,
    getUserProfile,
    adminGetRooms,
    adminGetUsers,
    adminGetStats,
    adminDeleteRoom,
    adminBanUser
  };
}

