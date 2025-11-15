# 🐳 Docker Entegrasyonu - Watch Together

Bu rehber, Watch Together projesini Docker ile çalıştırmanız için gereken tüm adımları içerir.

## 📋 İçindekiler

1. [Gereksinimler](#gereksinimler)
2. [Docker Kurulumu](#docker-kurulumu)
3. [Production Deployment](#production-deployment)
4. [Development Mode](#development-mode)
5. [Supabase Entegrasyonu](#supabase-entegrasyonu)
6. [Docker Compose Kullanımı](#docker-compose-kullanımı)
7. [Sorun Giderme](#sorun-giderme)

---

## 📦 Gereksinimler

- **Docker** 20.10+ ([İndir](https://www.docker.com/get-started))
- **Docker Compose** 2.0+ (Docker Desktop ile birlikte gelir)
- **Git** (opsiyonel)

---

## 🐳 Docker Kurulumu

### Windows/Mac

1. [Docker Desktop](https://www.docker.com/products/docker-desktop) indirin ve kurun
2. Docker Desktop'ı başlatın
3. Terminal'de kontrol edin:
   ```bash
   docker --version
   docker compose version
   ```

### Linux

```bash
# Docker kurulumu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose kurulumu
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Kontrol
docker --version
docker compose version
```

---

## 🚀 Production Deployment

### Adım 1: Environment Variables

Proje root'unda `.env` dosyası oluşturun:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Client Environment Variables
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SOCKET_IO_URL=http://localhost:3001

# Server Configuration
NODE_ENV=production
PORT=3001
```

**Not:** Production'da `VITE_SOCKET_IO_URL` değerini gerçek server URL'iniz ile değiştirin.

### Adım 2: Build ve Çalıştırma

```bash
# Tüm servisleri build et ve çalıştır
docker compose up -d --build

# Logları görüntüle
docker compose logs -f

# Servisleri durdur
docker compose down
```

### Adım 3: Erişim

- **Client**: http://localhost
- **Server**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

---

## 🔧 Development Mode

### Adım 1: Development Docker Compose

```bash
# Development modunda çalıştır (hot reload ile)
docker compose -f docker-compose.dev.yml up --build

# Arka planda çalıştır
docker compose -f docker-compose.dev.yml up -d --build

# Logları görüntüle
docker compose -f docker-compose.dev.yml logs -f

# Servisleri durdur
docker compose -f docker-compose.dev.yml down
```

### Adım 2: Erişim

- **Client**: http://localhost:5173 (Vite dev server)
- **Server**: http://localhost:3001
- **Hot Reload**: Aktif (kod değişiklikleri otomatik yansır)

### Adım 3: Kod Değişiklikleri

Development modunda:
- Client ve server kodları volume mount ile bağlı
- Değişiklikler anında yansır
- `node_modules` container içinde kalır (performans için)

---

## 🗄️ Supabase Entegrasyonu

### Seçenek 1: Cloud Supabase (Önerilen)

Production için Supabase Cloud kullanın:

1. `.env` dosyasına Supabase credentials ekleyin (yukarıdaki gibi)
2. Docker Compose'u çalıştırın
3. Supabase Cloud otomatik olarak kullanılır

### Seçenek 2: Local Supabase (Development)

Local Supabase instance çalıştırmak için:

```bash
# Local Supabase ile birlikte çalıştır
docker compose --profile local-supabase up -d

# Erişim:
# - Supabase DB: localhost:54322
# - Supabase Studio: http://localhost:54323
```

**Not:** Local Supabase için:
- Database şifresi: `.env` dosyasındaki `SUPABASE_DB_PASSWORD`
- Schema'yı manuel olarak oluşturmanız gerekir (`SUPABASE_SCHEMA_FIXED.sql`)

---

## 🔀 Traefik Reverse Proxy

Watch Together projesi Traefik v1 reverse proxy ile entegre edilmiştir.

### Özellikler

- ✅ **Otomatik Service Discovery**: Docker container'ları otomatik algılar
- ✅ **SSL/HTTPS**: Let's Encrypt ile otomatik SSL sertifikası
- ✅ **Load Balancing**: Çoklu instance desteği
- ✅ **Dashboard**: Web arayüzü ile monitoring
- ✅ **HTTP → HTTPS Redirect**: Otomatik yönlendirme

### Hızlı Başlangıç

```bash
# Traefik ile birlikte çalıştır
docker compose up -d --build

# Erişim:
# - Client: http://localhost veya https://localhost
# - Server API: http://api.localhost veya https://api.localhost
# - Traefik Dashboard: http://localhost:8080
```

### Detaylı Rehber

Detaylı Traefik kurulumu için `TRAEFIK_SETUP.md` dosyasına bakın.

---

## 🎯 Docker Compose Kullanımı

### Temel Komutlar

```bash
# Servisleri başlat
docker compose up

# Arka planda başlat
docker compose up -d

# Build ve başlat
docker compose up --build

# Belirli servisleri başlat
docker compose up server client

# Servisleri durdur
docker compose down

# Servisleri durdur ve volume'ları sil
docker compose down -v

# Logları görüntüle
docker compose logs

# Belirli servisin loglarını görüntüle
docker compose logs server

# Canlı log takibi
docker compose logs -f

# Servisleri yeniden başlat
docker compose restart

# Belirli servisi yeniden başlat
docker compose restart server
```

### Container Yönetimi

```bash
# Çalışan container'ları listele
docker compose ps

# Container'a bağlan (shell)
docker compose exec server sh
docker compose exec client sh

# Container içinde komut çalıştır
docker compose exec server npm install
docker compose exec client npm run build

# Container'ı durdur
docker compose stop server

# Container'ı başlat
docker compose start server
```

### Image Yönetimi

```bash
# Image'ları listele
docker images

# Image'ı sil
docker rmi watch-together-server

# Kullanılmayan image'ları temizle
docker image prune -a
```

---

## 📊 Health Checks

Tüm servisler health check endpoint'leri içerir:

### Server Health Check

```bash
# Health check
curl http://localhost:3001/health

# Beklenen yanıt:
# {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### Client Health Check

```bash
# Health check
curl http://localhost/health

# Beklenen yanıt:
# healthy
```

---

## 🔍 Monitoring ve Debugging

### Log İnceleme

```bash
# Tüm loglar
docker compose logs

# Son 100 satır
docker compose logs --tail=100

# Belirli servis
docker compose logs server

# Zaman damgalı loglar
docker compose logs -t

# Canlı takip
docker compose logs -f server client
```

### Container İçine Girme

```bash
# Server container'ına gir
docker compose exec server sh

# Client container'ına gir
docker compose exec client sh

# Container içinde komut çalıştır
docker compose exec server node -v
docker compose exec client npm --version
```

### Resource Kullanımı

```bash
# Container resource kullanımı
docker stats

# Belirli container'lar
docker stats watch-together-server watch-together-client
```

---

## 🐛 Sorun Giderme

### Problem 1: Port Zaten Kullanılıyor

**Belirtiler:**
```
Error: bind: address already in use
```

**Çözüm:**
1. Port'u kullanan process'i bulun:
   ```bash
   # Windows
   netstat -ano | findstr :3001
   
   # Linux/Mac
   lsof -i :3001
   ```
2. Process'i durdurun veya `docker-compose.yml`'de port'u değiştirin

### Problem 2: Build Hatası

**Belirtiler:**
```
ERROR: failed to solve: process "npm ci" did not complete successfully
```

**Çözüm:**
1. `package-lock.json` dosyasının güncel olduğundan emin olun
2. Local'de `npm install` çalıştırın
3. `package-lock.json`'ı commit edin
4. Tekrar build edin: `docker compose build --no-cache`

### Problem 3: Environment Variables Çalışmıyor

**Belirtiler:**
- Client'ta Supabase bağlanmıyor
- Server'ta environment variables undefined

**Çözüm:**
1. `.env` dosyasının proje root'unda olduğundan emin olun
2. Environment variables'ın doğru olduğunu kontrol edin
3. Container'ı yeniden başlatın: `docker compose restart`
4. Environment variables'ı kontrol edin:
   ```bash
   docker compose exec server env | grep SUPABASE
   ```

### Problem 4: Volume Mount Çalışmıyor (Development)

**Belirtiler:**
- Kod değişiklikleri yansımıyor
- Hot reload çalışmıyor

**Çözüm:**
1. Volume mount'ların doğru olduğundan emin olun
2. File permissions'ı kontrol edin
3. Container'ı yeniden başlatın: `docker compose restart`

### Problem 5: Network Bağlantı Hatası

**Belirtiler:**
```
Error: connect ECONNREFUSED
```

**Çözüm:**
1. Tüm servislerin aynı network'te olduğundan emin olun
2. `docker-compose.yml`'de network ayarlarını kontrol edin
3. Container'ları yeniden başlatın: `docker compose down && docker compose up -d`

### Problem 6: Supabase Bağlanmıyor

**Belirtiler:**
- Supabase connection errors
- Auth çalışmıyor

**Çözüm:**
1. `.env` dosyasındaki Supabase credentials'ları kontrol edin
2. Supabase Dashboard'da projenin aktif olduğunu kontrol edin
3. Network bağlantısını test edin:
   ```bash
   docker compose exec server sh
   # Container içinde
   curl https://your-project-id.supabase.co
   ```

---

## 📝 Dockerfile Açıklamaları

### Server Dockerfile

- **Base Image**: `node:18-alpine` (küçük boyut)
- **Build**: Production dependencies only (`npm ci --only=production`)
- **Port**: 3001
- **Health Check**: `/health` endpoint

### Client Dockerfile

- **Multi-stage Build**: Builder + Production
- **Builder Stage**: Node.js ile build
- **Production Stage**: Nginx ile serve
- **Port**: 80
- **SPA Routing**: Tüm route'lar `index.html`'e yönlendirilir

---

## 🎯 Production Best Practices

1. **Environment Variables**: Hassas bilgileri `.env` dosyasında saklayın
2. **Health Checks**: Tüm servislerde health check endpoint'leri var
3. **Resource Limits**: Production'da resource limit'leri ekleyin:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '0.5'
         memory: 512M
   ```
4. **Logging**: Logları external service'e yönlendirin (opsiyonel)
5. **Backup**: Volume'ları düzenli yedekleyin
6. **Security**: Production'da root user kullanmayın (Dockerfile'larda `USER` directive ekleyin)

---

## 🔄 CI/CD Entegrasyonu

### GitHub Actions Örneği

```yaml
name: Docker Build and Push

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and push
        run: |
          docker compose build
          # Docker registry'ye push (opsiyonel)
```

---

## 📚 Ek Kaynaklar

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Supabase Docker](https://supabase.com/docs/guides/self-hosting/docker)
- [Nginx Configuration](https://nginx.org/en/docs/)

---

## ✅ Checklist

### Production Deployment

- [ ] Docker ve Docker Compose kurulu
- [ ] `.env` dosyası oluşturuldu
- [ ] Environment variables doğru
- [ ] `docker compose up --build` başarılı
- [ ] Health checks çalışıyor
- [ ] Client erişilebilir
- [ ] Server erişilebilir
- [ ] Supabase bağlantısı çalışıyor

### Development Setup

- [ ] `docker-compose.dev.yml` kullanılıyor
- [ ] Hot reload çalışıyor
- [ ] Volume mounts çalışıyor
- [ ] Loglar görüntülenebiliyor

---

## 🎉 Başarılı!

Artık Watch Together projeniz Docker ile çalışıyor! 

Sorularınız için:
- Docker Documentation
- GitHub Issues
- Docker Community

**İyi eğlenceler! 🐳**

