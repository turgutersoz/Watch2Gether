import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Users, MessageSquare, Video as VideoIcon, List, Plus, Trash2, ChevronRight, ChevronLeft, Settings, X, User, Shield } from 'lucide-react';
import ReactPlayer from 'react-player';
import toast from 'react-hot-toast';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import VideoPlayer from './VideoPlayer';
import Chat from './Chat';
import UserList from './UserList';
import ScreenShare from './ScreenShare';
import UserPanel from './UserPanel';
import AdminPanel from './AdminPanel';

interface User {
  username: string;
  email: string;
  isAuthenticated: boolean;
}

interface RoomProps {
  roomId: string;
  username: string;
  onLeave: () => void;
  user?: User | null;
  onLogout?: () => void;
}

export default function Room({ roomId, username, onLeave, user, onLogout }: RoomProps) {
  const isHost = roomId === '';
  const [showChat, setShowChat] = useState(true);
  const [showUsers, setShowUsers] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [screenShareStream, setScreenShareStream] = useState<MediaStream | null>(null);
  
  // Oda ayarları state
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [maxUsers, setMaxUsers] = useState(0);
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);

  const {
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
    notifyVideoEnded
  } = useSocket(roomId, username, isHost);

  // Kullanıcı rolü kontrolü
  const currentUser = roomState.users.find(u => u.id === socket?.id);
  const isAdmin = currentUser?.role === 'admin';
  const isCurrentUserHost = socket?.id === roomState.hostId;

  // WebRTC hook
  const { startScreenShare, stopScreenShare, addPeer, remoteStreams } = useWebRTC({
    socket,
    roomId: currentRoomId,
    isHost: isCurrentUserHost,
    userId: socket?.id || null,
  });

  useEffect(() => {
    if (roomState.videoUrl) {
      setVideoUrl(roomState.videoUrl);
      setInputUrl(roomState.videoUrl);
    }
  }, [roomState.videoUrl]);

  const handleVideoChange = useCallback(() => {
    if (inputUrl.trim()) {
      changeVideo(inputUrl.trim());
    }
  }, [inputUrl, changeVideo]);

  const handleAddToPlaylist = useCallback(() => {
    if (inputUrl.trim()) {
      addToPlaylist(inputUrl.trim());
      toast.success('Playlist\'e eklendi!');
      setInputUrl('');
    }
  }, [inputUrl, addToPlaylist]);

  const handleSaveRoomSettings = useCallback(() => {
    const tagArray = tags.filter(t => t.trim() !== '');
    updateRoom({
      name: roomName,
      description: roomDescription,
      maxUsers: maxUsers || 0,
      category: category,
      tags: tagArray,
      isPublic: isPublic
    });
    toast.success('Oda ayarları güncellendi!');
    setShowRoomSettings(false);
  }, [roomName, roomDescription, maxUsers, category, tags, isPublic, updateRoom]);

  const [roomPassword, setRoomPassword] = useState<string>('');

  // Oda şifresini sessionStorage'dan al (oda oluşturulurken kaydedilmiş)
  useEffect(() => {
    if (isCurrentUserHost) {
      const savedPassword = sessionStorage.getItem('created_room_password');
      if (savedPassword) {
        setRoomPassword(savedPassword);
      }
    }
  }, [isCurrentUserHost]);

  const handleCopyLink = useCallback(async () => {
    const roomIdToUse = (currentRoomId || window.location.pathname.replace('/', '') || 'YENİ').toUpperCase();
    const fullUrl = `${window.location.origin}/${roomIdToUse}`;
    
    try {
      // Eğer oda şifreli ise, link ve şifreyi birlikte kopyala
      if (roomState.hasPassword && isCurrentUserHost && roomPassword) {
        const message = `Oda Linki: ${fullUrl}\nOda Şifresi: ${roomPassword}`;
        await navigator.clipboard.writeText(message);
        toast.success('Oda linki ve şifre kopyalandı!', { duration: 4000 });
      } else if (roomState.hasPassword && isCurrentUserHost) {
        // Şifre bulunamadıysa sadece linki kopyala ve uyarı ver
        await navigator.clipboard.writeText(fullUrl);
        toast.success('Oda linki kopyalandı! (Şifreli oda - şifreyi ayrıca paylaşmanız gerekiyor)', { duration: 5000 });
      } else {
        await navigator.clipboard.writeText(fullUrl);
        toast.success('Oda linki kopyalandı!');
      }
    } catch (error) {
      toast.error('Link kopyalanamadı!');
    }
  }, [currentRoomId, roomState.hasPassword, isCurrentUserHost, roomPassword]);

  const handlePlay = useCallback(() => {
    sendVideoControl('play', roomState.currentTime);
  }, [sendVideoControl, roomState.currentTime]);

  const handlePause = useCallback(() => {
    sendVideoControl('pause', roomState.currentTime);
  }, [sendVideoControl, roomState.currentTime]);

  const handleSeek = useCallback((time: number) => {
    sendVideoControl('seek', time);
  }, [sendVideoControl]);

  const handleTimeUpdate = useCallback((time: number) => {
    // Sadece önemli farklar için gönder (spam önleme)
    if (Math.abs(time - roomState.currentTime) > 1) {
      sendVideoControl('seek', time);
    }
  }, [roomState.currentTime, sendVideoControl]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    console.log('[Room] handleVolumeChange çağrıldı:', newVolume);
    // Volume değişikliğini sunucuya gönder
    sendVideoControl('volume', undefined, newVolume);
    console.log('[Room] sendVideoControl çağrıldı');
  }, [sendVideoControl]);

  const handleScreenShareChange = useCallback(async (stream: MediaStream | null) => {
    if (stream) {
      // Host: WebRTC ile stream'i başlat
      if (isCurrentUserHost) {
        await startScreenShare(stream);
        setScreenShareStream(stream);
        // Mevcut kullanıcılar için peer connection oluştur
        if (roomState.users.length > 0) {
          roomState.users.forEach((user) => {
            if (user.id !== socket?.id) {
              addPeer(user.id);
            }
          });
        }
      }
    } else {
      // Host: Screen share'i durdur
      if (isCurrentUserHost) {
        stopScreenShare();
        setScreenShareStream(null);
      }
    }
  }, [isCurrentUserHost, startScreenShare, stopScreenShare, roomState.users, socket?.id, addPeer]);

  // Yeni kullanıcı geldiğinde peer connection ekle (host için)
  useEffect(() => {
    if (isCurrentUserHost && screenShareStream && roomState.users.length > 0) {
      roomState.users.forEach((user) => {
        if (user.id !== socket?.id) {
          // Mevcut peer connection kontrolü addPeer içinde yapılıyor
          addPeer(user.id);
        }
      });
    }
  }, [isCurrentUserHost, screenShareStream, roomState.users, socket?.id, addPeer]);

  // Oda adı ve açıklaması değiştiğinde document title'ı güncelle
  useEffect(() => {
    if (roomState.roomName) {
      const title = roomState.roomDescription 
        ? `${roomState.roomName} - ${roomState.roomDescription} | Watch Together`
        : `${roomState.roomName} | Watch Together`;
      document.title = title;
    } else {
      document.title = 'Watch Together - Senkronize Video İzleme';
    }
  }, [roomState.roomName, roomState.roomDescription]);

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="glass-dark rounded-xl p-4 mb-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div 
              className={`w-3 h-3 rounded-full transition-all ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`} 
              title={isConnected ? 'Bağlı' : 'Bağlantı kesildi'}
            />
            <span className="text-white font-semibold">Watch Together</span>
          </div>
          {currentRoomId && (
            <div className="glass rounded-lg px-3 py-1">
              <span className="text-white text-sm font-mono">Oda: {currentRoomId}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Oda Adı ve Açıklaması - Header'da belirgin göster */}
          <div className="flex items-center gap-3">
            {roomState.roomName && (
              <div className="glass rounded-lg px-4 py-2">
                <h2 className="text-white font-semibold text-lg">{roomState.roomName}</h2>
                {roomState.roomDescription && (
                  <p className="text-white/70 text-sm mt-1">{roomState.roomDescription}</p>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowUserPanel(true)}
            className="glass rounded-lg p-2 text-white hover:bg-white/20"
            title="Kullanıcı Paneli"
          >
            <User className="w-5 h-5" />
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowAdminPanel(true)}
              className="glass rounded-lg p-2 text-white hover:bg-white/20"
              title="Admin Paneli"
            >
              <Shield className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleCopyLink}
            className="glass rounded-lg px-4 py-2 text-white text-sm hover:bg-white/20"
          >
            Linki Kopyala
          </button>
          {isCurrentUserHost && (
            <ScreenShare onStreamChange={handleScreenShareChange} />
          )}
          <button
            onClick={() => setShowUsers(!showUsers)}
            className="glass rounded-lg p-2 text-white hover:bg-white/20 relative"
          >
            <Users className="w-5 h-5" />
            {roomState.users.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {roomState.users.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowChat(!showChat)}
            className="glass rounded-lg p-2 text-white hover:bg-white/20 relative"
          >
            <MessageSquare className="w-5 h-5" />
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {messages.length}
              </span>
            )}
          </button>
          <button
            onClick={onLeave}
            className="glass rounded-lg p-2 text-white hover:bg-red-500/50"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-col lg:flex-row">
        {/* Video Player Area */}
        <div className="flex-1 space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="glass-dark rounded-xl p-4 mb-4"
          >
            <div className="mb-4">
              <label className="block text-white text-sm font-medium mb-2">
                <VideoIcon className="w-4 h-4 inline mr-2" />
                Video URL (YouTube, Twitch veya direkt link)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleVideoChange();
                    }
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleVideoChange}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                  title="Video Yükle"
                >
                  Yükle
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddToPlaylist}
                  className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                  title="Playlist'e Ekle"
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
              </div>
              {/* Playlist ve Oda Ayarları Butonları */}
              <div className="flex gap-2 mt-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPlaylist(!showPlaylist)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <List className="w-4 h-4" />
                  <span className="text-sm">Playlist ({roomState.playlist?.length || 0})</span>
                </motion.button>
                {isCurrentUserHost && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowRoomSettings(!showRoomSettings)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                    title="Oda Ayarları"
                  >
                    <Settings className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </div>

            {videoUrl || screenShareStream || remoteStreams.size > 0 ? (
              <>
                <VideoPlayer
                  url={videoUrl}
                  isPlaying={roomState.isPlaying}
                  currentTime={roomState.currentTime}
                  volume={roomState.volume ?? 1.0}
                  onVolumeChange={handleVolumeChange}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onSeek={handleSeek}
                  onTimeUpdate={handleTimeUpdate}
                  screenShareStream={screenShareStream}
                  remoteScreenStreams={remoteStreams}
                />
                {/* Video Preloading - Playlist'teki bir sonraki videoyu preload et */}
                {roomState.playlist && 
                 roomState.currentPlaylistIndex !== undefined && 
                 roomState.currentPlaylistIndex >= 0 && 
                 roomState.currentPlaylistIndex < roomState.playlist.length - 1 && (
                  <div className="hidden">
                    <ReactPlayer
                      url={roomState.playlist[roomState.currentPlaylistIndex + 1].url}
                      width="0"
                      height="0"
                      playing={false}
                      volume={0}
                      config={{
                        youtube: {
                          playerVars: {
                            preload: 'auto',
                            rel: 0,
                            enablejsapi: 1
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-video glass rounded-xl flex items-center justify-center">
                <div className="text-center text-white/60">
                  <VideoIcon className="w-16 h-16 mx-auto mb-4" />
                  <p>Yukarıdaki alana video URL'si girin</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Playlist UI */}
          <AnimatePresence>
            {showPlaylist && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-dark rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <List className="w-5 h-5" />
                    Playlist ({roomState.playlist?.length || 0})
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowPlaylist(false)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {roomState.playlist && roomState.playlist.length > 0 ? (
                    roomState.playlist.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all ${
                          index === roomState.currentPlaylistIndex ? 'ring-2 ring-purple-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm truncate">{item.url}</p>
                            <p className="text-white/60 text-xs mt-1">
                              {new Date(item.addedAt).toLocaleTimeString('tr-TR')} • {item.addedBy}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {isCurrentUserHost && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => removeFromPlaylist(item.id)}
                                className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-white/60 text-center py-8">Playlist boş</p>
                  )}
                </div>
                {roomState.playlist && roomState.playlist.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={previousPlaylist}
                      disabled={roomState.currentPlaylistIndex === 0}
                      className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Önceki
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={nextPlaylist}
                      disabled={roomState.currentPlaylistIndex === (roomState.playlist?.length || 0) - 1}
                      className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      Sonraki
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Oda Ayarları Modal */}
          <AnimatePresence>
            {showRoomSettings && isCurrentUserHost && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowRoomSettings(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="glass-dark rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-white text-2xl font-bold flex items-center gap-2">
                      <Settings className="w-6 h-6" />
                      Oda Ayarları
                    </h2>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowRoomSettings(false)}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </motion.button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Oda İsmi</label>
                      <input
                        type="text"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="Oda ismini girin..."
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Açıklama</label>
                      <textarea
                        value={roomDescription}
                        onChange={(e) => setRoomDescription(e.target.value)}
                        placeholder="Oda açıklaması..."
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Maksimum Kullanıcı Sayısı (0 = Sınırsız)</label>
                      <input
                        type="number"
                        value={maxUsers || ''}
                        onChange={(e) => setMaxUsers(parseInt(e.target.value) || 0)}
                        min="0"
                        placeholder="0"
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Kategori</label>
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Film, Dizi, Müzik, vb..."
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Etiketler (virgülle ayırın)</label>
                      <input
                        type="text"
                        value={tags.join(', ')}
                        onChange={(e) => setTags(e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                        placeholder="aksiyon, komedi, 2024"
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="w-5 h-5 rounded bg-white/10 border-white/20 text-purple-600 focus:ring-purple-500"
                      />
                      <label htmlFor="isPublic" className="text-white text-sm">
                        Public oda (arama sonuçlarında görünsün)
                      </label>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSaveRoomSettings}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                      >
                        Kaydet
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowRoomSettings(false)}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all"
                      >
                        İptal
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 space-y-4">
          {showUsers && (
            <div className="animate-fade-in">
              <Suspense fallback={<div className="glass-dark rounded-xl p-4 text-white">Yükleniyor...</div>}>
                <UserList 
                  users={roomState.users} 
                  currentUsername={username}
                  currentUserId={socket?.id || ''}
                  isHost={isCurrentUserHost}
                  onKickUser={kickUser}
                  onToggleMute={toggleMuteUser}
                  onTransferHost={transferHost}
                  onDeleteRoom={deleteRoom}
                />
              </Suspense>
            </div>
          )}

          {showChat && (
            <div className="animate-fade-in">
              <Suspense fallback={<div className="glass-dark rounded-xl p-4 text-white">Yükleniyor...</div>}>
            <Chat
              messages={messages}
              currentUsername={username}
              onSendMessage={sendMessage}
              isMuted={isMuted}
              roomId={currentRoomId}
            />
              </Suspense>
            </div>
          )}
        </div>
      </div>

      {/* User Panel */}
      <AnimatePresence>
        {showUserPanel && (
          <UserPanel
            username={username}
            socketId={socket?.id || null}
            socket={socket}
            onClose={() => setShowUserPanel(false)}
          />
        )}
      </AnimatePresence>

      {/* Admin Panel */}
      <AnimatePresence>
        {showAdminPanel && isAdmin && (
          <AdminPanel
            username={username}
            socketId={socket?.id || null}
            socket={socket}
            onClose={() => setShowAdminPanel(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

