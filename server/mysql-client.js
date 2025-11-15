/**
 * MySQL Client Setup for Server
 * 
 * Bu dosya server-side MySQL bağlantısı için kullanılır.
 */

import mysql from 'mysql2/promise';

const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'watch_together',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Connection pool oluştur
let pool = null;

if (process.env.MYSQL_HOST && process.env.MYSQL_DATABASE) {
  try {
    pool = mysql.createPool(mysqlConfig);
    console.log('✅ MySQL connection pool oluşturuldu');
  } catch (error) {
    console.error('❌ MySQL connection pool oluşturulamadı:', error);
  }
} else {
  console.warn('⚠️ MySQL environment variables eksik! In-memory storage kullanılacak.');
}

/**
 * MySQL bağlantısını test et
 */
export async function testMySQLConnection() {
  if (!pool) {
    return { connected: false, error: 'MySQL pool oluşturulamadı' };
  }

  try {
    const [rows] = await pool.execute('SELECT 1 as test');
    return { connected: true };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

/**
 * Room verilerini MySQL'e kaydet
 */
export async function saveRoomToMySQL(roomData) {
  if (!pool) return null;

  try {
    const query = `
      INSERT INTO rooms (
        id, host_id, password, name, description, max_users, category, 
        tags, is_public, video_url, is_playing, current_time, volume, 
        current_playlist_index, stats, updated_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), COALESCE((SELECT created_at FROM rooms WHERE id = ?), NOW()))
      ON DUPLICATE KEY UPDATE
        host_id = VALUES(host_id),
        password = VALUES(password),
        name = VALUES(name),
        description = VALUES(description),
        max_users = VALUES(max_users),
        category = VALUES(category),
        tags = VALUES(tags),
        is_public = VALUES(is_public),
        video_url = VALUES(video_url),
        is_playing = VALUES(is_playing),
        current_time = VALUES(current_time),
        volume = VALUES(volume),
        current_playlist_index = VALUES(current_playlist_index),
        stats = VALUES(stats),
        updated_at = NOW()
    `;

    const tagsJson = JSON.stringify(roomData.tags || []);
    const statsJson = JSON.stringify(roomData.stats || {});

    await pool.execute(query, [
      roomData.id,
      roomData.hostId,
      roomData.password || null,
      roomData.name || null,
      roomData.description || null,
      roomData.maxUsers || 0,
      roomData.category || null,
      tagsJson,
      roomData.isPublic ? 1 : 0,
      roomData.videoUrl || null,
      roomData.isPlaying ? 1 : 0,
      roomData.currentTime || 0,
      roomData.volume || 1.0,
      roomData.currentPlaylistIndex || -1,
      statsJson,
      roomData.id
    ]);

    return { success: true };
  } catch (error) {
    console.error('MySQL room save error:', error);
    return null;
  }
}

/**
 * MySQL'den room verilerini al
 */
export async function getRoomFromMySQL(roomId) {
  if (!pool) return null;

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM rooms WHERE id = ?',
      [roomId]
    );

    if (rows.length === 0) return null;

    const room = rows[0];
    
    // JSON alanları parse et
    if (room.tags) {
      try {
        room.tags = typeof room.tags === 'string' ? JSON.parse(room.tags) : room.tags;
      } catch (e) {
        room.tags = [];
      }
    }
    
    if (room.stats) {
      try {
        room.stats = typeof room.stats === 'string' ? JSON.parse(room.stats) : room.stats;
      } catch (e) {
        room.stats = {};
      }
    }

    // Boolean değerleri dönüştür
    room.is_public = Boolean(room.is_public);
    room.is_playing = Boolean(room.is_playing);

    return room;
  } catch (error) {
    console.error('MySQL room get error:', error);
    return null;
  }
}

/**
 * Chat mesajını MySQL'e kaydet
 */
export async function saveChatMessageToMySQL(messageData) {
  if (!pool) return null;

  try {
    const query = `
      INSERT INTO chat_messages (room_id, user_id, username, message, avatar, color, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    await pool.execute(query, [
      messageData.roomId,
      messageData.userId,
      messageData.username,
      messageData.message,
      messageData.avatar || null,
      messageData.color || null
    ]);

    return { success: true };
  } catch (error) {
    console.error('MySQL chat message save error:', error);
    return null;
  }
}

/**
 * Kullanıcı istatistiklerini güncelle
 */
export async function updateUserStatsMySQL(username, statsUpdate) {
  if (!pool) return null;

  try {
    const query = `
      INSERT INTO user_stats (username, rooms_joined, messages_sent, total_time, favorite_rooms, last_seen, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        rooms_joined = COALESCE(?, rooms_joined),
        messages_sent = COALESCE(?, messages_sent),
        total_time = COALESCE(?, total_time),
        favorite_rooms = COALESCE(?, favorite_rooms),
        last_seen = NOW(),
        updated_at = NOW()
    `;

    const favoriteRoomsJson = JSON.stringify(statsUpdate.favoriteRooms || []);

    await pool.execute(query, [
      username,
      statsUpdate.roomsJoined || 0,
      statsUpdate.messagesSent || 0,
      statsUpdate.totalTime || 0,
      favoriteRoomsJson,
      statsUpdate.roomsJoined,
      statsUpdate.messagesSent,
      statsUpdate.totalTime,
      favoriteRoomsJson
    ]);

    return { success: true };
  } catch (error) {
    console.error('MySQL user stats update error:', error);
    return null;
  }
}

/**
 * Connection pool'u kapat
 */
export async function closeMySQLConnection() {
  if (pool) {
    await pool.end();
    console.log('MySQL connection pool kapatıldı');
  }
}

