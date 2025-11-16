# Environment Variables

Bu dosya projede kullanılan tüm environment variables'ları listeler.

## 📍 PostgreSQL Database Bilgileri Nerede Kayıtlı?

PostgreSQL database bilgileri deployment yöntemine göre farklı yerlerde saklanır:

### 🖥️ Development (Local)

**Konum:** `server/.env` dosyası (root dizinde değil, `server/` klasöründe)

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=watchtogether
POSTGRES_PASSWORD=watchtogether123
POSTGRES_DATABASE=watch_together
POSTGRES_SSL=false
```

**Not:** Bu dosya `.gitignore`'da olmalı, Git'e commit edilmemeli!

### 🐳 Docker Compose (Local/Production)

**Konum:** Root dizinde `.env` dosyası (proje root'unda, `docker-compose.yml` ile aynı seviyede)

```env
POSTGRES_USER=watchtogether
POSTGRES_PASSWORD=your-secure-password-here
POSTGRES_DATABASE=watch_together
```

**Not:** 
- `POSTGRES_HOST` otomatik olarak `postgres-db` olarak ayarlanır (Docker Compose servis adı)
- Bu dosya `.gitignore`'da olmalı

### ☁️ Coolify (Production - Önerilen)

**Konum:** Coolify Dashboard > Projeniz > Environment Variables sekmesi

1. Coolify Dashboard'a gidin
2. Projenize tıklayın
3. **"Environment Variables"** sekmesine gidin
4. Aşağıdaki değişkenleri ekleyin:

```env
POSTGRES_HOST=postgres-db
POSTGRES_PORT=5432
POSTGRES_USER=watchtogether
POSTGRES_PASSWORD=your-secure-password-here
POSTGRES_DATABASE=watch_together
POSTGRES_SSL=false
```

**Önemli:**
- ✅ Coolify'da environment variables **Dashboard'da** saklanır (dosya değil)
- ✅ `POSTGRES_PASSWORD` için **"Secret"** checkbox'ını işaretleyin
- ✅ Database bilgileri Coolify'ın PostgreSQL servisinden alınabilir (Connection String)

### 🚂 Railway/Render/Fly.io (Production)

**Konum:** Platform Dashboard > Project Settings > Environment Variables

Her platformun kendi environment variables yönetim panelinde saklanır.

---

## 🔍 Database Bilgilerini Nereden Bulabilirim?

### Coolify'da

**Yöntem 1: PostgreSQL Servisinden**

1. Coolify Dashboard'da PostgreSQL database servisinize gidin
2. **"Connection String"** veya **"Environment Variables"** bölümüne bakın
3. Bilgileri kopyalayın ve Docker Compose projenize ekleyin

**Yöntem 2: Environment Variables'dan**

1. Docker Compose projenize gidin
2. **"Environment Variables"** sekmesine bakın
3. `POSTGRES_*` ile başlayan değişkenleri kontrol edin

### Docker Compose'da

**Yöntem 1: .env Dosyası**

```bash
# Root dizinde
cat .env | grep POSTGRES
```

**Yöntem 2: Docker Compose'dan**

```bash
# Container içindeki environment variables'ları görüntüle
docker exec watch-together-server env | grep POSTGRES
```

### Development'da

```bash
# server/.env dosyasını kontrol et
cat server/.env
```

## 📋 Client Environment Variables

### Development (.env.local)

`client/.env.local` dosyası oluşturun:

```env
# Supabase Configuration (Opsiyonel - Fallback mod mevcut)
# Not: Supabase yoksa uygulama localStorage ile çalışır
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Socket.io Server URL
VITE_SOCKET_IO_URL=http://localhost:3001
# ⚠️ ÖNEMLİ: Server'ın adresini yazın (Socket.io server'ına bağlanır), client'ın adresini değil!
```

**Not:** 
- `VITE_` prefix'i zorunludur (Vite için)
- Supabase variables yoksa, uygulama localStorage fallback modunda çalışır
- Socket.io URL yoksa, varsayılan olarak `http://localhost:3001` kullanılır

### Production (Vercel)

Vercel Dashboard > Settings > Environment Variables bölümüne ekleyin:

```env
# Supabase Configuration (Opsiyonel)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Socket.io Server URL (Railway veya başka bir platform)
VITE_SOCKET_IO_URL=https://your-socketio-server.railway.app
```

### Production (Docker/Coolify)

Docker Compose veya Coolify environment variables bölümüne ekleyin:

```env
# Socket.io Server URL (Coolify internal network için)
VITE_SOCKET_IO_URL=http://server:3001
# veya production domain için:
# VITE_SOCKET_IO_URL=https://api.yourdomain.com

# Not: Supabase kullanılmıyorsa bu değişkenleri eklemeyin
```

