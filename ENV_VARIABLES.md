# Environment Variables

Bu dosya projede kullanılan tüm environment variables'ları listeler.

## 📋 Client Environment Variables

### Development (.env.local)

`client/.env.local` dosyası oluşturun:

```env
# Supabase Configuration (Opsiyonel - Fallback mod mevcut)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Socket.io Server URL
VITE_SOCKET_IO_URL=http://localhost:3001
```

**Not:** 
- `VITE_` prefix'i zorunludur (Vite için)
- Supabase variables yoksa, uygulama localStorage fallback modunda çalışır
- Socket.io URL yoksa, varsayılan olarak `http://localhost:3001` kullanılır

### Production (Vercel)

Vercel Dashboard > Settings > Environment Variables bölümüne ekleyin:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Socket.io Server URL (Railway veya başka bir platform)
VITE_SOCKET_IO_URL=https://your-socketio-server.railway.app
```

## 📋 Server Environment Variables

### Development

`server/.env` dosyası oluşturun (opsiyonel):

```env
# Supabase Configuration (Opsiyonel)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Production (Railway/Render/Fly.io)

Deployment platformunuzun environment variables bölümüne ekleyin:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server Configuration
PORT=3001
NODE_ENV=production
```

## 🔑 Supabase Keys Nasıl Alınır?

1. https://supabase.com adresine gidin
2. Projenizi seçin
3. **Settings > API** bölümüne gidin
4. Şu bilgileri kopyalayın:
   - **Project URL** → `VITE_SUPABASE_URL` / `SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY` (client için)
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server için - GİZLİ!)

## ⚠️ Güvenlik Uyarıları

1. **Service Role Key ASLA client-side'da kullanılmamalı!**
   - Sadece server-side'da kullanın
   - Bu key tüm RLS politikalarını bypass eder

2. **Anon Key güvenli mi?**
   - Evet, client-side'da kullanılabilir
   - RLS politikaları ile korunur
   - Sadece izin verilen işlemleri yapabilir

3. **Environment Variables'ı Git'e eklemeyin!**
   - `.env.local` dosyasını `.gitignore`'a ekleyin
   - Production'da platform'un environment variables özelliğini kullanın

## 📝 Örnek .gitignore

```
# Environment variables
.env
.env.local
.env.*.local
```

## 🔍 Environment Variables Kontrolü

Uygulama başlatıldığında:
- Supabase variables yoksa → Console'da uyarı gösterilir, fallback mod aktif olur
- Socket.io URL yoksa → Varsayılan localhost kullanılır

## 🚀 Production Checklist

- [ ] Vercel'de client environment variables eklendi
- [ ] Railway/Render'da server environment variables eklendi
- [ ] Service Role Key sadece server'da
- [ ] Anon Key sadece client'da
- [ ] CORS ayarları production URL'lerine güncellendi
