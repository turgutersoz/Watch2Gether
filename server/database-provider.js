/**
 * Database Provider Abstraction Layer
 * 
 * Bu dosya farklı veritabanı sağlayıcıları (Supabase, MySQL, PostgreSQL) arasında
 * ortak bir arayüz sağlar.
 */

import * as supabaseClient from './supabase-client.js';
import * as mysqlClient from './mysql-client.js';
import * as postgresClient from './postgres-client.js';

// Database provider tipi (environment variable'dan al)
const DB_PROVIDER = (process.env.DB_PROVIDER || 'supabase').toLowerCase();

/**
 * Database bağlantısını test et
 */
export async function testConnection() {
  if (DB_PROVIDER === 'mysql') {
    return await mysqlClient.testMySQLConnection();
  } else if (DB_PROVIDER === 'postgres' || DB_PROVIDER === 'postgresql') {
    return await postgresClient.testPostgresConnection();
  } else {
    return await supabaseClient.testSupabaseConnection();
  }
}

/**
 * Room verilerini kaydet
 */
export async function saveRoom(roomData) {
  if (DB_PROVIDER === 'mysql') {
    return await mysqlClient.saveRoomToMySQL(roomData);
  } else if (DB_PROVIDER === 'postgres' || DB_PROVIDER === 'postgresql') {
    return await postgresClient.saveRoomToPostgres(roomData);
  } else {
    return await supabaseClient.saveRoomToSupabase(roomData);
  }
}

/**
 * Room verilerini al
 */
export async function getRoom(roomId) {
  if (DB_PROVIDER === 'mysql') {
    return await mysqlClient.getRoomFromMySQL(roomId);
  } else if (DB_PROVIDER === 'postgres' || DB_PROVIDER === 'postgresql') {
    return await postgresClient.getRoomFromPostgres(roomId);
  } else {
    return await supabaseClient.getRoomFromSupabase(roomId);
  }
}

/**
 * Chat mesajını kaydet
 */
export async function saveChatMessage(messageData) {
  if (DB_PROVIDER === 'mysql') {
    return await mysqlClient.saveChatMessageToMySQL(messageData);
  } else if (DB_PROVIDER === 'postgres' || DB_PROVIDER === 'postgresql') {
    return await postgresClient.saveChatMessageToPostgres(messageData);
  } else {
    return await supabaseClient.saveChatMessageToSupabase(messageData);
  }
}

/**
 * Kullanıcı istatistiklerini güncelle
 */
export async function updateUserStats(username, statsUpdate) {
  if (DB_PROVIDER === 'mysql') {
    return await mysqlClient.updateUserStatsMySQL(username, statsUpdate);
  } else if (DB_PROVIDER === 'postgres' || DB_PROVIDER === 'postgresql') {
    return await postgresClient.updateUserStatsPostgres(username, statsUpdate);
  } else {
    return await supabaseClient.updateUserStats(username, statsUpdate);
  }
}

/**
 * Database bağlantısını kapat
 */
export async function closeConnection() {
  if (DB_PROVIDER === 'mysql') {
    return await mysqlClient.closeMySQLConnection();
  } else if (DB_PROVIDER === 'postgres' || DB_PROVIDER === 'postgresql') {
    return await postgresClient.closePostgresConnection();
  }
  // Supabase için özel bir close işlemi yok
}

/**
 * Aktif database provider'ı döndür
 */
export function getProvider() {
  return DB_PROVIDER;
}

