-- Watch Together - Supabase Schema (Düzeltilmiş)
-- current_time reserved keyword olduğu için tırnak içine alındı

-- Kullanıcılar tablosu (Auth ile entegre)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  color TEXT,
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'away', 'busy')),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Odalar tablosu
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  host_id TEXT NOT NULL,
  password TEXT,
  name TEXT,
  description TEXT,
  max_users INTEGER DEFAULT 0,
  category TEXT,
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  video_url TEXT,
  is_playing BOOLEAN DEFAULT false,
  "current_time" NUMERIC DEFAULT 0,  -- Tırnak içine alındı (reserved keyword)
  volume NUMERIC DEFAULT 1.0,
  current_playlist_index INTEGER DEFAULT -1,
  stats JSONB DEFAULT '{"totalViews": 0, "totalMessages": 0, "totalVideos": 0}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Playlist tablosu
CREATE TABLE IF NOT EXISTS playlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  added_by TEXT,
  added_at TIMESTAMP DEFAULT NOW(),
  position INTEGER
);

-- Oda kullanıcıları (many-to-many)
CREATE TABLE IF NOT EXISTS room_users (
  room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  socket_id TEXT,
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

-- Chat mesajları
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  avatar TEXT,
  color TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Kullanıcı istatistikleri
CREATE TABLE IF NOT EXISTS user_stats (
  username TEXT PRIMARY KEY,
  rooms_joined INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  total_time INTEGER DEFAULT 0,
  favorite_rooms TEXT[],
  last_seen TIMESTAMP DEFAULT NOW()
);

-- Kullanıcı geçmişi
CREATE TABLE IF NOT EXISTS user_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL,
  room_id TEXT NOT NULL,
  joined_at TIMESTAMP NOT NULL,
  left_at TIMESTAMP
);

-- Index'ler (performans için)
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_rooms_public ON rooms(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_room_users_room ON room_users(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_history_username ON user_history(username, joined_at DESC);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Politikaları: Users
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view usernames"
  ON users FOR SELECT
  USING (true);

-- RLS Politikaları: Rooms
CREATE POLICY "Public rooms are viewable by everyone"
  ON rooms FOR SELECT
  USING (is_public = true);

-- RLS Politikaları: User Stats
CREATE POLICY "Users can view their own stats"
  ON user_stats FOR SELECT
  USING (auth.uid()::text = username);

-- Trigger: updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Yeni kullanıcı kaydında profil oluştur
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, email, color)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    '#' || LPAD(TO_HEX((random() * 16777215)::int), 6, '0')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