## 📋 Server Environment Variables

### Development

`server/.env` dosyası oluşturun (opsiyonel):

```env
# Database Provider (supabase, mysql, postgres veya postgresql)
DB_PROVIDER=supabase

# Supabase Configuration (DB_PROVIDER=supabase olduğunda)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# PostgreSQL Configuration (DB_PROVIDER=postgres olduğunda)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=watchtogether
POSTGRES_PASSWORD=watchtogether123
POSTGRES_DATABASE=watch_together
POSTGRES_SSL=false

# MySQL Configuration (DB_PROVIDER=mysql olduğunda)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=watchtogether
MYSQL_PASSWORD=watchtogether123
MYSQL_DATABASE=watch_together

# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost,https://localhost,http://localhost:5173
```

**Not:** `CORS_ORIGINS` değişkeninde boşluklar otomatik olarak temizlenir. Şu formatlar çalışır:
- `http://localhost,http://localhost:5173` (boşluksuz)
- `http://localhost, http://localhost:5173` (boşluklu)

### Production (Railway/Render/Fly.io)

Deployment platformunuzun environment variables bölümüne ekleyin:

```env
# Database Provider (supabase, mysql, postgres veya postgresql)
DB_PROVIDER=postgres

# Supabase Configuration (DB_PROVIDER=supabase olduğunda)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# PostgreSQL Configuration (DB_PROVIDER=postgres olduğunda)
POSTGRES_HOST=postgres-db
POSTGRES_PORT=5432
POSTGRES_USER=watchtogether
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DATABASE=watch_together
POSTGRES_SSL=false

# MySQL Configuration (DB_PROVIDER=mysql olduğunda)
MYSQL_HOST=mysql-db
MYSQL_PORT=3306
MYSQL_USER=watchtogether
MYSQL_PASSWORD=your-mysql-password
MYSQL_DATABASE=watch_together

# Server Configuration
PORT=3001
NODE_ENV=production
CORS_ORIGINS=https://yourdomain.com,https://api.yourdomain.com

# Admin Users (virgülle ayrılmış liste, büyük/küçük harf duyarsız)
ADMIN_USERS=admin,ADMIN,superadmin
# Örnek: ADMIN_USERS=admin,ADMIN,superadmin
# Not: Bu kullanıcı adları otomatik olarak 'admin' rolü alır
```

### Production (Docker Compose)

`.env` dosyası oluşturun (root dizinde):

```env
# Database Provider
DB_PROVIDER=postgres

# PostgreSQL Configuration
POSTGRES_USER=watchtogether
POSTGRES_PASSWORD=your-secure-password-here
POSTGRES_DATABASE=watch_together

# Server Configuration
PORT=3001
NODE_ENV=production
CORS_ORIGINS=https://yourdomain.com,https://api.yourdomain.com

# Client Environment
VITE_SOCKET_IO_URL=https://api.yourdomain.com
# ⚠️ ÖNEMLİ: Server'ın adresini yazın (Socket.io server'ına bağlanır), client'ın adresini değil!
# Örnek: Client: https://app.yourdomain.com → Server: https://api.yourdomain.com
# Bu değişkene server adresini yazın: https://api.yourdomain.com
```

**Not:** Docker Compose içinde `POSTGRES_HOST` otomatik olarak `postgres-db` servis adına ayarlanır.

### Production (Coolify - Önerilen)

Coolify Dashboard > Environment Variables bölümüne ekleyin:

```env
# Database Provider (Sadece PostgreSQL kullanılıyor)
DB_PROVIDER=postgres

# PostgreSQL Configuration
# Yöntem 1: Connection String (Önerilen - Tek satır)
POSTGRES_URL=postgres://watchtogether:your-secure-password-here@postgres-db:5432/watch_together
# veya
DATABASE_URL=postgres://watchtogether:your-secure-password-here@postgres-db:5432/watch_together

# Yöntem 2: Ayrı Değişkenler (Alternatif)
# Not: POSTGRES_URL veya DATABASE_URL varsa bu değişkenler kullanılmaz
POSTGRES_HOST=postgres-db
POSTGRES_PORT=5432
POSTGRES_USER=watchtogether
POSTGRES_PASSWORD=your-secure-password-here
POSTGRES_DATABASE=watch_together
POSTGRES_SSL=false

# CORS Origins (Coolify domain'lerinizi ekleyin)
# Not: Boşluklar otomatik olarak temizlenir
CORS_ORIGINS=https://yourdomain.com,https://api.yourdomain.com
# veya boşluklu format:
# CORS_ORIGINS=https://yourdomain.com, https://api.yourdomain.com

# Client Environment (Coolify domain'lerinizi kullanın)
VITE_SOCKET_IO_URL=https://api.yourdomain.com

# Server Configuration
NODE_ENV=production
PORT=3001
```

