# Vercel + Supabase Entegrasyon Rehberi

## 🎯 Genel Bakış

Vercel ve Supabase kombinasyonu **mükemmel çalışır** ve yaygın olarak kullanılır. Bu rehber, Watch Together projesini Vercel ve Supabase ile nasıl deploy edeceğinizi gösterir.

## ⚠️ Önemli Notlar

### 1. Socket.io ve Vercel
- **Vercel Serverless Functions** Socket.io'nun WebSocket bağlantılarını desteklemez
- **Çözüm**: Socket.io server'ı ayrı bir serviste çalıştırın (Railway, Render, Fly.io)

### 2. Supabase Real-time vs Socket.io
- **Supabase Real-time**: Veritabanı değişiklikleri için mükemmel
- **Socket.io**: Video senkronizasyonu için daha uygun (düşük latency, özel event'ler)

### 3. Auth Sistemi
- **Supabase Auth**: Güvenli, ölçeklenebilir auth sistemi
- **Fallback Mod**: Supabase yoksa localStorage kullanır (development için)

## 📋 Adım Adım Kurulum

### Adım 1: Supabase Projesi Oluştur

1. https://supabase.com adresine gidin
2. Yeni proje oluşturun
3. **Project Settings > API** bölümünden:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-side için)

### Adım 2: Supabase Schema Oluştur

Detaylı schema için `SUPABASE_AUTH_SETUP.md` dosyasına bakın. Temel tablolar:

- `users` - Kullanıcı profilleri (Auth ile entegre)
- `rooms` - Oda bilgileri
- `playlist_items` - Playlist videoları
- `chat_messages` - Chat mesajları
- `user_stats` - Kullanıcı istatistikleri
- `user_history` - Kullanıcı geçmişi

### Adım 3: Supabase Auth Yapılandırması

**Authentication > Settings** bölümünde:

1. **Site URL**: 
   - Development: `http://localhost:5173`
   - Production: `https://your-vercel-app.vercel.app`

2. **Redirect URLs**: 
   - `http://localhost:5173/**`
   - `https://your-vercel-app.vercel.app/**`

3. **Email Templates**: Özelleştirin

4. **Auth Providers**: Email/Password aktif

### Adım 4: Vercel Deployment

1. **Vercel.com'da hesap oluşturun**
2. **GitHub repo'yu bağlayın**
3. **Project Settings:**
   - Framework Preset: Vite
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Environment Variables ekleyin:**
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_SOCKET_IO_URL=https://your-socketio-server.railway.app
   ```

5. **Deploy edin**

### Adım 5: Vercel.json (Opsiyonel)

Proje root'unda `vercel.json` oluşturun:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/client/$1"
    }
  ]
}
```

## 🔧 Socket.io Server Deployment

Socket.io server'ı Vercel'de çalıştıramazsınız. Alternatifler:

### Seçenek 1: Railway (Önerilen)
- Ücretsiz tier ($5 kredi/ay)
- WebSocket desteği
- Otomatik deployment
- Detaylı rehber: `RAILWAY_DEPLOY.md`

### Seçenek 2: Render
- Ücretsiz tier
- WebSocket desteği
- Yavaş cold start

### Seçenek 3: Fly.io
- Ücretsiz tier
- Hızlı
- Biraz daha kompleks setup

## 📝 Migration Stratejisi

### Hibrit Yaklaşım (Önerilen)

**Kalıcı Veriler (Supabase):**
- Kullanıcı profilleri (Auth ile entegre)
- Oda bilgileri
- Chat mesajları
- İstatistikler
- Kullanıcı geçmişi

**Geçici Veriler (In-Memory + Socket.io):**
- Video senkronizasyonu (currentTime, isPlaying)
- Aktif kullanıcı listesi
- Real-time events
- WebRTC signaling

### Tam Migration (İleri Seviye)

Tüm veriler Supabase'de, Socket.io sadece real-time event broadcasting için.

## 🚀 Deployment Checklist

- [ ] Supabase projesi oluşturuldu
- [ ] Schema oluşturuldu ve RLS politikaları ayarlandı
- [ ] Auth ayarları yapılandırıldı
- [ ] Environment variables ayarlandı (Vercel)
- [ ] Socket.io server ayrı bir serviste deploy edildi
- [ ] Socket.io server environment variables eklendi
- [ ] Vercel'de frontend deploy edildi
- [ ] CORS ayarları yapıldı
- [ ] Test edildi

## ⚡ Performans İpuçları

1. **Supabase Connection Pooling**: Production'da connection pooling kullanın
2. **Indexing**: Sık sorgulanan kolonlara index ekleyin
3. **RLS**: Row Level Security ile güvenliği artırın
4. **Caching**: 
   - IndexedDB (client-side)
   - Service Worker (PWA)
5. **CDN**: Vercel otomatik CDN sağlar
6. **Code Splitting**: Vite otomatik code splitting yapar

## 🔒 Güvenlik

### Environment Variables

- ✅ Service Role Key sadece server-side
- ✅ Anon Key client-side (RLS ile korumalı)
- ✅ Environment variables Vercel'de güvenli

### RLS Politikaları

- Kullanıcılar sadece kendi profillerini güncelleyebilir
- Public odalar herkes tarafından görülebilir
- Chat mesajları oda üyeleri tarafından görülebilir

### CORS

```javascript
// server/index.js
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://your-vercel-app.vercel.app",
      "https://your-custom-domain.com"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});
```

## 📊 Maliyet

**Ücretsiz Tier:**
- Vercel: ✅ Ücretsiz (hobby plan)
- Supabase: ✅ Ücretsiz (500MB database, 2GB bandwidth, 50K MAU)
- Railway: ✅ $5 kredi/ay

**Toplam: ~$0-5/ay** (küçük-orta ölçek için)

## 🐛 Sorun Giderme

### Vercel Build Hatası

**Hata:** Build başarısız oluyor

**Çözüm:**
1. Root directory'nin `client` olduğundan emin olun
2. Build command'ın `npm run build` olduğundan emin olun
3. Output directory'nin `dist` olduğundan emin olun
4. Node.js version'ı kontrol edin (18+)

### Supabase Bağlantı Hatası

**Hata:** Supabase'e bağlanılamıyor

**Çözüm:**
1. Environment variables'ı kontrol edin
2. Anon Key'in doğru olduğundan emin olun
3. Supabase dashboard'da projenin aktif olduğunu kontrol edin
4. CORS ayarlarını kontrol edin

### Auth Çalışmıyor

**Hata:** Giriş yapılamıyor

**Çözüm:**
1. Supabase Auth ayarlarını kontrol edin
2. Redirect URLs'i kontrol edin
3. Email confirmation ayarlarını kontrol edin
4. Browser console'da hata olup olmadığını kontrol edin

### Socket.io Bağlanmıyor

**Hata:** Socket.io server'a bağlanılamıyor

**Çözüm:**
1. Railway URL'inin doğru olduğundan emin olun
2. CORS ayarlarını kontrol edin
3. Environment variable'ı kontrol edin
4. Railway loglarını kontrol edin

## 📚 Kaynaklar

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Socket.io Deployment](https://socket.io/docs/v4/deployment/)

## 🎯 Sonraki Adımlar

1. Supabase projesi oluştur
2. Schema'yı deploy et
3. Auth ayarlarını yapılandır
4. Railway'de Socket.io server'ı deploy et
5. Vercel'de client'ı deploy et
6. Test et ve optimize et
