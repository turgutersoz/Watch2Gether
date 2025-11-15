-- MySQL Schema for Watch Together
-- Bu dosya MySQL veritabanı şemasını oluşturur

-- Veritabanı oluştur (eğer yoksa)
CREATE DATABASE IF NOT EXISTS watch_together CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE watch_together;

-- Rooms tablosu
CREATE TABLE IF NOT EXISTS rooms (
  id VARCHAR(8) PRIMARY KEY,
  host_id VARCHAR(255) NOT NULL,
  password VARCHAR(255) DEFAULT NULL,
  name VARCHAR(255) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  max_users INT DEFAULT 0,
  category VARCHAR(100) DEFAULT NULL,
  tags JSON DEFAULT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  video_url TEXT DEFAULT NULL,
  is_playing BOOLEAN DEFAULT FALSE,
  current_time DECIMAL(10, 2) DEFAULT 0,
  volume DECIMAL(3, 2) DEFAULT 1.0,
  current_playlist_index INT DEFAULT -1,
  stats JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_host_id (host_id),
  INDEX idx_is_public (is_public),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users tablosu (Supabase Auth ile uyumlu)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE DEFAULT NULL,
  avatar TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Playlist items tablosu
CREATE TABLE IF NOT EXISTS playlist_items (
  id VARCHAR(255) PRIMARY KEY,
  room_id VARCHAR(8) NOT NULL,
  video_url TEXT NOT NULL,
  title VARCHAR(255) DEFAULT NULL,
  thumbnail TEXT DEFAULT NULL,
  duration DECIMAL(10, 2) DEFAULT NULL,
  added_by VARCHAR(255) DEFAULT NULL,
  position INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  INDEX idx_room_id (room_id),
  INDEX idx_position (position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chat messages tablosu
CREATE TABLE IF NOT EXISTS chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(8) NOT NULL,
  user_id VARCHAR(255) DEFAULT NULL,
  username VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  avatar TEXT DEFAULT NULL,
  color VARCHAR(7) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  INDEX idx_room_id (room_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User stats tablosu
CREATE TABLE IF NOT EXISTS user_stats (
  username VARCHAR(100) PRIMARY KEY,
  rooms_joined INT DEFAULT 0,
  messages_sent INT DEFAULT 0,
  total_time INT DEFAULT 0,
  favorite_rooms JSON DEFAULT NULL,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_last_seen (last_seen)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User history tablosu
CREATE TABLE IF NOT EXISTS user_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  room_id VARCHAR(8) NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP DEFAULT NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  INDEX idx_username (username),
  INDEX idx_room_id (room_id),
  INDEX idx_joined_at (joined_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Triggers: updated_at otomatik güncelleme (MySQL 5.7+ için gerekli değil, ON UPDATE CURRENT_TIMESTAMP kullanıyoruz)

-- Örnek veri (opsiyonel)
-- INSERT INTO rooms (id, host_id, name, description, is_public) VALUES
-- ('TEST1234', 'test-host-id', 'Test Room', 'Bu bir test odasıdır', TRUE);