**Önemli Notlar:**
- ✅ **Coolify deployment sadece PostgreSQL kullanır** - Supabase veya MySQL kullanılmaz
- ✅ `POSTGRES_HOST` Coolify'da `postgres-db` olmalı (internal network için)
- ✅ `CORS_ORIGINS` boşluklu format da çalışır (otomatik trim edilir)
- ✅ Supabase environment variables'larına gerek yok

## 🔑 Supabase Keys Nasıl Alınır? (Opsiyonel)

Eğer Supabase kullanmak isterseniz:

1. https://supabase.com adresine gidin
2. Projenizi seçin
3. **Settings > API** bölümüne gidin
4. Şu bilgileri kopyalayın:
   - **Project URL** → `VITE_SUPABASE_URL` / `SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY` (client için)
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server için - GİZLİ!)

**Not:** Supabase kullanmak zorunlu değildir. Uygulama Supabase olmadan da çalışabilir (localStorage fallback).

## ⚠️ Güvenlik Uyarıları

1. **Service Role Key ASLA client-side'da kullanılmamalı!**
   - Sadece server-side'da kullanın
   - Bu key tüm RLS politikalarını bypass eder
   - Coolify'da Secret olarak işaretleyin

2. **Anon Key güvenli mi?**
   - Evet, client-side'da kullanılabilir
   - RLS politikaları ile korunur
   - Sadece izin verilen işlemleri yapabilir

3. **Environment Variables'ı Git'e eklemeyin!**
   - `.env.local` dosyasını `.gitignore`'a ekleyin
   - Production'da platform'un environment variables özelliğini kullanın

4. **CORS_ORIGINS Güvenliği**
   - Production'da sadece kendi domain'lerinizi ekleyin
   - `*` kullanmayın (güvenlik riski)
   - Coolify'da domain'lerinizi doğru şekilde yapılandırın

## 📝 Örnek .gitignore

```
# Environment variables
.env
.env.local
.env.*.local
server/.env
client/.env.local
```

## 🔍 Environment Variables Kontrolü

Uygulama başlatıldığında:
- Supabase variables yoksa → Console'da uyarı gösterilir, fallback mod aktif olur
- Socket.io URL yoksa → Varsayılan localhost kullanılır
- Database provider yoksa → In-memory storage kullanılır (development için)

## 🚀 Production Checklist

### Vercel + Railway Deployment
- [ ] Vercel'de client environment variables eklendi
- [ ] Railway/Render'da server environment variables eklendi
- [ ] Service Role Key sadece server'da
- [ ] Anon Key sadece client'da
- [ ] CORS ayarları production URL'lerine güncellendi

### Docker Compose Deployment
- [ ] `.env` dosyası oluşturuldu
- [ ] PostgreSQL credentials ayarlandı
- [ ] CORS_ORIGINS production domain'lerine güncellendi
- [ ] VITE_SOCKET_IO_URL production domain'ine güncellendi

### Coolify Deployment (Önerilen)
- [ ] PostgreSQL database servisi oluşturuldu
- [ ] Environment variables Coolify Dashboard'a eklendi
- [ ] `DB_PROVIDER=postgres` ayarlandı
- [ ] `POSTGRES_HOST=postgres-db` ayarlandı
- [ ] `CORS_ORIGINS` Coolify domain'lerine güncellendi
- [ ] `VITE_SOCKET_IO_URL` Coolify domain'ine güncellendi
- [ ] Supabase variables eklenmedi (kullanılmıyor)

## 📊 Database Provider Seçenekleri

| Provider | Kullanım | Avantajlar | Dezavantajlar |
|----------|----------|------------|---------------|
| **PostgreSQL** | Coolify, Docker | ✅ Self-hosted<br>✅ Tam kontrol<br>✅ Ücretsiz | ❌ Yönetim gerektirir |
| **Supabase** | Vercel, Railway | ✅ Yönetilen servis<br>✅ Auth entegrasyonu<br>✅ Otomatik scaling | ❌ Vendor lock-in<br>❌ Ücretli (büyük ölçekte) |
| **MySQL** | Alternatif | ✅ Yaygın kullanım<br>✅ İyi performans | ❌ PostgreSQL kadar özellikli değil |

**Öneri:** Coolify deployment için **PostgreSQL** kullanın.
