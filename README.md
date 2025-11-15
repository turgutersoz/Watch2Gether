# Watch Together - Senkronize Video İzleme Platformu

Watch2Gether benzeri, gerçek zamanlı senkronize video izleme platformu. Arkadaşlarınızla birlikte YouTube, Twitch veya direkt video linklerini senkronize bir şekilde izleyebilirsiniz.

## 🚀 Özellikler

### Temel Özellikler
- ✅ **Gerçek Zamanlı Senkronizasyon**: Video oynatma, duraklatma, ileri/geri sarma ve ses kontrolü tüm kullanıcılar için anlık senkronize olur
- ✅ **Özel Odalar**: Rastgele ID ile oda oluşturun veya mevcut bir odaya katılın
- ✅ **Şifreli Odalar**: Odalarınızı şifre ile koruyun
- ✅ **Gerçek Zamanlı Chat**: Kullanıcı adları, avatarlar, renkler ve zaman damgaları ile anlık mesajlaşma
- ✅ **Emoji Picker**: Chat'te emoji kullanımı
- ✅ **Kullanıcı Listesi**: Odada kimlerin olduğunu canlı olarak görün
- ✅ **Çoklu Platform Desteği**: YouTube, Twitch ve direkt video linklerini destekler
- ✅ **Modern UI**: Glassmorphism efektleri ile premium, koyu/aydınlık tema arayüz
- ✅ **Responsive Tasarım**: Mobil ve masaüstü cihazlarda mükemmel çalışır

### Gelişmiş Özellikler
- ✅ **Kullanıcı Kimlik Doğrulama**: Supabase Auth ile güvenli giriş/kayıt sistemi
- ✅ **Kullanıcı Profilleri**: Avatar, renk, durum ve rol yönetimi
- ✅ **Oda Yönetimi**: Oda adı, açıklama, kategori, etiketler, maksimum kullanıcı sayısı
- ✅ **Playlist Yönetimi**: Video playlist'i oluşturma, ekleme, çıkarma, sıralama
- ✅ **Otomatik Playlist**: Video bitince otomatik olarak sonraki videoya geçiş
- ✅ **Ekran Paylaşımı**: WebRTC ile gerçek zamanlı ekran paylaşımı
- ✅ **Kalite Seçimi**: YouTube videoları için kalite seçimi
- ✅ **Özel Kontroller**: Play/pause, ileri/geri sarma, progress bar, zaman gösterimi
- ✅ **Host Kontrolleri**: Kullanıcı atma, susturma, host devretme, oda silme
- ✅ **Admin Paneli**: Sistem yönetimi, kullanıcı yönetimi, istatistikler
- ✅ **Kullanıcı Paneli**: Profil, istatistikler, geçmiş
- ✅ **Bildirimler**: Browser push notifications ve toast bildirimleri
- ✅ **Tema Sistemi**: Aydınlık, karanlık ve sistem teması
- ✅ **PWA Desteği**: Offline destek ve Service Worker
- ✅ **IndexedDB Cache**: Chat mesajları ve geçmiş için yerel cache

## 🛠️ Teknolojiler

### Frontend
- React 18 (TypeScript)
- Vite
- Tailwind CSS
- Framer Motion (Animasyonlar)
- React Player (Video oynatıcı)
- Socket.io Client
- Supabase JS (Auth & Database)
- React Hot Toast (Bildirimler)
- React Window (Virtual Scrolling)
- Emoji Mart (Emoji picker)

### Backend
- Node.js
- Express
- Socket.io
- Supabase (Database & Auth - Opsiyonel)
- PostgreSQL (Standalone - Opsiyonel)
- MySQL (Alternatif - Opsiyonel)
- UUID (Oda ID oluşturma)

## 📦 Kurulum

### Gereksinimler
- Node.js 18+ 
- npm veya yarn
- Supabase hesabı (opsiyonel - fallback mod mevcut)

### Adımlar

1. **Repository'yi klonlayın:**
```bash
git clone <repository-url>
cd ReactWatchTogether
```

2. **Root bağımlılıkları yükleyin:**
```bash
npm install
```

3. **Server bağımlılıklarını yükleyin:**
```bash
cd server
npm install
cd ..
```

4. **Client bağımlılıklarını yükleyin:**
```bash
cd client
npm install
cd ..
```

5. **Environment Variables (Opsiyonel - Supabase için):**

`client/.env.local` dosyası oluşturun:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SOCKET_IO_URL=http://localhost:3001
```

**Not:** Supabase yapılandırılmazsa, uygulama localStorage fallback modunda çalışır.

6. **Geliştirme modunda çalıştırın:**
```bash
npm run dev
```

Bu komut hem backend (port 3001) hem de frontend (port 5173) sunucularını başlatır.

## 🎮 Kullanım

### İlk Kullanım

1. Tarayıcınızda `http://localhost:5173` adresine gidin
2. (Opsiyonel) Giriş yapın veya kayıt olun
3. Kullanıcı adınızı girin (giriş yaptıysanız otomatik doldurulur)
4. Yeni bir oda oluşturun veya mevcut bir oda ID'si ile katılın
5. Video URL'sini girin (YouTube, Twitch veya direkt link)
6. Arkadaşlarınızla birlikte izlemeye başlayın!

### Oda Yönetimi

- **Oda Oluşturma**: Ana sayfada "Oda Oluştur" butonuna tıklayın
- **Odaya Katılma**: Oda ID'sini girin ve "Odaya Katıl" butonuna tıklayın
- **Şifreli Oda**: Oda oluştururken şifre ekleyebilirsiniz
- **Link Paylaşma**: Odaya katıldıktan sonra "Linki Kopyala" butonuna tıklayın

