/**
 * Supabase Client Setup for Server
 * 
 * Bu dosya server-side Supabase bağlantısı için kullanılır.
 * Service Role Key kullanarak RLS'yi bypass eder.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase environment variables eksik! In-memory storage kullanılacak.');
}

// Service Role Key ile client oluştur (RLS bypass)
export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

/**
 * Supabase bağlantısını test et
 */
export async function testSupabaseConnection() {
  if (!supabase) {
    return { connected: false, error: 'Supabase client oluşturulamadı' };
  }

  try {
    const { data, error } = await supabase.from('rooms').select('count').limit(1);
    if (error) throw error;
    return { connected: true };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

/**
 * Room verilerini Supabase'e kaydet
 */
export async function saveRoomToSupabase(roomData) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('rooms')
      .upsert({
        id: roomData.id,
        host_id: roomData.hostId,
        password: roomData.password || null,
        name: roomData.name || null,
        description: roomData.description || null,
        max_users: roomData.maxUsers || 0,
        category: roomData.category || null,
        tags: roomData.tags || [],
        is_public: roomData.isPublic || false,
        video_url: roomData.videoUrl || null,
        is_playing: roomData.isPlaying || false,
        "current_time": roomData.currentTime || 0,
        volume: roomData.volume || 1.0,
        current_playlist_index: roomData.currentPlaylistIndex || -1,
        stats: roomData.stats || {},
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Supabase room save error:', error);
    return null;
  }
}

/**
 * Supabase'den room verilerini al
 */
export async function getRoomFromSupabase(roomId) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Supabase room get error:', error);
    return null;
  }
}

/**
 * Chat mesajını Supabase'e kaydet
 */
export async function saveChatMessageToSupabase(messageData) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: messageData.roomId,
        user_id: messageData.userId,
        username: messageData.username,
        message: messageData.message,
        avatar: messageData.avatar || null,
        color: messageData.color || null
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Supabase chat message save error:', error);
    return null;
  }
}

/**
 * Kullanıcı istatistiklerini güncelle
 */
export async function updateUserStats(username, statsUpdate) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('user_stats')
      .upsert({
        username,
        ...statsUpdate,
        last_seen: new Date().toISOString()
      }, {
        onConflict: 'username'
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Supabase user stats update error:', error);
    return null;
  }
}

