import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, Home, BarChart3, Trash2, Ban, X, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminPanelProps {
  username: string;
  socketId: string | null;
  socket: any; // Socket.io instance
  onClose: () => void;
}

interface AdminStats {
  totalRooms: number;
  totalUsers: number;
  totalMessages: number;
  totalVideos: number;
  totalViews: number;
  publicRooms: number;
  activeRooms: number;
}

interface AdminRoom {
  id: string;
  name: string;
  description: string;
  hostId: string;
  hostUsername: string;
  userCount: number;
  maxUsers: number;
  isPublic: boolean;
  category: string;
  tags: string[];
  createdAt: number;
  stats: {
    totalViews: number;
    totalMessages: number;
    totalVideos: number;
  };
  hasPassword: boolean;
}

interface AdminUser {
  id: string;
  username: string;
  avatar: string;
  color: string;
  status: string;
  role: string;
  roomId: string;
  isHost: boolean;
  stats: {
    roomsJoined: number;
    messagesSent: number;
    totalTime: number;
    favoriteRooms: string[];
    lastSeen: number;
  };
}

function AdminPanel({ username, socketId, socket: propSocket, onClose }: AdminPanelProps) {
  // Socket'i prop'tan al
  const socket = propSocket;
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rooms' | 'users'>('dashboard');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'public'>('all');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Admin fonksiyonları
  const adminGetRooms = useCallback(() => {
    if (socket) {
      socket.emit('admin-get-rooms');
    }
  }, [socket]);

  const adminGetUsers = useCallback(() => {
    if (socket) {
      socket.emit('admin-get-users');
    }
  }, [socket]);

  const adminGetStats = useCallback(() => {
    if (socket) {
      socket.emit('admin-get-stats');
    }
  }, [socket]);

  const adminDeleteRoom = useCallback((roomId: string) => {
    if (socket) {
      socket.emit('admin-delete-room', { roomId });
    }
  }, [socket]);

  const adminBanUser = useCallback((targetUsername: string) => {
    if (socket) {
      socket.emit('admin-ban-user', { targetUsername });
    }
  }, [socket]);

  useEffect(() => {
    if (socket) {
      const handleStats = (data: AdminStats) => {
        setStats(data);
        if (activeTab === 'dashboard') {
          setLoading(false);
        }
      };

      const handleRooms = (data: AdminRoom[]) => {
        setRooms(data);
        if (activeTab === 'rooms') {
          setLoading(false);
        }
      };

      const handleUsers = (data: AdminUser[]) => {
        setUsers(data);
        if (activeTab === 'users') {
          setLoading(false);
        }
      };

      const handleError = (data: { message: string }) => {
        toast.error(data.message);
        setLoading(false);
      };

      socket.on('admin-stats', handleStats);
      socket.on('admin-rooms', handleRooms);
      socket.on('admin-users', handleUsers);
      socket.on('admin-error', handleError);

      return () => {
        socket.off('admin-stats', handleStats);
        socket.off('admin-rooms', handleRooms);
        socket.off('admin-users', handleUsers);
        socket.off('admin-error', handleError);
      };
    }
  }, [socket, activeTab]);

  useEffect(() => {
    if (!socket) return;
    
    setLoading(true);
    if (activeTab === 'rooms') {
      adminGetRooms();
    } else if (activeTab === 'users') {
      adminGetUsers();
    } else if (activeTab === 'dashboard') {
      adminGetStats();
    }
  }, [activeTab, socket, adminGetRooms, adminGetUsers, adminGetStats]);

  const handleDeleteRoom = useCallback((roomId: string) => {
    if (window.confirm('Bu odayı silmek istediğinize emin misiniz?')) {
      adminDeleteRoom(roomId);
      setRooms(prev => prev.filter(r => r.id !== roomId));
    }
  }, [adminDeleteRoom]);

  const handleBanUser = useCallback((targetUsername: string) => {
    if (window.confirm(`${targetUsername} kullanıcısını yasaklamak istediğinize emin misiniz?`)) {
      adminBanUser(targetUsername);
      setUsers(prev => prev.filter(u => u.username !== targetUsername));
    }
  }, [adminBanUser]);

  const filteredRooms = useMemo(() => rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         room.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         room.hostUsername.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    
    if (filter === 'active') return matchesSearch && room.userCount > 0;
    if (filter === 'public') return matchesSearch && room.isPublic;
    return matchesSearch;
  }), [rooms, debouncedSearchTerm, filter]);

  const filteredUsers = useMemo(() => users.filter(user =>
    user.username.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  ), [users, debouncedSearchTerm]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
        className="glass-dark rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Admin Paneli
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
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'rooms'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4 inline mr-2" />
            Odalar ({rooms.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'users'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Kullanıcılar ({users.length})
          </button>
        </div>

        {/* Content */}
        <div className="tab-content">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-white/60 mt-4">Yükleniyor...</p>
            </div>
          ) : activeTab === 'dashboard' && stats ? (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-purple-400">{stats.totalRooms}</div>
                  <div className="text-white/60 text-sm mt-1">Toplam Oda</div>
                </div>
                <div className="glass rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-400">{stats.activeRooms}</div>
                  <div className="text-white/60 text-sm mt-1">Aktif Oda</div>
                </div>
                <div className="glass rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-400">{stats.totalUsers}</div>
                  <div className="text-white/60 text-sm mt-1">Toplam Kullanıcı</div>
                </div>
                <div className="glass rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-pink-400">{stats.totalMessages}</div>
                  <div className="text-white/60 text-sm mt-1">Toplam Mesaj</div>
                </div>
                <div className="glass rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-400">{stats.totalVideos}</div>
                  <div className="text-white/60 text-sm mt-1">Toplam Video</div>
                </div>
                <div className="glass rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-cyan-400">{stats.totalViews}</div>
                  <div className="text-white/60 text-sm mt-1">Toplam Görüntülenme</div>
                </div>
                <div className="glass rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-orange-400">{stats.publicRooms}</div>
                  <div className="text-white/60 text-sm mt-1">Public Oda</div>
                </div>
              </div>
            </div>
          ) : activeTab === 'rooms' ? (
            <div className="space-y-4 animate-fade-in">
              {/* Search and Filter */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Oda ara..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'public')}
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="all">Tümü</option>
                  <option value="active">Aktif</option>
                  <option value="public">Public</option>
                </select>
              </div>

              {/* Rooms List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredRooms.length > 0 ? (
                  filteredRooms.map((room) => (
                    <div
                      key={room.id}
                      className="glass rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-semibold">{room.name || `Oda ${room.id}`}</h3>
                            {room.isPublic && (
                              <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded">Public</span>
                            )}
                            {room.hasPassword && (
                              <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded">Şifreli</span>
                            )}
                          </div>
                          <p className="text-white/60 text-sm mt-1">{room.description || 'Açıklama yok'}</p>
                          <div className="flex items-center gap-4 mt-2 text-white/60 text-xs">
                            <span>Host: {room.hostUsername}</span>
                            <span>Kullanıcı: {room.userCount}/{room.maxUsers || '∞'}</span>
                            <span>Mesaj: {room.stats.totalMessages}</span>
                            <span>Görüntülenme: {room.stats.totalViews}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          className="ml-4 p-2 text-red-400 hover:text-red-300"
                          title="Odayı Sil"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-white/60 py-8">
                    <Home className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Oda bulunamadı</p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'users' ? (
            <div className="space-y-4 animate-fade-in">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Kullanıcı ara..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Users List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="glass rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                            style={{
                              backgroundColor: user.color || '#8B5CF6',
                              backgroundImage: user.avatar ? `url(${user.avatar})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          >
                            {!user.avatar && user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-white font-semibold">{user.username}</h3>
                              {user.role === 'admin' && (
                                <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">Admin</span>
                              )}
                              {user.isHost && (
                                <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded">Host</span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-white/60 text-xs">
                              <span>Oda: {user.roomId || 'Yok'}</span>
                              <span>Mesaj: {user.stats.messagesSent}</span>
                              <span>Oda: {user.stats.roomsJoined}</span>
                            </div>
                          </div>
                        </div>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleBanUser(user.username)}
                            className="ml-4 p-2 text-red-400 hover:text-red-300"
                            title="Kullanıcıyı Yasakla"
                          >
                            <Ban className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-white/60 py-8">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Kullanıcı bulunamadı</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default memo(AdminPanel);

