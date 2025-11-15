# 🚀 Watch Together - Uçtan Uca Kurulum Rehberi

Bu rehber, Watch Together projesini sıfırdan production'a kadar kurmanız için gereken tüm adımları içerir.

## 📋 İçindekiler

1. [Gereksinimler](#gereksinimler)
2. [Local Development Kurulumu](#local-development-kurulumu)
3. [Supabase Kurulumu](#supabase-kurulumu)
4. [Socket.io Server Deployment](#socketio-server-deployment)
5. [Vercel Deployment](#vercel-deployment)
6. [Production Yapılandırması](#production-yapılandırması)
7. [Test ve Doğrulama](#test-ve-doğrulama)
8. [Sorun Giderme](#sorun-giderme)

---

## 📦 Gereksinimler

### Yazılım Gereksinimleri

- **Node.js** 18+ ([İndir](https://nodejs.org/))
- **npm** veya **yarn** (Node.js ile birlikte gelir)
- **Git** ([İndir](https://git-scm.com/))
- **Code Editor** (VS Code önerilir)

### Hesap Gereksinimleri

- **GitHub** hesabı (ücretsiz)
- **Supabase** hesabı (ücretsiz tier)
- **Vercel** hesabı (ücretsiz tier)
- **Railway** hesabı (ücretsiz tier - $5 kredi/ay)

---

## 🏠 Local Development Kurulumu

### Adım 1: Projeyi İndirin

```bash
# Repository'yi klonlayın
git clone <repository-url>
cd ReactWatchTogether

# Veya mevcut projeyi kullanıyorsanız
cd ReactWatchTogether
```

### Adım 2: Bağımlılıkları Yükleyin

```bash
# Root bağımlılıkları
npm install

# Server bağımlılıkları
cd server
npm install
cd ..

# Client bağımlılıkları
cd client
npm install
cd ..
```

### Adım 3: Development Modunda Çalıştırın

```bash
# Hem server hem client'ı başlatır
npm run dev
```

**Beklenen Çıktı:**
- Server: `http://localhost:3001` üzerinde çalışır
- Client: `http://localhost:5173` üzerinde çalışır

### Adım 4: Test Edin

1. Tarayıcıda `http://localhost:5173` adresine gidin
2. Kullanıcı adı girin
3. Oda oluşturun veya mevcut bir odaya katılın
4. Video URL'si ekleyin ve test edin

**✅ Local development kurulumu tamamlandı!**

---

## 🗄️ Supabase Kurulumu

### Adım 1: Supabase Projesi Oluştur

1. https://supabase.com adresine gidin
2. "Start your project" butonuna tıklayın
3. GitHub hesabınızla giriş yapın
4. "New Project" butonuna tıklayın
5. Proje bilgilerini doldurun:
   - **Name**: Watch Together (veya istediğiniz isim)
   - **Database Password**: Güçlü bir şifre seçin (kaydedin!)
   - **Region**: Size en yakın bölgeyi seçin
6. "Create new project" butonuna tıklayın
7. Projenin oluşturulmasını bekleyin (1-2 dakika)

### Adım 2: API Keys'leri Alın

1. Supabase Dashboard'da projenizi açın
2. Sol menüden **Settings** > **API** seçin
3. Şu bilgileri kopyalayın:
   - **Project URL** → `SUPABASE_URL` olarak kullanılacak
   - **anon public** key → `VITE_SUPABASE_ANON_KEY` olarak kullanılacak
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` olarak kullanılacak (GİZLİ!)

### Adım 3: Database Schema Oluştur

1. Supabase Dashboard'da sol menüden **SQL Editor** seçin
2. "New query" butonuna tıklayın
3. Aşağıdaki SQL script'ini yapıştırın:

```sql
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
  current_time NUMERIC DEFAULT 0,
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
```

4. "Run" butonuna tıklayın
5. Başarılı mesajını bekleyin

### Adım 4: Auth Ayarlarını Yapılandır

1. Sol menüden **Authentication** > **Settings** seçin
2. **Site URL** bölümüne ekleyin:
   - Development: `http://localhost:5173`
   - Production: `https://your-vercel-app.vercel.app` (sonra ekleyeceğiz)
3. **Redirect URLs** bölümüne ekleyin:
   - `http://localhost:5173/**`
   - `https://your-vercel-app.vercel.app/**` (sonra ekleyeceğiz)
4. **Email Auth** bölümünde:
   - "Enable Email Signup" aktif
   - "Confirm email" - Development için kapalı, Production için açık
5. "Save" butonuna tıklayın

### Adım 5: Local Environment Variables

`client/.env.local` dosyası oluşturun:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SOCKET_IO_URL=http://localhost:3001
```

**Not:** `your-project-id` ve `your-anon-key-here` yerine gerçek değerleri yazın.

**✅ Supabase kurulumu tamamlandı!**

---

## 🚂 Socket.io Server Deployment (Railway)

### Adım 1: Railway Hesabı Oluştur

1. https://railway.app adresine gidin
2. "Start a New Project" butonuna tıklayın
3. GitHub hesabınızla giriş yapın
4. Railway'in repository erişim iznini onaylayın

### Adım 2: Projeyi Deploy Et

1. Railway Dashboard'da "New Project" butonuna tıklayın
2. "Deploy from GitHub repo" seçin
3. Repository'nizi seçin
4. Railway otomatik olarak projeyi algılar
5. **Settings** > **Root Directory** bölümüne gidin
6. Root directory'yi `server` olarak ayarlayın
7. "Save" butonuna tıklayın

### Adım 3: Environment Variables Ekle

1. Railway Dashboard'da projenizi açın
2. **Variables** sekmesine gidin
3. Aşağıdaki environment variables'ı ekleyin:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
PORT=3001
NODE_ENV=production
```

**Önemli:** `SUPABASE_SERVICE_ROLE_KEY` değerini Supabase Dashboard'dan alın (Settings > API > service_role key)

### Adım 4: Public Domain Oluştur

1. Railway Dashboard'da **Settings** > **Networking** seçin
2. "Generate Domain" butonuna tıklayın
3. Oluşan URL'yi kopyalayın (örn: `your-app.railway.app`)
4. Bu URL'yi not edin (Vercel deployment'ta kullanacağız)

### Adım 5: CORS Ayarlarını Güncelle

`server/index.js` dosyasında CORS ayarlarını güncelleyin:

```javascript
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://your-vercel-app.vercel.app", // Vercel URL'inizi buraya ekleyin
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});
```

**Not:** Vercel URL'ini henüz bilmiyorsanız, deployment sonrası güncelleyebilirsiniz.

### Adım 6: Deploy ve Test

1. Railway otomatik olarak deploy eder
2. **Deployments** sekmesinden logları kontrol edin
3. Hata yoksa, deployment başarılıdır
4. Socket.io server URL'ini test edin: `https://your-app.railway.app`

**✅ Socket.io server deployment tamamlandı!**

---

## ☁️ Vercel Deployment

### Adım 1: Vercel Hesabı Oluştur

1. https://vercel.com adresine gidin
2. "Sign Up" butonuna tıklayın
3. GitHub hesabınızla giriş yapın
4. Vercel'in repository erişim iznini onaylayın

### Adım 2: Projeyi Import Et

1. Vercel Dashboard'da "Add New..." > "Project" seçin
2. Repository'nizi seçin
3. **Configure Project** sayfasında:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Adım 3: Environment Variables Ekle

1. **Environment Variables** bölümüne gidin
2. Aşağıdaki variables'ı ekleyin:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SOCKET_IO_URL=https://your-app.railway.app
```

**Önemli:** 
- `VITE_SOCKET_IO_URL` değerini Railway'den aldığınız URL ile değiştirin
- Her variable için "Production", "Preview", "Development" seçeneklerini işaretleyin

### Adım 4: Deploy Et

1. "Deploy" butonuna tıklayın
2. Build işleminin tamamlanmasını bekleyin (1-2 dakika)
3. Deployment başarılı olduğunda, Vercel size bir URL verir (örn: `your-app.vercel.app`)

### Adım 5: Custom Domain (Opsiyonel)

1. Vercel Dashboard'da projenizi açın
2. **Settings** > **Domains** seçin
3. Domain'inizi ekleyin
4. DNS kayıtlarını yapılandırın

**✅ Vercel deployment tamamlandı!**

---

## 🔧 Production Yapılandırması

### Adım 1: Supabase Auth Ayarlarını Güncelle

1. Supabase Dashboard'da **Authentication** > **Settings** seçin
2. **Site URL** bölümüne Vercel URL'inizi ekleyin:
   - `https://your-app.vercel.app`
3. **Redirect URLs** bölümüne ekleyin:
   - `https://your-app.vercel.app/**`
   - Custom domain kullanıyorsanız: `https://your-domain.com/**`
4. **Email Confirmation** ayarını açın (production için)
5. "Save" butonuna tıklayın

### Adım 2: Railway CORS Ayarlarını Güncelle

1. `server/index.js` dosyasını düzenleyin
2. CORS origin listesine Vercel URL'inizi ekleyin:

```javascript
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://your-app.vercel.app", // Vercel URL'iniz
      "https://your-custom-domain.com" // Custom domain (varsa)
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});
```

3. Değişiklikleri commit edin ve push edin
4. Railway otomatik olarak yeniden deploy eder

### Adım 3: Vercel Environment Variables Kontrolü

1. Vercel Dashboard'da projenizi açın
2. **Settings** > **Environment Variables** seçin
3. Tüm variables'ın doğru olduğundan emin olun
4. Production, Preview, Development için ayrı ayrı kontrol edin

### Adım 4: Railway Environment Variables Kontrolü

1. Railway Dashboard'da projenizi açın
2. **Variables** sekmesine gidin
3. Tüm variables'ın doğru olduğundan emin olun

**✅ Production yapılandırması tamamlandı!**

---

## ✅ Test ve Doğrulama

### Adım 1: Production URL'lerini Test Et

1. **Vercel URL'inizi açın**: `https://your-app.vercel.app`
2. Sayfanın yüklendiğini kontrol edin
3. Console'da hata olup olmadığını kontrol edin

### Adım 2: Auth Sistemi Test Et

1. "Giriş Yap / Kayıt Ol" butonuna tıklayın
2. Yeni bir hesap oluşturun
3. Email doğrulama linkini kontrol edin (eğer açıksa)
4. Giriş yapın
5. Profil bilgilerinin yüklendiğini kontrol edin

### Adım 3: Socket.io Bağlantısı Test Et

1. Bir oda oluşturun
2. Başka bir tarayıcı/sekmede aynı odaya katılın
3. Video ekleyin ve senkronizasyonu test edin
4. Chat mesajı gönderin
5. Her şeyin çalıştığını doğrulayın

### Adım 4: Tüm Özellikleri Test Et

- [ ] Oda oluşturma
- [ ] Odaya katılma
- [ ] Video ekleme ve oynatma
- [ ] Video senkronizasyonu
- [ ] Chat mesajlaşma
- [ ] Kullanıcı listesi
- [ ] Host kontrolleri
- [ ] Playlist yönetimi
- [ ] Ekran paylaşımı
- [ ] Oda ayarları

**✅ Test ve doğrulama tamamlandı!**

---

## 🐛 Sorun Giderme

### Problem 1: Supabase Bağlanmıyor

**Belirtiler:**
- Console'da "Supabase yapılandırılmamış" uyarısı
- Auth çalışmıyor

**Çözüm:**
1. `client/.env.local` dosyasının doğru olduğundan emin olun
2. Environment variables'ın `VITE_` ile başladığından emin olun
3. Vite dev server'ı yeniden başlatın
4. Supabase Dashboard'da projenin aktif olduğunu kontrol edin

### Problem 2: Socket.io Bağlanmıyor

**Belirtiler:**
- "Bağlantı kesildi" göstergesi
- Chat ve video senkronizasyonu çalışmıyor

**Çözüm:**
1. Railway URL'inin doğru olduğundan emin olun
2. CORS ayarlarını kontrol edin
3. Railway loglarını kontrol edin
4. Environment variable'ı kontrol edin (`VITE_SOCKET_IO_URL`)

### Problem 3: Vercel Build Hatası

**Belirtiler:**
- Deployment başarısız
- Build loglarında hata

**Çözüm:**
1. Root directory'nin `client` olduğundan emin olun
2. Build command'ın `npm run build` olduğundan emin olun
3. Output directory'nin `dist` olduğundan emin olun
4. Node.js version'ı kontrol edin (18+)
5. Environment variables'ı kontrol edin

### Problem 4: Auth Çalışmıyor

**Belirtiler:**
- Giriş yapılamıyor
- Kayıt olunamıyor

**Çözüm:**
1. Supabase Auth ayarlarını kontrol edin
2. Redirect URLs'i kontrol edin
3. Email confirmation ayarlarını kontrol edin
4. Browser console'da hata olup olmadığını kontrol edin
5. Supabase Dashboard'da kullanıcının oluşturulduğunu kontrol edin

### Problem 5: Database Hataları

**Belirtiler:**
- "Table doesn't exist" hatası
- RLS policy hatası

**Çözüm:**
1. Supabase SQL Editor'de schema'yı çalıştırdığınızdan emin olun
2. RLS politikalarının doğru ayarlandığından emin olun
3. Trigger'ların oluşturulduğundan emin olun
4. Supabase Dashboard'da tabloları kontrol edin

---

## 📊 Deployment Checklist

### Pre-Deployment

- [ ] Local development çalışıyor
- [ ] Tüm testler geçiyor
- [ ] Environment variables hazır
- [ ] Supabase projesi oluşturuldu
- [ ] Database schema deploy edildi

### Supabase

- [ ] Proje oluşturuldu
- [ ] API keys alındı
- [ ] Schema deploy edildi
- [ ] RLS politikaları ayarlandı
- [ ] Auth ayarları yapılandırıldı
- [ ] Trigger'lar oluşturuldu

### Railway

- [ ] Hesap oluşturuldu
- [ ] Proje deploy edildi
- [ ] Environment variables eklendi
- [ ] Public domain oluşturuldu
- [ ] CORS ayarları yapıldı
- [ ] Loglar kontrol edildi

### Vercel

- [ ] Hesap oluşturuldu
- [ ] Proje import edildi
- [ ] Environment variables eklendi
- [ ] Build başarılı
- [ ] URL çalışıyor

### Post-Deployment

- [ ] Supabase Auth ayarları güncellendi
- [ ] Railway CORS ayarları güncellendi
- [ ] Tüm özellikler test edildi
- [ ] Production URL'leri doğrulandı

---

## 🎯 Sonraki Adımlar

### İyileştirmeler

1. **Custom Domain**: Vercel'de custom domain ekleyin
2. **SSL Certificate**: Otomatik olarak Vercel tarafından sağlanır
3. **Monitoring**: Railway ve Vercel metrics'lerini izleyin
4. **Backup**: Supabase otomatik backup sağlar
5. **Analytics**: Google Analytics veya başka bir servis ekleyin

### Ölçeklendirme

1. **Database**: Supabase plan'ınızı yükseltin
2. **Server**: Railway plan'ınızı yükseltin
3. **CDN**: Vercel otomatik CDN sağlar
4. **Caching**: Redis cache ekleyin (ileri seviye)

---

## 📚 Ek Kaynaklar

- [README.md](./README.md) - Proje genel bakışı
- [SUPABASE_AUTH_SETUP.md](./SUPABASE_AUTH_SETUP.md) - Detaylı Supabase Auth rehberi
- [SUPABASE_VERCEL_SETUP.md](./SUPABASE_VERCEL_SETUP.md) - Vercel + Supabase entegrasyonu
- [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) - Railway deployment detayları
- [ENV_VARIABLES.md](./ENV_VARIABLES.md) - Environment variables listesi
- [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) - Deployment özeti

---

## 💡 İpuçları

1. **Development**: Local'de çalışırken Supabase kullanmak zorunda değilsiniz (fallback mod)
2. **Testing**: Her deployment'tan sonra tüm özellikleri test edin
3. **Monitoring**: Railway ve Vercel loglarını düzenli kontrol edin
4. **Backup**: Önemli verileri yedekleyin
5. **Security**: Service Role Key'i asla client-side'da kullanmayın

---

## 🎉 Tebrikler!

Artık Watch Together projeniz production'da çalışıyor! 

Sorularınız için:
- GitHub Issues
- Supabase Discord
- Vercel Community
- Railway Discord

**İyi eğlenceler! 🚀**

