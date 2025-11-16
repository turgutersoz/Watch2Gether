import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import * as db from './database-provider.js';

// Kullanıcı rengi oluştur (socket ID'den)
function generateUserColor(socketId) {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80',
    '#EC7063', '#5DADE2', '#58D68D', '#F4D03F', '#AF7AC5'
  ];
  // Socket ID'den hash oluştur
  let hash = 0;
  for (let i = 0; i < socketId.length; i++) {
    hash = socketId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const app = express();
const httpServer = createServer(app);

// CORS origin'leri environment variable'dan al veya default kullan
// Boşlukları trim et (örnek: "http://localhost, http://localhost:5173" formatı için)
// "*" özel değeri tüm origin'lere izin verir
const corsOriginsEnv = process.env.CORS_ORIGINS?.trim();
const allowAllOrigins = corsOriginsEnv === '*' || corsOriginsEnv === 'true';

const allowedOrigins = allowAllOrigins
  ? true // Socket.io için true = tüm origin'lere izin ver
  : corsOriginsEnv
  ? corsOriginsEnv.split(',').map(origin => origin.trim()).filter(origin => origin.length > 0)
  : ["http://localhost:5173", "http://localhost", "https://localhost"];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Express CORS middleware'i de yapılandır
app.use(cors({
  origin: allowAllOrigins ? true : allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Oda verilerini saklamak için
const rooms = new Map();

// Kullanıcı verilerini saklamak için
const users = new Map();

// Admin kullanıcılar
// Yöntem 1: Environment variable'dan (virgülle ayrılmış liste)
// Örnek: ADMIN_USERS=admin,ADMIN,superadmin
const adminUsersEnv = process.env.ADMIN_USERS || 'ADMIN';
const adminUsers = new Set(
  adminUsersEnv.split(',').map(u => u.trim().toUpperCase()).filter(u => u.length > 0)
);
console.log('🔐 Admin kullanıcıları:', Array.from(adminUsers));

// Yöntem 2: Database'den kontrol (opsiyonel - database'de role='admin' olanlar)
async function getUserRoleFromDB(username) {
  try {
    // Database provider'dan kullanıcı rolünü al
    // Şimdilik basit sistem kullanılıyor, ileride database entegrasyonu eklenebilir
    return null; // null dönerse username kontrolü yapılır
  } catch (error) {
    console.error('Database role check error:', error);
    return null;
  }
}

// Kullanıcı istatistikleri ve geçmişi (username bazlı)
const userStats = new Map(); // username -> { roomsJoined, messagesSent, totalTime, favoriteRooms, lastSeen }
const userHistory = new Map(); // username -> [{ roomId, joinedAt, leftAt }]

io.on('connection', (socket) => {
  console.log('Yeni kullanıcı bağlandı:', socket.id);

  // Oda oluştur
  socket.on('create-room', async (data) => {
    const roomId = uuidv4().substring(0, 8).toUpperCase();
    const { username, password } = data;
    
    rooms.set(roomId, {
      id: roomId,
      hostId: socket.id, // Oda sahibi
      password: password || '', // Oda şifresi
      name: '', // Oda ismi
      description: '', // Oda açıklaması
      maxUsers: 0, // 0 = sınırsız
      category: '', // Oda kategorisi
      tags: [], // Oda etiketleri
      isPublic: false, // Public oda mı?
      createdAt: Date.now(),
      videoUrl: '',
      isPlaying: false,
      currentTime: 0,
      lastUpdate: Date.now(),
      users: new Set([socket.id]),
      mutedUsers: new Set(), // Chat yazması engellenen kullanıcılar
      volume: 1.0,
      playlist: [], // Video playlist
      currentPlaylistIndex: -1, // Şu anki playlist index
      stats: {
        totalViews: 0,
        totalMessages: 0,
        totalVideos: 0
      }
    });

    // Kullanıcı rolünü belirle
    // 1. Önce database'den kontrol et (ileride eklenebilir)
    // 2. Sonra environment variable'dan kontrol et
    // 3. Son olarak default 'host' rolü
    let userRole = 'host';
    if (username) {
      const dbRole = await getUserRoleFromDB(username);
      if (dbRole) {
        userRole = dbRole;
      } else if (adminUsers.has(username.toUpperCase())) {
        userRole = 'admin';
      }
    }
    
    users.set(socket.id, {
      id: socket.id,
      username: username || `Kullanıcı ${socket.id.substring(0, 6)}`,
      roomId: roomId,
      isHost: true,
      avatar: '',
      color: generateUserColor(socket.id),
      status: 'online',
      role: userRole
    });
    
    // Kullanıcı istatistiklerini güncelle
    if (username && !userStats.has(username)) {
      userStats.set(username, {
        roomsJoined: 0,
        messagesSent: 0,
        totalTime: 0,
        favoriteRooms: [],
        lastSeen: Date.now(),
        createdAt: Date.now()
      });
    }
    if (username && userStats.has(username)) {
      const stats = userStats.get(username);
      stats.roomsJoined++;
      stats.lastSeen = Date.now();
    }

    socket.join(roomId);
    socket.emit('room-created', { roomId });
    
    const room = rooms.get(roomId);
    
    io.to(roomId).emit('user-joined', {
      userId: socket.id,
      username: users.get(socket.id).username,
      users: Array.from(room.users).map(id => ({
        id,
        username: users.get(id)?.username || 'Bilinmeyen',
        isHost: id === room.hostId,
        avatar: users.get(id)?.avatar || '',
        color: users.get(id)?.color || '',
        status: users.get(id)?.status || 'online',
        role: users.get(id)?.role || 'user'
      }))
    });
    
    // Bildirim gönder (yeni kullanıcı)
    socket.to(roomId).emit('notification', {
      type: 'user-joined',
      message: `${users.get(socket.id).username} odaya katıldı`
    });
    
    room.stats.totalViews++;

    console.log(`Oda oluşturuldu: ${roomId} - Kullanıcı: ${username}`);
  });

  // Odaya katıl
  socket.on('join-room', async (data) => {
    const { roomId, username, password } = data;
    
    if (!roomId || roomId.trim() === '') {
      socket.emit('room-error', { message: 'Oda ID boş olamaz!' });
      return;
    }
    
    // Oda ID'sini normalize et (büyük harfe çevir ve trim yap)
    const normalizedRoomId = roomId.trim().toUpperCase();
    
    // Tüm oda ID'lerini kontrol et (büyük/küçük harf duyarsız)
    let foundRoomId = null;
    for (const [id] of rooms.entries()) {
      if (id.toUpperCase() === normalizedRoomId) {
        foundRoomId = id;
        break;
      }
    }
    
    if (!foundRoomId) {
      socket.emit('room-error', { message: `"${normalizedRoomId}" ID'li oda bulunamadı! Lütfen oda ID'sini kontrol edin.` });
      return;
    }

    const room = rooms.get(foundRoomId);
    // Şifre kontrolü
    if (room.password && room.password !== password) {
      socket.emit('room-error', { message: 'Oda şifresi yanlış! Lütfen doğru şifreyi girin.' });
      return;
    }

    room.users.add(socket.id);

    // Kullanıcı rolünü belirle
    let userRole = 'user';
    if (username) {
      const dbRole = await getUserRoleFromDB(username);
      if (dbRole) {
        userRole = dbRole;
      } else if (adminUsers.has(username.toUpperCase())) {
        userRole = 'admin';
      }
    }
    
    users.set(socket.id, {
      id: socket.id,
      username: username || `Kullanıcı ${socket.id.substring(0, 6)}`,
      roomId: foundRoomId,
      isHost: false,
      avatar: '',
      color: generateUserColor(socket.id),
      status: 'online',
      role: userRole
    });
    
    // Kullanıcı istatistiklerini güncelle
    if (username && !userStats.has(username)) {
      userStats.set(username, {
        roomsJoined: 0,
        messagesSent: 0,
        totalTime: 0,
        favoriteRooms: [],
        lastSeen: Date.now(),
        createdAt: Date.now()
      });
    }
    if (username && userStats.has(username)) {
      const stats = userStats.get(username);
      stats.roomsJoined++;
      stats.lastSeen = Date.now();
    }
    
    // Kullanıcı geçmişine ekle
    if (username && !userHistory.has(username)) {
      userHistory.set(username, []);
    }
    if (username) {
      userHistory.get(username).push({
        roomId: foundRoomId,
        joinedAt: Date.now(),
        leftAt: null
      });
    }

    socket.join(foundRoomId);

    // Yeni kullanıcıya mevcut oda durumunu gönder
    socket.emit('room-state', {
      videoUrl: room.videoUrl,
      isPlaying: room.isPlaying,
      currentTime: room.currentTime,
      hostId: room.hostId,
      volume: room.volume,
      users: Array.from(room.users).map(id => ({
        id,
        username: users.get(id)?.username || 'Bilinmeyen',
        isHost: id === room.hostId,
        avatar: users.get(id)?.avatar || '',
        color: users.get(id)?.color || '',
        status: users.get(id)?.status || 'online',
        role: users.get(id)?.role || 'user'
      })),
      isMuted: room.mutedUsers.has(socket.id),
      hasPassword: !!room.password,
      playlist: room.playlist,
      currentPlaylistIndex: room.currentPlaylistIndex,
      roomName: room.name,
      roomDescription: room.description,
      maxUsers: room.maxUsers,
      category: room.category,
      tags: room.tags,
      isPublic: room.isPublic
    });

    // Diğer kullanıcılara yeni kullanıcıyı bildir
    socket.to(foundRoomId).emit('user-joined', {
      userId: socket.id,
      username: users.get(socket.id).username,
      users: Array.from(room.users).map(id => ({
        id,
        username: users.get(id)?.username || 'Bilinmeyen',
        isHost: id === room.hostId,
        avatar: users.get(id)?.avatar || '',
        color: users.get(id)?.color || '',
        status: users.get(id)?.status || 'online',
        role: users.get(id)?.role || 'user'
      })),
      hostId: room.hostId
    });
    
    // Bildirim gönder (yeni kullanıcı)
    socket.to(foundRoomId).emit('notification', {
      type: 'user-joined',
      message: `${users.get(socket.id).username} odaya katıldı`
    });
    
    room.stats.totalViews++;

    console.log(`Kullanıcı odaya katıldı: ${foundRoomId} - ${username}`);
  });

  // Video URL değişikliği
  socket.on('change-video', (data) => {
    const { roomId, videoUrl, addToPlaylist } = data;
    const user = users.get(socket.id);
    
    if (!user || user.roomId !== roomId) return;
    if (!rooms.has(roomId)) return;

    const room = rooms.get(roomId);
    
    // Eğer playlist'e ekleniyorsa
    if (addToPlaylist && videoUrl) {
      room.playlist.push({
        id: uuidv4(),
        url: videoUrl,
        addedBy: user.username,
        addedAt: Date.now()
      });
      room.stats.totalVideos++;
      io.to(roomId).emit('playlist-updated', { playlist: room.playlist });
    }
    
    // Video değiştir
    room.videoUrl = videoUrl;
    room.currentTime = 0;
    room.isPlaying = false;
    if (addToPlaylist) {
      room.currentPlaylistIndex = room.playlist.length - 1;
    }

    io.to(roomId).emit('video-changed', { videoUrl, changedBy: user.username });
    
    // Bildirim gönder (video değişikliği)
    socket.to(roomId).emit('notification', {
      type: 'video-changed',
      message: `${user.username} yeni bir video yükledi`
    });
  });

  // Video oynatma kontrolü
  socket.on('video-control', (data) => {
    const { roomId, action, time, volume } = data;
    console.log('[Server] video-control event alındı:', { roomId, action, time, volume, socketId: socket.id });
    const user = users.get(socket.id);
    
    if (!user || user.roomId !== roomId) {
      console.log('[Server] Kullanıcı veya oda bulunamadı');
      return;
    }
    if (!rooms.has(roomId)) {
      console.log('[Server] Oda bulunamadı:', roomId);
      return;
    }

    const room = rooms.get(roomId);
    const now = Date.now();

    // Volume değişiklikleri için throttle yok (anında senkronizasyon)
    // Diğer kontroller için throttle uygula
    if (action !== 'volume') {
      // Çok sık güncellemeleri filtrele (spam koruması)
      if (now - room.lastUpdate < 50) return; // Daha hızlı senkronizasyon için 50ms
      room.lastUpdate = now;
    }

    switch (action) {
      case 'play':
        room.isPlaying = true;
        room.currentTime = time || room.currentTime;
        break;
      case 'pause':
        room.isPlaying = false;
        room.currentTime = time || room.currentTime;
        break;
      case 'seek':
        room.currentTime = time;
        room.isPlaying = room.isPlaying; // Seek sırasında oynatma durumunu koru
        break;
      case 'time-update':
        room.currentTime = time;
        break;
      case 'volume':
        if (volume !== undefined) {
          const oldVolume = room.volume;
          room.volume = Math.max(0, Math.min(1, volume));
          console.log('[Server] Volume güncellendi:', oldVolume, '->', room.volume);
        } else {
          console.log('[Server] Volume undefined!');
        }
        break;
    }

    // Tüm kullanıcılara bildir (gönderen dahil - senkronizasyon için)
    const syncData = {
      action,
      time: room.currentTime,
      isPlaying: room.isPlaying,
      volume: room.volume,
      timestamp: now
    };
    console.log('[Server] video-sync gönderiliyor:', syncData);
    io.to(roomId).emit('video-sync', syncData);
  });

  // Playlist yönetimi
  socket.on('playlist-add', (data) => {
    const { roomId, videoUrl } = data;
    const user = users.get(socket.id);
    
    if (!user || user.roomId !== roomId) return;
    if (!rooms.has(roomId)) return;

    const room = rooms.get(roomId);
    room.playlist.push({
      id: uuidv4(),
      url: videoUrl,
      addedBy: user.username,
      addedAt: Date.now()
    });
    room.stats.totalVideos++;

    io.to(roomId).emit('playlist-updated', { playlist: room.playlist });
  });

  socket.on('playlist-remove', (data) => {
    const { roomId, videoId } = data;
    const user = users.get(socket.id);
    
    if (!user || user.roomId !== roomId) return;
    if (!rooms.has(roomId)) return;

    const room = rooms.get(roomId);
    const index = room.playlist.findIndex(v => v.id === videoId);
    if (index !== -1) {
      room.playlist.splice(index, 1);
      // Eğer silinen video şu anki videoydu, bir sonrakine geç
      if (room.currentPlaylistIndex === index) {
        if (room.playlist.length > 0) {
          room.currentPlaylistIndex = Math.min(index, room.playlist.length - 1);
          if (room.currentPlaylistIndex >= 0) {
            room.videoUrl = room.playlist[room.currentPlaylistIndex].url;
            room.currentTime = 0;
            room.isPlaying = false;
            io.to(roomId).emit('video-changed', { 
              videoUrl: room.videoUrl, 
              changedBy: 'Sistem' 
            });
          }
        } else {
          room.currentPlaylistIndex = -1;
          room.videoUrl = '';
        }
      } else if (room.currentPlaylistIndex > index) {
        room.currentPlaylistIndex--;
      }
      io.to(roomId).emit('playlist-updated', { playlist: room.playlist });
    }
  });

  socket.on('playlist-reorder', (data) => {
    const { roomId, fromIndex, toIndex } = data;
    const user = users.get(socket.id);
    
    if (!user || user.roomId !== roomId) return;
    if (!rooms.has(roomId)) return;
    // Sadece host playlist sıralamasını değiştirebilir
    const room = rooms.get(roomId);
    if (room.hostId !== socket.id) return;

    const [moved] = room.playlist.splice(fromIndex, 1);
    room.playlist.splice(toIndex, 0, moved);
    
    // Index güncelle
    if (room.currentPlaylistIndex === fromIndex) {
      room.currentPlaylistIndex = toIndex;
    } else if (room.currentPlaylistIndex === toIndex) {
      room.currentPlaylistIndex = fromIndex;
    }

    io.to(roomId).emit('playlist-updated', { playlist: room.playlist });
  });

  socket.on('playlist-next', (data) => {
    const { roomId } = data;
    const user = users.get(socket.id);
    
    if (!user || user.roomId !== roomId) return;
    if (!rooms.has(roomId)) return;

    const room = rooms.get(roomId);
    if (room.playlist.length > 0 && room.currentPlaylistIndex < room.playlist.length - 1) {
      room.currentPlaylistIndex++;
      room.videoUrl = room.playlist[room.currentPlaylistIndex].url;
      room.currentTime = 0;
      room.isPlaying = false;
      io.to(roomId).emit('video-changed', { 
        videoUrl: room.videoUrl, 
        changedBy: user.username 
      });
    }
  });

  socket.on('playlist-previous', (data) => {
    const { roomId } = data;
    const user = users.get(socket.id);
    
    if (!user || user.roomId !== roomId) return;
    if (!rooms.has(roomId)) return;

    const room = rooms.get(roomId);
    if (room.playlist.length > 0 && room.currentPlaylistIndex > 0) {
      room.currentPlaylistIndex--;
      room.videoUrl = room.playlist[room.currentPlaylistIndex].url;
      room.currentTime = 0;
      room.isPlaying = false;
      io.to(roomId).emit('video-changed', { 
        videoUrl: room.videoUrl, 
        changedBy: user.username 
      });
    }
  });

  // Oda özellikleri güncelleme
  socket.on('update-room', (data) => {
    const { roomId, name, description, maxUsers, category, tags, isPublic } = data;
    const user = users.get(socket.id);
    
    if (!user || user.roomId !== roomId) return;
    if (!rooms.has(roomId)) return;

    const room = rooms.get(roomId);
    // Sadece host oda özelliklerini güncelleyebilir
    if (room.hostId !== socket.id) return;

    if (name !== undefined) room.name = name;
    if (description !== undefined) room.description = description;
    if (maxUsers !== undefined) room.maxUsers = maxUsers;
    if (category !== undefined) room.category = category;
    if (tags !== undefined) room.tags = tags;
    if (isPublic !== undefined) room.isPublic = isPublic;

    io.to(roomId).emit('room-updated', {
      name: room.name,
      description: room.description,
      maxUsers: room.maxUsers,
      category: room.category,
      tags: room.tags,
      isPublic: room.isPublic
    });
  });

  // Kullanıcı özellikleri güncelleme
  socket.on('update-user', (data) => {
    const { avatar, status } = data;
    const user = users.get(socket.id);
    
    if (!user) return;

    if (avatar !== undefined) user.avatar = avatar;
    if (status !== undefined) user.status = status;

    // Odaya bildir
    if (user.roomId) {
      io.to(user.roomId).emit('user-updated', {
        userId: socket.id,
        avatar: user.avatar,
        status: user.status
      });
    }
  });

  // Video bitince otomatik playlist geçişi
  socket.on('video-ended', (data) => {
    const { roomId } = data;
    const user = users.get(socket.id);
    
    if (!user || user.roomId !== roomId) return;
    if (!rooms.has(roomId)) return;

    const room = rooms.get(roomId);
    // Playlist'te bir sonraki videoya geç
    if (room.playlist.length > 0 && room.currentPlaylistIndex < room.playlist.length - 1) {
      room.currentPlaylistIndex++;
      room.videoUrl = room.playlist[room.currentPlaylistIndex].url;
      room.currentTime = 0;
      room.isPlaying = true; // Otomatik başlat
      io.to(roomId).emit('video-changed', { 
        videoUrl: room.videoUrl, 
        changedBy: 'Sistem (Otomatik)' 
      });
      io.to(roomId).emit('video-sync', {
        action: 'play',
        time: 0,
        isPlaying: true,
        volume: room.volume,
        timestamp: Date.now()
      });
    }
  });

  // Chat mesajı
  socket.on('chat-message', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const room = rooms.get(user.roomId);
    if (!room) return;

    // Chat yazması engellenmiş mi kontrol et
    if (room.mutedUsers.has(socket.id)) {
      socket.emit('chat-error', { message: 'Chat yazma yetkiniz yok!' });
      return;
    }

    const message = {
      id: uuidv4(),
      userId: socket.id,
      username: user.username,
      avatar: user.avatar || '',
      color: user.color || '',
      message: data.message,
      timestamp: Date.now()
    };

    room.stats.totalMessages++;
    io.to(user.roomId).emit('chat-message', message);
    
    // Kullanıcı istatistiklerini güncelle
    if (userStats.has(user.username)) {
      userStats.get(user.username).messagesSent++;
    }
    
    // Bildirim gönder (yeni mesaj)
    socket.to(user.roomId).emit('notification', {
      type: 'new-message',
      message: `${user.username}: ${data.message.substring(0, 50)}${data.message.length > 50 ? '...' : ''}`
    });
  });

  // Kullanıcıyı odadan at
  socket.on('kick-user', (data) => {
    const { roomId, targetUserId } = data;
    const user = users.get(socket.id);
    const room = rooms.get(roomId);

    if (!user || !room) return;
    if (room.hostId !== socket.id) {
      socket.emit('error', { message: 'Sadece oda sahibi kullanıcı atabilir!' });
      return;
    }

    const targetSocket = io.sockets.sockets.get(targetUserId);
    if (targetSocket) {
      targetSocket.emit('kicked', { message: 'Odadan atıldınız!' });
      targetSocket.leave(roomId);
      room.users.delete(targetUserId);
      users.delete(targetUserId);
      
      io.to(roomId).emit('user-left', {
        userId: targetUserId,
        username: users.get(targetUserId)?.username || 'Bilinmeyen',
        users: Array.from(room.users).map(id => ({
          id,
          username: users.get(id)?.username || 'Bilinmeyen',
          isHost: id === room.hostId
        }))
      });
    }
  });

  // Kullanıcının chat yazmasını engelle/aç
  socket.on('toggle-mute-user', (data) => {
    const { roomId, targetUserId } = data;
    const user = users.get(socket.id);
    const room = rooms.get(roomId);

    if (!user || !room) return;
    if (room.hostId !== socket.id) {
      socket.emit('error', { message: 'Sadece oda sahibi bu işlemi yapabilir!' });
      return;
    }

    if (room.mutedUsers.has(targetUserId)) {
      room.mutedUsers.delete(targetUserId);
    } else {
      room.mutedUsers.add(targetUserId);
    }

    const targetSocket = io.sockets.sockets.get(targetUserId);
    if (targetSocket) {
      targetSocket.emit('mute-status', { isMuted: room.mutedUsers.has(targetUserId) });
    }

    io.to(roomId).emit('user-muted', {
      userId: targetUserId,
      isMuted: room.mutedUsers.has(targetUserId)
    });
  });

  // Oda sahipliğini devret
  socket.on('transfer-host', (data) => {
    const { roomId, newHostId } = data;
    const user = users.get(socket.id);
    const room = rooms.get(roomId);

    if (!user || !room) return;
    if (room.hostId !== socket.id) {
      socket.emit('error', { message: 'Sadece oda sahibi sahiplik devredebilir!' });
      return;
    }

    if (!room.users.has(newHostId)) {
      socket.emit('error', { message: 'Kullanıcı odada değil!' });
      return;
    }

    // Eski host'u güncelle
    const oldHost = users.get(room.hostId);
    if (oldHost) {
      oldHost.isHost = false;
    }

    // Yeni host'u ayarla
    room.hostId = newHostId;
    const newHost = users.get(newHostId);
    if (newHost) {
      newHost.isHost = true;
    }

    io.to(roomId).emit('host-transferred', {
      newHostId,
      users: Array.from(room.users).map(id => ({
        id,
        username: users.get(id)?.username || 'Bilinmeyen',
        isHost: id === room.hostId
      }))
    });
  });

  // Odayı sil
  socket.on('delete-room', (data) => {
    const { roomId } = data;
    const user = users.get(socket.id);
    const room = rooms.get(roomId);

    if (!user || !room) return;
    if (room.hostId !== socket.id) {
      socket.emit('error', { message: 'Sadece oda sahibi odayı silebilir!' });
      return;
    }

    // Tüm kullanıcılara oda silindiğini bildir
    io.to(roomId).emit('room-deleted', { message: 'Oda sahibi tarafından silindi!' });

    // Tüm kullanıcıları odadan çıkar
    room.users.forEach(userId => {
      const userSocket = io.sockets.sockets.get(userId);
      if (userSocket) {
        userSocket.leave(roomId);
        users.delete(userId);
      }
    });

    // Odayı sil
    rooms.delete(roomId);
  });

  // WebRTC Signaling - Screen Share için
  socket.on('screen-share-offer', (data) => {
    const { roomId, offer, targetUserId } = data;
    const user = users.get(socket.id);
    
    if (!user || user.roomId !== roomId) return;
    if (!rooms.has(roomId)) return;
    
    // Sadece host ekran paylaşabilir
    const room = rooms.get(roomId);
    if (room.hostId !== socket.id) return;
    
    // Belirli bir kullanıcıya veya tüm odaya gönder
    if (targetUserId) {
      socket.to(targetUserId).emit('screen-share-offer', { offer, fromUserId: socket.id });
    } else {
      socket.to(roomId).emit('screen-share-offer', { offer, fromUserId: socket.id });
    }
  });

  socket.on('screen-share-answer', (data) => {
    const { roomId, answer, targetUserId } = data;
    const user = users.get(socket.id);
    
    if (!user || user.roomId !== roomId) return;
    if (!rooms.has(roomId)) return;
    
    // Answer'ı host'a gönder
    if (targetUserId) {
      socket.to(targetUserId).emit('screen-share-answer', { answer, fromUserId: socket.id });
    }
  });

  socket.on('screen-share-ice-candidate', (data) => {
    const { roomId, candidate, targetUserId } = data;
    const user = users.get(socket.id);
    
    if (!user || user.roomId !== roomId) return;
    if (!rooms.has(roomId)) return;
    
    // ICE candidate'ı hedef kullanıcıya gönder
    if (targetUserId) {
      socket.to(targetUserId).emit('screen-share-ice-candidate', { candidate, fromUserId: socket.id });
    } else {
      // Tüm odaya gönder (host için)
      const room = rooms.get(roomId);
      if (room.hostId === socket.id) {
        socket.to(roomId).emit('screen-share-ice-candidate', { candidate, fromUserId: socket.id });
      }
    }
  });

  socket.on('screen-share-end', (data) => {
    const { roomId } = data;
    const user = users.get(socket.id);
    
    if (!user || user.roomId !== roomId) return;
    if (!rooms.has(roomId)) return;
    
    // Tüm odaya bildir
    socket.to(roomId).emit('screen-share-end', { fromUserId: socket.id });
  });

  // Kullanıcı profil bilgilerini al
  socket.on('get-user-profile', (data) => {
    const { username } = data;
    const user = users.get(socket.id);
    
    console.log('Get-user-profile çağrıldı:', { socketId: socket.id, requestedUsername: username, user, userUsername: user?.username });
    
    if (!user) {
      console.log('Kullanıcı bulunamadı:', { socketId: socket.id });
      socket.emit('user-profile-error', { message: 'Kullanıcı bulunamadı! Lütfen odaya katıldığınızdan emin olun.' });
      return;
    }
    
    // Kullanıcı kendi profilini görüntüleyebilir
    if (user.username !== username) {
      console.log('Yetkisiz erişim:', { userUsername: user.username, requestedUsername: username });
      socket.emit('user-profile-error', { message: 'Yetkisiz erişim! Sadece kendi profilinizi görüntüleyebilirsiniz.' });
      return;
    }
    
    const stats = userStats.get(username) || {
      roomsJoined: 0,
      messagesSent: 0,
      totalTime: 0,
      favoriteRooms: [],
      lastSeen: Date.now(),
      createdAt: Date.now()
    };
    
    const history = userHistory.get(username) || [];
    
    socket.emit('user-profile', {
      username: user.username,
      avatar: user.avatar,
      color: user.color,
      status: user.status,
      role: user.role,
      stats,
      history: history.slice(-50) // Son 50 oda geçmişi
    });
  });

  // Admin: Tüm odaları listele
  socket.on('admin-get-rooms', () => {
    const user = users.get(socket.id);
    console.log('Admin-get-rooms çağrıldı:', { socketId: socket.id, user, role: user?.role, username: user?.username });
    if (!user || user.role !== 'admin') {
      console.log('Yetkisiz erişim:', { hasUser: !!user, role: user?.role });
      socket.emit('admin-error', { message: 'Yetkisiz erişim!' });
      return;
    }
    
    const allRooms = Array.from(rooms.entries()).map(([id, room]) => ({
      id: room.id,
      name: room.name || `Oda ${room.id}`,
      description: room.description,
      hostId: room.hostId,
      hostUsername: users.get(room.hostId)?.username || 'Bilinmeyen',
      userCount: room.users.size,
      maxUsers: room.maxUsers,
      isPublic: room.isPublic,
      category: room.category,
      tags: room.tags,
      createdAt: room.createdAt,
      stats: room.stats,
      hasPassword: !!room.password
    }));
    
    socket.emit('admin-rooms', allRooms);
  });

  // Admin: Tüm kullanıcıları listele
  socket.on('admin-get-users', () => {
    const user = users.get(socket.id);
    if (!user || user.role !== 'admin') {
      socket.emit('admin-error', { message: 'Yetkisiz erişim!' });
      return;
    }
    
    const allUsers = Array.from(users.entries()).map(([id, u]) => ({
      id: u.id,
      username: u.username,
      avatar: u.avatar,
      color: u.color,
      status: u.status,
      role: u.role,
      roomId: u.roomId,
      isHost: u.isHost,
      stats: userStats.get(u.username) || {
        roomsJoined: 0,
        messagesSent: 0,
        totalTime: 0,
        favoriteRooms: [],
        lastSeen: Date.now()
      }
    }));
    
    socket.emit('admin-users', allUsers);
  });

  // Admin: Sistem istatistikleri
  socket.on('admin-get-stats', () => {
    const user = users.get(socket.id);
    if (!user || user.role !== 'admin') {
      socket.emit('admin-error', { message: 'Yetkisiz erişim!' });
      return;
    }
    
    const totalRooms = rooms.size;
    const totalUsers = users.size;
    const totalMessages = Array.from(rooms.values()).reduce((sum, room) => sum + room.stats.totalMessages, 0);
    const totalVideos = Array.from(rooms.values()).reduce((sum, room) => sum + room.stats.totalVideos, 0);
    const totalViews = Array.from(rooms.values()).reduce((sum, room) => sum + room.stats.totalViews, 0);
    const publicRooms = Array.from(rooms.values()).filter(r => r.isPublic).length;
    
    socket.emit('admin-stats', {
      totalRooms,
      totalUsers,
      totalMessages,
      totalVideos,
      totalViews,
      publicRooms,
      activeRooms: Array.from(rooms.values()).filter(r => r.users.size > 0).length
    });
  });

  // Admin: Odayı sil
  socket.on('admin-delete-room', (data) => {
    const { roomId } = data;
    const user = users.get(socket.id);
    
    if (!user || user.role !== 'admin') {
      socket.emit('admin-error', { message: 'Yetkisiz erişim!' });
      return;
    }
    
    if (!rooms.has(roomId)) {
      socket.emit('admin-error', { message: 'Oda bulunamadı!' });
      return;
    }
    
    const room = rooms.get(roomId);
    
    // Tüm kullanıcılara oda silindiğini bildir
    io.to(roomId).emit('room-deleted', { message: 'Oda admin tarafından silindi!' });
    
    // Tüm kullanıcıları odadan çıkar
    room.users.forEach(userId => {
      const userSocket = io.sockets.sockets.get(userId);
      if (userSocket) {
        userSocket.leave(roomId);
        const u = users.get(userId);
        if (u && userHistory.has(u.username)) {
          const history = userHistory.get(u.username);
          const lastEntry = history[history.length - 1];
          if (lastEntry && lastEntry.roomId === roomId && !lastEntry.leftAt) {
            lastEntry.leftAt = Date.now();
          }
        }
      }
    });
    
    // Odayı sil
    rooms.delete(roomId);
    
    socket.emit('admin-room-deleted', { roomId });
  });

  // Admin: Kullanıcıyı banla
  socket.on('admin-ban-user', (data) => {
    const { targetUsername } = data;
    const user = users.get(socket.id);
    
    if (!user || user.role !== 'admin') {
      socket.emit('admin-error', { message: 'Yetkisiz erişim!' });
      return;
    }
    
    // Tüm kullanıcının bağlantılarını kes
    const targetSockets = Array.from(users.entries())
      .filter(([id, u]) => u.username === targetUsername)
      .map(([id]) => id);
    
    targetSockets.forEach(socketId => {
      const targetSocket = io.sockets.sockets.get(socketId);
      if (targetSocket) {
        targetSocket.emit('banned', { message: 'Hesabınız yasaklandı!' });
        targetSocket.disconnect();
      }
    });
    
    socket.emit('admin-user-banned', { username: targetUsername });
  });

  // Bağlantı kesildiğinde
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user && user.roomId) {
      const room = rooms.get(user.roomId);
      if (room) {
        room.users.delete(socket.id);

        // Oda boşsa sil
        if (room.users.size === 0) {
          rooms.delete(user.roomId);
          console.log(`Oda silindi: ${user.roomId}`);
        } else {
          // Diğer kullanıcılara bildir
      io.to(user.roomId).emit('user-left', {
        userId: socket.id,
        username: user.username,
        users: Array.from(room.users).map(id => ({
          id,
          username: users.get(id)?.username || 'Bilinmeyen',
          isHost: id === room.hostId,
          avatar: users.get(id)?.avatar || '',
          color: users.get(id)?.color || '',
          status: users.get(id)?.status || 'online',
          role: users.get(id)?.role || 'user'
        })),
        hostId: room.hostId
      });
        }
      }
      
      // Kullanıcı geçmişini güncelle
      if (user.username && userHistory.has(user.username)) {
        const history = userHistory.get(user.username);
        const lastEntry = history[history.length - 1];
        if (lastEntry && lastEntry.roomId === user.roomId && !lastEntry.leftAt) {
          lastEntry.leftAt = Date.now();
          if (userStats.has(user.username)) {
            const stats = userStats.get(user.username);
            if (lastEntry.joinedAt) {
              stats.totalTime += (Date.now() - lastEntry.joinedAt);
            }
          }
        }
      }
    }
    users.delete(socket.id);
    console.log('Kullanıcı ayrıldı:', socket.id);
  });
});