### Host Özellikleri

- **Oda Ayarları**: Oda adı, açıklama, kategori, etiketler, maksimum kullanıcı sayısı
- **Kullanıcı Yönetimi**: Kullanıcı atma, susturma, host devretme
- **Playlist Yönetimi**: Video ekleme, çıkarma, sıralama
- **Oda Silme**: Odayı tamamen silme

## 🎨 Tasarım Özellikleri

- **Glassmorphism**: Şeffaf, bulanık arka plan efektleri
- **Dark/Light Mode**: Göz dostu tema seçenekleri
- **Gradient Arka Planlar**: Modern ve çekici renk geçişleri
- **Smooth Animasyonlar**: Optimize edilmiş CSS animasyonları
- **Responsive Layout**: Tüm ekran boyutlarına uyumlu
- **Custom Controls**: Özel video kontrolleri ve progress bar

## 🔧 Yapılandırma

### Port Ayarları

- Backend: `server/index.js` dosyasında `PORT` değişkenini değiştirebilirsiniz (varsayılan: 3001)
- Frontend: `client/vite.config.ts` dosyasında `server.port` değerini değiştirebilirsiniz (varsayılan: 5173)

### Socket.io Ayarları

Backend ve frontend arasındaki Socket.io bağlantısı `server/index.js` ve `client/src/hooks/useSocket.ts` dosyalarında yapılandırılabilir.

### Supabase Yapılandırması

Detaylı kurulum için `SUPABASE_AUTH_SETUP.md` dosyasına bakın.

## 📝 Deployment

### 🚀 Uçtan Uca Kurulum

**Yeni başlayanlar için:** `COMPLETE_SETUP_GUIDE.md` dosyasını takip edin. Bu rehber sıfırdan production'a kadar tüm adımları içerir.

### 🐳 Docker Deployment

**Hızlı başlangıç için:** `DOCKER_SETUP.md` dosyasını takip edin. Docker ile tek komutla tüm servisleri çalıştırabilirsiniz.

```bash
# Production (Traefik ile)
docker compose up -d --build

# Development (hot reload)
docker compose -f docker-compose.dev.yml up --build

# Erişim:
# - Client: http://localhost veya https://localhost
# - Server API: http://api.localhost veya https://api.localhost
# - Traefik Dashboard: http://localhost:8080
```

### Detaylı Rehberler

- `COMPLETE_SETUP_GUIDE.md` - ⭐ **Uçtan uca kurulum rehberi (ÖNERİLEN)**
- `DOCKER_SETUP.md` - 🐳 **Docker entegrasyonu (ÖNERİLEN)**
- `DOCKER_PRODUCTION.md` - 🐳 **Docker production deployment (ÖNERİLEN)**
- `COOLIFY_DEPLOY.md` - 🚀 **Coolify deployment (ÖNERİLEN)**
- `TRAEFIK_SETUP.md` - 🔀 **Traefik v1 reverse proxy (ÖNERİLEN)**
- `MYSQL_SETUP.md` - 🗄️ **MySQL veritabanı kurulumu (ÖNERİLEN)**
- `DEPLOYMENT_SUMMARY.md` - Genel bakış
- `SUPABASE_AUTH_SETUP.md` - Supabase Auth kurulumu
- `SUPABASE_VERCEL_SETUP.md` - Vercel + Supabase entegrasyonu
- `RAILWAY_DEPLOY.md` - Socket.io server deployment
- `ENV_VARIABLES.md` - Environment variables

### Hızlı Deployment

#### 🐳 Docker ile (Önerilen)

1. **Supabase**: Proje oluştur ve schema'yı deploy et
2. **Docker**: Tüm servisleri tek komutla deploy et
   ```bash
   docker compose up -d --build
   ```
   **Detaylı Rehber:** `DOCKER_PRODUCTION.md`

#### 🚂 Railway ile (Alternatif)

1. **Supabase**: Proje oluştur ve schema'yı deploy et
2. **Railway**: Socket.io server'ı deploy et
3. **Vercel**: Frontend'i deploy et

## 🐛 Bilinen Sorunlar

- Otomatik oynatma bazı tarayıcılarda engellenebilir (kullanıcı etkileşimi gerekebilir)
- Çok yavaş internet bağlantılarında senkronizasyon gecikmesi olabilir
- Ekran paylaşımı bazı tarayıcılarda sınırlı desteklenebilir

## 🔒 Güvenlik

- Supabase Auth ile güvenli kimlik doğrulama
- Row Level Security (RLS) politikaları
- JWT token yönetimi
- CORS koruması
- Şifre hash'leme (Supabase tarafından)

## 📊 Performans

- Code splitting ve lazy loading
- Virtual scrolling (chat için)
- Memoization (React.memo, useMemo, useCallback)
- IndexedDB caching
- Service Worker (PWA)
- Bundle size optimizasyonu

## 📄 Lisans

MIT

## 👨‍💻 Geliştirici

Bu proje eğitim amaçlı geliştirilmiştir.

## 📚 Dokümantasyon

### ⭐ Başlangıç
- `COMPLETE_SETUP_GUIDE.md` - **Uçtan uca kurulum rehberi (ÖNERİLEN)**

### Detaylı Rehberler
- `SUPABASE_AUTH_SETUP.md` - Supabase Auth kurulum rehberi
- `SUPABASE_VERCEL_SETUP.md` - Vercel + Supabase entegrasyonu
- `DEPLOYMENT_SUMMARY.md` - Deployment özeti
- `RAILWAY_DEPLOY.md` - Railway deployment rehberi
- `ENV_VARIABLES.md` - Environment variables listesi
