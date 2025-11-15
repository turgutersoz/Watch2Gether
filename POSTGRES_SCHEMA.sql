-- PostgreSQL Schema for Watch Together
-- Bu dosya PostgreSQL veritabanı şemasını oluşturur

-- Veritabanı oluştur (eğer yoksa)
-- CREATE DATABASE watch_together;
-- \c watch_together;

-- UUID extension (PostgreSQL 13+ için gerekli değil, ama eski versiyonlar için)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rooms tablosu
CREATE TABLE IF NOT EXISTS rooms (
  id VARCHAR(8) PRIMARY KEY,
  host_id VARCHAR(255) NOT NULL,
  password VARCHAR(255) DEFAULT NULL,
  name VARCHAR(255) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  max_users INTEGER DEFAULT 0,
  category VARCHAR(100) DEFAULT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN DEFAULT FALSE,
  video_url TEXT DEFAULT NULL,
  is_playing BOOLEAN DEFAULT FALSE,
  current_time NUMERIC(10, 2) DEFAULT 0,
  volume NUMERIC(3, 2) DEFAULT 1.0,
  current_playlist_index INTEGER DEFAULT -1,
  stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users tablosu
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE DEFAULT NULL,
  avatar TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Playlist items tablosu
CREATE TABLE IF NOT EXISTS playlist_items (
  id VARCHAR(255) PRIMARY KEY,
  room_id VARCHAR(8) NOT NULL,
  video_url TEXT NOT NULL,
  title VARCHAR(255) DEFAULT NULL,
  thumbnail TEXT DEFAULT NULL,
  duration NUMERIC(10, 2) DEFAULT NULL,
  added_by VARCHAR(255) DEFAULT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Chat messages tablosu
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(8) NOT NULL,
  user_id VARCHAR(255) DEFAULT NULL,
  username VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  avatar TEXT DEFAULT NULL,
  color VARCHAR(7) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- User stats tablosu
CREATE TABLE IF NOT EXISTS user_stats (
  username VARCHAR(100) PRIMARY KEY,
  rooms_joined INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  total_time INTEGER DEFAULT 0,
  favorite_rooms JSONB DEFAULT '[]'::jsonb,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User history tablosu
CREATE TABLE IF NOT EXISTS user_history (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  room_id VARCHAR(8) NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP DEFAULT NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Index'ler (performans için)
CREATE INDEX IF NOT EXISTS idx_rooms_host_id ON rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_rooms_is_public ON rooms(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_rooms_created_at ON rooms(created_at);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_playlist_items_room_id ON playlist_items(room_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_position ON playlist_items(position);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_user_stats_last_seen ON user_stats(last_seen);
CREATE INDEX IF NOT EXISTS idx_user_history_username ON user_history(username);
CREATE INDEX IF NOT EXISTS idx_user_history_room_id ON user_history(room_id);
CREATE INDEX IF NOT EXISTS idx_user_history_joined_at ON user_history(joined_at);

-- Trigger: updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Örnek veri (opsiyonel)
-- INSERT INTO rooms (id, host_id, name, description, is_public) VALUES
-- ('TEST1234', 'test-host-id', 'Test Room', 'Bu bir test odasıdır', TRUE);

