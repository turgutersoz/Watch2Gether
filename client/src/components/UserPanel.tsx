import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, BarChart3, Clock, Heart, X, Upload, Circle, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { saveRoomHistory, getRoomHistory } from '../utils/indexedDB';

interface UserPanelProps {
  username: string;
  socketId: string | null;
  socket: any; // Socket.io instance
  onClose: () => void;
}

interface UserProfile {
  username: string;
  avatar?: string;
  color?: string;
  status?: 'online' | 'away' | 'busy';
  role?: string;
  stats?: {
    roomsJoined: number;
    messagesSent: number;
    totalTime: number;
    favoriteRooms: string[];
    lastSeen: number;
    createdAt: number;
  };
  history?: Array<{
    roomId: string;
    joinedAt: number;
    leftAt: number | null;
  }>;
}

function UserPanel({ username, socketId, socket: propSocket, onClose }: UserPanelProps) {
  // Socket'i prop'tan al
  const socket = propSocket;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'history'>('profile');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [status, setStatus] = useState<'online' | 'away' | 'busy'>('online');

  // Profil fonksiyonları
  const getUserProfile = useCallback((targetUsername: string) => {
    if (socket) {
      socket.emit('get-user-profile', { username: targetUsername });
    }
  }, [socket]);

  const updateUser = useCallback((data: { avatar?: string; status?: string }) => {
    if (socket) {
      socket.emit('update-user', data);
    }
  }, [socket]);

  useEffect(() => {
    if (socket && username) {
      // Önce cache'den oda geçmişini yükle
      getRoomHistory(username).then((cachedHistory) => {
        if (cachedHistory && cachedHistory.length > 0 && !profile) {
          // Cache'den geçmişi göster (geçici olarak)
        }
      });

      // Socket event listener'ları
      const handleProfile = (data: UserProfile) => {
        setProfile(data);
        setAvatarUrl(data.avatar || '');
        setStatus((data.status as 'online' | 'away' | 'busy') || 'online');
        setLoading(false);

        // Oda geçmişini cache'le
        if (data.history && data.history.length > 0) {
          saveRoomHistory(username, data.history);
        }
      };

      const handleProfileError = (data: { message: string }) => {
        toast.error(data.message);
        setLoading(false);
      };

      socket.on('user-profile', handleProfile);
      socket.on('user-profile-error', handleProfileError);

      // Profil bilgilerini al
      getUserProfile(username);

      return () => {
        socket.off('user-profile', handleProfile);
        socket.off('user-profile-error', handleProfileError);
      };
    } else {
      setLoading(false);
    }
  }, [socket, username, getUserProfile]);

  const handleSaveProfile = useCallback(() => {
    if (socket) {
      updateUser({ avatar: avatarUrl, status });
      toast.success('Profil güncellendi!');
    }
  }, [socket, avatarUrl, status, updateUser]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) {
      return `${hours}s ${minutes}dk`;
    }
    return `${minutes}dk`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <div className="glass-dark rounded-xl p-8 text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-center">Yükleniyor...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-dark rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6" />
            Kullanıcı Paneli
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'profile'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Profil
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'stats'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            İstatistikler
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'history'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Geçmiş
          </button>
        </div>

        {/* Content */}
        <div className="tab-content">
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-fade-in">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-semibold"
                  style={{
                    backgroundColor: profile?.color || '#8B5CF6',
                    backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {!avatarUrl && username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-white text-xl font-bold">{username}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        status === 'online' ? 'bg-green-500' :
                        status === 'away' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                    />
                    <span className="text-white/60 text-sm capitalize">{status}</span>
                    {profile?.role === 'admin' && (
                      <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">Admin</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Avatar URL */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Avatar URL</label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Durum</label>
                <div className="flex gap-2">
                  {(['online', 'away', 'busy'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`flex-1 px-4 py-2 rounded-lg ${
                        status === s
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      {s === 'online' && <CheckCircle className="w-4 h-4 inline mr-2" />}
                      {s === 'away' && <Circle className="w-4 h-4 inline mr-2" />}
                      {s === 'busy' && <XCircle className="w-4 h-4 inline mr-2" />}
                      {s === 'online' ? 'Çevrimiçi' : s === 'away' ? 'Uzakta' : 'Meşgul'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl"
              >
                Kaydet
              </button>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-4 animate-fade-in">
              {profile?.stats ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-purple-400">{profile.stats.roomsJoined}</div>
                      <div className="text-white/60 text-sm mt-1">Katıldığı Oda</div>
                    </div>
                    <div className="glass rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-pink-400">{profile.stats.messagesSent}</div>
                      <div className="text-white/60 text-sm mt-1">Gönderilen Mesaj</div>
                    </div>
                    <div className="glass rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-blue-400">{formatTime(profile.stats.totalTime)}</div>
                      <div className="text-white/60 text-sm mt-1">Toplam Süre</div>
                    </div>
                    <div className="glass rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-green-400">{profile.stats.favoriteRooms.length}</div>
                      <div className="text-white/60 text-sm mt-1">Favori Oda</div>
                    </div>
                  </div>

                  <div className="glass rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">Son Görülme</h4>
                    <p className="text-white/60 text-sm">{formatDate(profile.stats.lastSeen)}</p>
                  </div>

                  {profile.stats.favoriteRooms.length > 0 && (
                    <div className="glass rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        Favori Odalar
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.stats.favoriteRooms.map((roomId) => (
                          <span
                            key={roomId}
                            className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-lg text-sm"
                          >
                            {roomId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-white/60 py-8">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Henüz istatistik yok</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-2 animate-fade-in">
              {profile?.history && profile.history.length > 0 ? (
                profile.history.map((entry, index) => (
                  <div
                    key={index}
                    className="glass rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-semibold">Oda: {entry.roomId}</div>
                        <div className="text-white/60 text-xs mt-1">
                          Katıldı: {formatDate(entry.joinedAt)}
                          {entry.leftAt && ` • Ayrıldı: ${formatDate(entry.leftAt)}`}
                        </div>
                      </div>
                      <button
                        onClick={() => window.location.href = `/${entry.roomId}`}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
                      >
                        Katıl
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-white/60 py-8">
                  <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Henüz geçmiş yok</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default memo(UserPanel);

