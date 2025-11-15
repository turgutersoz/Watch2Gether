/**
 * PostgreSQL Client Setup for Server
 * 
 * Bu dosya server-side PostgreSQL bağlantısı için kullanılır.
 * Supabase yerine standalone PostgreSQL kullanımı için.
 */

import pg from 'pg';
const { Pool } = pg;

const postgresConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
  database: process.env.POSTGRES_DATABASE || 'watch_together',
  max: 20, // Connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Connection pool oluştur
let pool = null;

if (process.env.POSTGRES_HOST && process.env.POSTGRES_DATABASE) {
  try {
    pool = new Pool(postgresConfig);
    console.log('✅ PostgreSQL connection pool oluşturuldu');
    
    // Connection error handling
    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  } catch (error) {
    console.error('❌ PostgreSQL connection pool oluşturulamadı:', error);
  }
} else {
  console.warn('⚠️ PostgreSQL environment variables eksik! In-memory storage kullanılacak.');
}

/**
 * PostgreSQL bağlantısını test et
 */
export async function testPostgresConnection() {
  if (!pool) {
    return { connected: false, error: 'PostgreSQL pool oluşturulamadı' };
  }

  try {
    const result = await pool.query('SELECT 1 as test');
    return { connected: true };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

/**
 * Room verilerini PostgreSQL'e kaydet
 */
export async function saveRoomToPostgres(roomData) {
  if (!pool) return null;

  try {
    const query = `
      INSERT INTO rooms (
        id, host_id, password, name, description, max_users, category, 
        tags, is_public, video_url, is_playing, current_time, volume, 
        current_playlist_index, stats, updated_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), COALESCE((SELECT created_at FROM rooms WHERE id = $1), NOW()))
      ON CONFLICT (id) DO UPDATE SET
        host_id = EXCLUDED.host_id,
        password = EXCLUDED.password,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        max_users = EXCLUDED.max_users,
        category = EXCLUDED.category,
        tags = EXCLUDED.tags,
        is_public = EXCLUDED.is_public,
        video_url = EXCLUDED.video_url,
        is_playing = EXCLUDED.is_playing,
        current_time = EXCLUDED.current_time,
        volume = EXCLUDED.volume,
        current_playlist_index = EXCLUDED.current_playlist_index,
        stats = EXCLUDED.stats,
        updated_at = NOW()
    `;

    const tagsJson = JSON.stringify(roomData.tags || []);
    const statsJson = JSON.stringify(roomData.stats || {});

    await pool.query(query, [
      roomData.id,
      roomData.hostId,
      roomData.password || null,
      roomData.name || null,
      roomData.description || null,
      roomData.maxUsers || 0,
      roomData.category || null,
      tagsJson,
      roomData.isPublic || false,
      roomData.videoUrl || null,
      roomData.isPlaying || false,
      roomData.currentTime || 0,
      roomData.volume || 1.0,
      roomData.currentPlaylistIndex || -1,
      statsJson
    ]);

    return { success: true };
  } catch (error) {
    console.error('PostgreSQL room save error:', error);
    return null;
  }
}

/**
 * PostgreSQL'den room verilerini al
 */
export async function getRoomFromPostgres(roomId) {
  if (!pool) return null;

  try {
    const result = await pool.query(
      'SELECT * FROM rooms WHERE id = $1',
      [roomId]
    );

    if (result.rows.length === 0) return null;

    const room = result.rows[0];
    
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

    return room;
  } catch (error) {
    console.error('PostgreSQL room get error:', error);
    return null;
  }
}

/**
 * Chat mesajını PostgreSQL'e kaydet
 */
export async function saveChatMessageToPostgres(messageData) {
  if (!pool) return null;

  try {
    const query = `
      INSERT INTO chat_messages (room_id, user_id, username, message, avatar, color, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `;

    await pool.query(query, [
      messageData.roomId,
      messageData.userId,
      messageData.username,
      messageData.message,
      messageData.avatar || null,
      messageData.color || null
    ]);

    return { success: true };
  } catch (error) {
    console.error('PostgreSQL chat message save error:', error);
    return null;
  }
}

/**
 * Kullanıcı istatistiklerini güncelle
 */
export async function updateUserStatsPostgres(username, statsUpdate) {
  if (!pool) return null;

  try {
    const query = `
      INSERT INTO user_stats (username, rooms_joined, messages_sent, total_time, favorite_rooms, last_seen, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (username) DO UPDATE SET
        rooms_joined = COALESCE(EXCLUDED.rooms_joined, user_stats.rooms_joined),
        messages_sent = COALESCE(EXCLUDED.messages_sent, user_stats.messages_sent),
        total_time = COALESCE(EXCLUDED.total_time, user_stats.total_time),
        favorite_rooms = COALESCE(EXCLUDED.favorite_rooms, user_stats.favorite_rooms),
        last_seen = NOW(),
        updated_at = NOW()
    `;

    const favoriteRoomsJson = JSON.stringify(statsUpdate.favoriteRooms || []);

    await pool.query(query, [
      username,
      statsUpdate.roomsJoined || 0,
      statsUpdate.messagesSent || 0,
      statsUpdate.totalTime || 0,
      favoriteRoomsJson
    ]);

    return { success: true };
  } catch (error) {
    console.error('PostgreSQL user stats update error:', error);
    return null;
  }
}

/**
 * Connection pool'u kapat
 */
export async function closePostgresConnection() {
  if (pool) {
    await pool.end();
    console.log('PostgreSQL connection pool kapatıldı');
  }
}