// Public odalar listesi (arama için)
app.get('/api/rooms', (req, res) => {
  const publicRooms = Array.from(rooms.entries())
    .filter(([id, room]) => room.isPublic)
    .map(([id, room]) => ({
      id: room.id,
      name: room.name || `Oda ${room.id}`,
      description: room.description,
      category: room.category,
      tags: room.tags,
      userCount: room.users.size,
      maxUsers: room.maxUsers,
      createdAt: room.createdAt,
      stats: room.stats
    }))
    .sort((a, b) => b.stats.totalViews - a.stats.totalViews);
  
  res.json(publicRooms);
});

// Kullanıcı profil API
app.get('/api/user/:username', (req, res) => {
  const { username } = req.params;
  const stats = userStats.get(username) || {
    roomsJoined: 0,
    messagesSent: 0,
    totalTime: 0,
    favoriteRooms: [],
    lastSeen: Date.now()
  };
  const history = userHistory.get(username) || [];
  
  res.json({
    username,
    stats,
    history: history.slice(-50)
  });
});

// Admin API - Sistem istatistikleri
app.get('/api/admin/stats', (req, res) => {
  // Basit admin kontrolü (production'da JWT token kullanılmalı)
  const adminToken = req.headers.authorization;
  if (adminToken !== 'ADMIN_TOKEN') {
    return res.status(403).json({ error: 'Yetkisiz erişim!' });
  }
  
  const totalRooms = rooms.size;
  const totalUsers = users.size;
  const totalMessages = Array.from(rooms.values()).reduce((sum, room) => sum + room.stats.totalMessages, 0);
  const totalVideos = Array.from(rooms.values()).reduce((sum, room) => sum + room.stats.totalVideos, 0);
  const totalViews = Array.from(rooms.values()).reduce((sum, room) => sum + room.stats.totalViews, 0);
  
  res.json({
    totalRooms,
    totalUsers,
    totalMessages,
    totalVideos,
    totalViews,
    publicRooms: Array.from(rooms.values()).filter(r => r.isPublic).length,
    activeRooms: Array.from(rooms.values()).filter(r => r.users.size > 0).length
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database bağlantısını test et
const testDatabaseConnection = async () => {
  const provider = db.getProvider();
  console.log(`📊 Database Provider: ${provider.toUpperCase()}`);
  
  if (provider === 'mysql' || provider === 'supabase' || provider === 'postgres' || provider === 'postgresql') {
    const result = await db.testConnection();
    if (result.connected) {
      console.log(`✅ ${provider.toUpperCase()} bağlantısı başarılı!`);
    } else {
      console.warn(`⚠️ ${provider.toUpperCase()} bağlantısı başarısız:`, result.error);
      console.warn('⚠️ In-memory storage kullanılacak.');
    }
  } else {
    console.warn('⚠️ Geçersiz database provider! In-memory storage kullanılacak.');
  }
};

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Docker container'ları için 0.0.0.0 gerekli

httpServer.listen(PORT, HOST, async () => {
  console.log(`🚀 Sunucu çalışıyor: http://${HOST}:${PORT}`);
  await testDatabaseConnection();
});

