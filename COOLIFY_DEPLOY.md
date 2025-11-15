# 🚀 Coolify Deployment - Watch Together (Detaylı Rehber)

Bu rehber, Watch Together projesini Coolify ile sıfırdan production'a deploy etmek için gereken **tüm adımları** içerir.

## 📋 İçindekiler

1. [Coolify Nedir?](#coolify-nedir)
2. [Sunucu Hazırlığı](#sunucu-hazırlığı)
3. [Coolify Kurulumu](#coolify-kurulumu)
4. [Projeyi Sunucuya Çekme](#projeyi-sunucuya-çekme)
5. [Coolify'da Proje Oluşturma](#coolifyda-proje-oluşturma)
6. [Database Yapılandırması](#database-yapılandırması)
7. [Environment Variables](#environment-variables)
8. [Deployment](#deployment)
9. [SSL/HTTPS Yapılandırması](#sslhttps-yapılandırması)
10. [Monitoring ve Logs](#monitoring-ve-logs)
11. [Sorun Giderme](#sorun-giderme)
12. [Best Practices](#best-practices)

---

## 🎯 Coolify Nedir?

Coolify, self-hosted bir PaaS (Platform as a Service) platformudur. Özellikleri:

- ✅ **Docker Compose Desteği**: Tam Docker Compose desteği
- ✅ **Git Integration**: GitHub/GitLab/Bitbucket entegrasyonu
- ✅ **SSL/HTTPS**: Otomatik SSL sertifikası (Let's Encrypt)
- ✅ **Environment Variables**: Kolay yönetim
- ✅ **Health Checks**: Otomatik health monitoring
- ✅ **Zero Vendor Lock-in**: Tam kontrol
- ✅ **Ücretsiz**: Açık kaynak
- ✅ **Database Yönetimi**: PostgreSQL, MySQL, MongoDB desteği

---

## 📦 Sunucu Hazırlığı

### Gereksinimler

- **OS**: Ubuntu 20.04+ / Debian 11+ (önerilen)
- **RAM**: Minimum 2GB (önerilen: 4GB+)
- **CPU**: 2+ core (önerilen: 4+ core)
- **Disk**: 20GB+ boş alan
- **Network**: Statik IP ve domain name (SSL için)

### Adım 1: Sunucuya Bağlan

```bash
# SSH ile sunucuya bağlan
ssh root@YOUR_SERVER_IP

# veya kullanıcı adı ile
ssh username@YOUR_SERVER_IP
```

### Adım 2: Sistem Güncellemesi

```bash
# Ubuntu/Debian
sudo apt update
sudo apt upgrade -y

# Sistem yeniden başlatma (gerekirse)
sudo reboot
```

### Adım 3: Temel Paketler

```bash
# Temel paketleri kur
sudo apt install -y curl git wget nano ufw

# Firewall ayarları (opsiyonel)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8000/tcp  # Coolify Dashboard
sudo ufw enable
```

---

## 🐳 Docker Kurulumu

### Adım 1: Docker Kurulumu

```bash
# Docker'ı kur
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker servisini başlat
sudo systemctl start docker
sudo systemctl enable docker

# Docker Compose kurulumu
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Kontrol
docker --version
docker compose version
```

### Adım 2: Docker Kullanıcı İzinleri

```bash
# Kullanıcıyı docker grubuna ekle
sudo usermod -aG docker $USER

# Yeni oturum için (veya şu komutu çalıştır)
newgrp docker

# Test
docker ps
```

---

## 🚀 Coolify Kurulumu

### Adım 1: Coolify Kurulumu

```bash
# Coolify'i kur
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Kurulum sonrası bilgileri not edin
# - Coolify Dashboard URL
# - Admin kullanıcı adı ve şifre
```

### Adım 2: Coolify Servisini Başlat

```bash
# Coolify servisini başlat
sudo systemctl start coolify
sudo systemctl enable coolify

# Durumu kontrol et
sudo systemctl status coolify

# Logları kontrol et
sudo journalctl -u coolify -f
```

### Adım 3: Coolify Dashboard'a Erişim

1. Tarayıcıda `http://YOUR_SERVER_IP:8000` adresine gidin
2. İlk kurulum sihirbazını tamamlayın:
   - Admin kullanıcı adı
   - Admin şifresi
   - Email (opsiyonel)
3. **"Save"** butonuna tıklayın

**Not:** Production'da Coolify Dashboard'u güvenli hale getirmek için reverse proxy kullanın.

---

## 📥 Projeyi Sunucuya Çekme

### Yöntem 1: Git Clone (Önerilen)

#### Adım 1: Repository'yi Clone Et

```bash
# Proje için dizin oluştur
sudo mkdir -p /opt/watch-together
sudo chown $USER:$USER /opt/watch-together
cd /opt/watch-together

# Repository'yi clone et
git clone https://github.com/YOUR_USERNAME/ReactWatchTogether.git .

# veya SSH ile
git clone git@github.com:YOUR_USERNAME/ReactWatchTogether.git .

# Private repository için
git clone https://YOUR_TOKEN@github.com/YOUR_USERNAME/ReactWatchTogether.git .
```

#### Adım 2: Branch Seçimi

```bash
# Mevcut branch'leri listele
git branch -a

# Production branch'ine geç (eğer varsa)
git checkout main
# veya
git checkout master
```

#### Adım 3: Dosyaları Kontrol Et

```bash
# Dosya yapısını kontrol et
ls -la

# Önemli dosyaların varlığını kontrol et
ls -la docker-compose.yml
ls -la server/
ls -la client/
```

### Yöntem 2: SCP ile Dosya Transferi (Alternatif)

#### Local'den Sunucuya

```bash
# Tüm projeyi sunucuya kopyala
scp -r /local/path/to/ReactWatchTogether root@YOUR_SERVER_IP:/opt/watch-together

# veya belirli dosyaları
scp docker-compose.yml root@YOUR_SERVER_IP:/opt/watch-together/
scp -r server root@YOUR_SERVER_IP:/opt/watch-together/
scp -r client root@YOUR_SERVER_IP:/opt/watch-together/
```

#### Windows'tan (PowerShell)

```powershell
# SCP ile dosya transferi
scp -r C:\Users\YourUser\Desktop\ReactWatchTogether root@YOUR_SERVER_IP:/opt/watch-together
```

### Yöntem 3: GitLab/Bitbucket Repository

```bash
# GitLab
git clone https://gitlab.com/YOUR_USERNAME/ReactWatchTogether.git

# Bitbucket
git clone https://bitbucket.org/YOUR_USERNAME/ReactWatchTogether.git
```

### Yöntem 4: ZIP Dosyası ile Transfer

#### Local'de ZIP Oluştur

```bash
# Local'de
cd /path/to/ReactWatchTogether
zip -r watch-together.zip . -x "node_modules/*" ".git/*" "dist/*"
```

#### Sunucuya Transfer Et

```bash
# SCP ile
scp watch-together.zip root@YOUR_SERVER_IP:/opt/

# Sunucuda
cd /opt
unzip watch-together.zip -d watch-together
cd watch-together
```

---

## 🎯 Coolify'da Proje Oluşturma

### Yöntem 1: Native Deployment (Önerilen - Docker Compose Olmadan)

Coolify'ın native deployment özelliğini kullanarak her servisi ayrı ayrı deploy edebilirsiniz. Bu yöntem daha basit ve Coolify'ın otomatik build özelliklerinden yararlanır.

#### Adım 1: Client (React) Resource Oluştur

**Seçenek A: Static Site (Önerilen - Production için)**

⚠️ **ÖNEMLİ:** Coolify Static Site otomatik Dockerfile oluştururken build context **root dizin** oluyor. Bu yüzden Root Directory boş bırakılmalı.

1. Coolify Dashboard'da **"New Resource"** > **"Static Site"** seçin
2. **"From Public Repository"** veya **"From Private Repository"** seçin
3. **Repository URL**: 
   - Public repo için: `https://github.com/YOUR_USERNAME/ReactWatchTogether`
   - Private repo için: `git@github.com:YOUR_USERNAME/ReactWatchTogether.git` (SSH key gerekir)
4. **Branch**: `main`
5. **"Root Directory"**: (boş bırakın) ⚠️ **ÖNEMLİ:** Root Directory boş olmalı
6. **"Build Command"**: `cd client && npm install && npm run build`
7. **"Publish Directory"**: `client/dist` (Root Directory boş olduğu için tam path gerekli)
8. **"Save"** butonuna tıklayın

**Neden Root Directory Boş?**
- Coolify Static Site otomatik Dockerfile oluştururken build context **root dizin** oluyor
- Build stage root dizinde çalışıyor, bu yüzden `cd client && npm run build` yapmalıyız
- Build output `client/dist` oluyor, bu yüzden **Publish Directory** `client/dist` olmalı
- Root Directory `client` olduğunda, Coolify build context'i `client/` yapmaya çalışıyor ama otomatik Dockerfile'da build stage root dizinde çalışıyor ve `/app/client/dist` arıyor - bu path uyuşmazlığı hataya neden oluyor

**Seçenek B: Application (Development/Testing için)**

1. Coolify Dashboard'da **"New Resource"** > **"Application"** seçin
2. **"From Public Repository"** veya **"From Private Repository"** seçin
3. **Repository URL**: 
   - Public repo için: `https://github.com/YOUR_USERNAME/ReactWatchTogether`
   - Private repo için: `git@github.com:YOUR_USERNAME/ReactWatchTogether.git` (SSH key gerekir)
4. **Branch**: `main`
5. **"Build Pack"**: Coolify otomatik olarak Vite/React'i algılar (Nixpacks)
6. **"Root Directory"**: `client` (client klasörünü belirtin)
7. **"Port"**: `5173` (Vite default port, Coolify otomatik yönlendirir)
8. **"Build Command"**: `npm run build` (otomatik algılanır)
9. **"Start Command"**: `npm run preview -- --host 0.0.0.0 --port 5173`
10. **"Publish Directory"**: `dist` (Vite build çıktısı)
11. **"Save"** butonuna tıklayın

**Önemli Not:** Production için **Static Site** kullanmanız önerilir çünkü:
- Nginx otomatik olarak serve eder (daha hızlı)
- Vite preview server production için optimize edilmemiştir
- Static site daha az kaynak kullanır


#### Adım 2: Server (Node.js) Resource Oluştur

1. Coolify Dashboard'da **"New Resource"** > **"Application"** seçin
2. **"From Public Repository"** veya **"From Private Repository"** seçin
3. Repository URL'ini girin: `https://github.com/YOUR_USERNAME/ReactWatchTogether`
4. Branch: `main`
5. **"Build Pack"**: Coolify otomatik olarak Node.js'i algılar (Nixpacks)
6. **"Root Directory"**: `server` (server klasörünü belirtin)
7. **"Port"**: `3001`
8. **"Build Command"**: `npm install` (otomatik algılanır, build gerekmez)
9. **"Start Command"**: `npm start` (otomatik algılanır)
10. **"Save"** butonuna tıklayın

#### Adım 3: Environment Variables Ekleme

**Client Resource için:**
1. Client resource'unuza gidin
2. **"Environment Variables"** sekmesine tıklayın
3. Şu değişkenleri ekleyin:
   ```env
   VITE_SOCKET_IO_URL=https://your-server-domain.com
   # ⚠️ ÖNEMLİ: Server'ın adresini yazın, client'ın adresini değil!
   # Örnek: Client: https://app.yourdomain.com → Server: https://api.yourdomain.com
   # VITE_SOCKET_IO_URL=https://api.yourdomain.com (server adresi)
   # Supabase kullanmıyorsanız bu değişkenleri eklemeyin
   ```

**Server Resource için:**
1. Server resource'unuza gidin
2. **"Environment Variables"** sekmesine tıklayın
3. Şu değişkenleri ekleyin:
   ```env
   NODE_ENV=production
   PORT=3001
   DB_PROVIDER=postgres
   POSTGRES_URL=postgres://postgres:password@database-host:5432/postgres
   CORS_ORIGINS=*
   # veya belirli domain'ler için:
   # CORS_ORIGINS=https://your-client-domain.com,https://your-server-domain.com
   # ⚠️ ÖNEMLİ: "*" tüm origin'lere izin verir (development için uygun, production'da belirli domain'ler kullanın)
   ```

#### Adım 4: Domain ve SSL Yapılandırması

**Client için:**
1. Client resource'unuza gidin
2. **"Domains"** sekmesine tıklayın
3. Domain ekleyin: `app.yourdomain.com`
4. **"Generate SSL"** butonuna tıklayın

**Server için:**
1. Server resource'unuza gidin
2. **"Domains"** sekmesine tıklayın
3. Domain ekleyin: `api.yourdomain.com`
4. **"Generate SSL"** butonuna tıklayın

#### Avantajlar

- ✅ Docker Compose yapılandırmasına gerek yok
- ✅ Coolify otomatik build yapar (Nixpacks)
- ✅ Her servis bağımsız olarak scale edilebilir
- ✅ Daha basit yapılandırma
- ✅ Coolify'ın otomatik SSL ve reverse proxy özelliklerinden yararlanır

#### Dezavantajlar

- ❌ Servisler arası network yapılandırması manuel (environment variables ile)
- ❌ Docker Compose'daki `depends_on` gibi bağımlılık yönetimi yok

---

### Yöntem 2: Docker Compose ile (Alternatif)

#### Adım 1: Yeni Resource Oluştur

1. Coolify Dashboard'da **"New Resource"** butonuna tıklayın
2. **"Docker Compose"** seçeneğini seçin
3. Proje adını girin: `watch-together`
4. **"Create"** butonuna tıklayın

#### Adım 2: Repository Bağlama

**Seçenek A: Public Repository**

1. **"From Public Repository"** seçeneğini seçin
2. Repository URL'ini girin:
   ```
   https://github.com/YOUR_USERNAME/ReactWatchTogether
   ```
3. Branch: `main` veya `master`
4. **"Docker Compose File"**: `docker-compose.yml`
5. **"Save"** butonuna tıklayın

**Seçenek B: Private Repository**

1. **"From Private Repository"** seçeneğini seçin
2. Repository URL'ini girin
3. **"Access Token"** veya **"SSH Key"** ekleyin
4. Branch ve Docker Compose file'ı seçin
5. **"Save"** butonuna tıklayın

**Seçenek C: Local Path (Sunucuda Dosya Varsa)**

1. **"From Local Path"** seçeneğini seçin
2. Path'i girin: `/opt/watch-together`
3. **"Docker Compose File"**: `docker-compose.yml`
4. **"Save"** butonuna tıklayın

#### Adım 3: Docker Compose Yapılandırması

Coolify otomatik olarak `docker-compose.yml` dosyasını okur. Eğer özel bir dosya kullanmak isterseniz:

1. **"Settings"** > **"Docker Compose File"** bölümüne gidin
2. Dosya adını girin: `docker-compose.yml` veya `docker-compose.prod.yml`
3. **"Save"** butonuna tıklayın

### Yöntem 2: Git Integration ile Auto-Deploy

#### Adım 1: Git Repository Bağlama

1. Projenize gidin
2. **"Settings"** > **"Git"** sekmesine tıklayın
3. Repository URL'ini girin
4. Branch seçin: `main` veya `master`
5. **"Access Token"** veya **"SSH Key"** ekleyin
6. **"Save"** butonuna tıklayın

#### Adım 2: Auto-Deploy Aktifleştir

1. **"Settings"** > **"Git"** sekmesinde
2. **"Auto Deploy"** seçeneğini aktifleştirin
3. Her push'ta otomatik deploy edilir

#### Adım 3: Webhook Yapılandırması (Opsiyonel)

1. **"Settings"** > **"Webhooks"** sekmesine gidin
2. Webhook URL'ini kopyalayın
3. GitHub/GitLab repository settings'te webhook ekleyin:
   - **URL**: Coolify webhook URL'i
   - **Content Type**: `application/json`
   - **Events**: `push`

---

## 🗄️ Database Yapılandırması

### PostgreSQL (Tek Database - Supabase Yok)

**Önemli:** Bu deployment sadece PostgreSQL kullanır. Supabase kullanılmaz.

#### Adım 1: PostgreSQL Servisi Oluştur

1. Coolify Dashboard'da **"New Resource"** > **"Database"** > **"PostgreSQL"** seçin
2. Database adı: `watch-together-db`
3. Kullanıcı adı: `watchtogether`
4. Şifre: Güçlü bir şifre belirleyin (not edin!)
5. Database adı: `watch_together`
6. **"Deploy"** butonuna tıklayın

#### Adım 2: Database Bağlantı Bilgileri

Deploy edildikten sonra:

1. Database servisine gidin
2. **"Connection String"** veya **"Environment Variables"** bölümünden bilgileri kopyalayın:
   ```
   POSTGRES_HOST=watch-together-db
   POSTGRES_PORT=5432
   POSTGRES_USER=watchtogether
   POSTGRES_PASSWORD=your-password
   POSTGRES_DATABASE=watch_together
   ```

#### Adım 3: Schema Oluşturma

**Yöntem A: Coolify SQL Editor**

1. Database servisine gidin
2. **"Execute SQL"** veya **"SQL Editor"** sekmesine tıklayın
3. `POSTGRES_SCHEMA.sql` dosyasının içeriğini yapıştırın
4. **"Execute"** butonuna tıklayın

**Yöntem B: Command Line**

```bash
# Database container'ına bağlan
docker exec -it watch-together-db psql -U watchtogether -d watch_together

# Schema dosyasını çalıştır
\i /path/to/POSTGRES_SCHEMA.sql

# veya direkt
psql -U watchtogether -d watch_together -f POSTGRES_SCHEMA.sql
```

**Yöntem C: Docker Exec**

```bash
# Schema dosyasını container'a kopyala
docker cp POSTGRES_SCHEMA.sql watch-together-db:/tmp/

# Container içinde çalıştır
docker exec -i watch-together-db psql -U watchtogether -d watch_together < /tmp/POSTGRES_SCHEMA.sql
```

**Not:** Bu deployment sadece PostgreSQL kullanır. Supabase veya MySQL kullanılmaz.

---

## ⚙️ Environment Variables

### Adım 1: Environment Variables Ekleme

1. Docker Compose projenize gidin
2. **"Environment Variables"** sekmesine tıklayın
3. **"Add Variable"** butonuna tıklayın
4. Key-Value çiftlerini ekleyin

### Adım 2: Gerekli Variables

**Önemli:** Coolify kendi reverse proxy'sini sağladığı için Traefik environment variables'ına gerek yoktur.

```env
# Database Provider
DB_PROVIDER=postgres

# PostgreSQL Configuration
# Yöntem 1: Connection String (Önerilen - Tek satır, Coolify'dan kopyalayabilirsiniz)
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
# "*" tüm origin'lere izin verir (development için uygun)
CORS_ORIGINS=*
# veya belirli domain'ler için (production önerilen):
# CORS_ORIGINS=https://yourdomain.com,https://api.yourdomain.com
# Not: Boşluklar otomatik olarak temizlenir, virgülle ayırın

# Client Environment (Coolify domain'lerinizi kullanın)
VITE_SOCKET_IO_URL=https://api.yourdomain.com
# ⚠️ ÖNEMLİ: Server'ın adresini yazın (Socket.io server'ına bağlanır), client'ın adresini değil!
# Örnek: Client: https://app.yourdomain.com → Server: https://api.yourdomain.com

# Server Configuration
NODE_ENV=production
PORT=3001
```

**Not:** 
- ✅ **Sadece PostgreSQL kullanılıyor** - Supabase yok
- ✅ Traefik/Caddy label'ları `docker-compose.yml`'de mevcut (Coolify otomatik ekleyebilir)
- ✅ Domain'ler Coolify Dashboard'dan yönetilir
- ✅ SSL/HTTPS Coolify tarafından otomatik sağlanır

### Adım 3: Secret Variables (Güvenli)

Hassas bilgiler için:

1. **"Secret"** checkbox'ını işaretleyin
2. Değer gizli olarak saklanır
3. Loglarda görünmez

---

## 🚀 Deployment

### Adım 1: İlk Deploy

1. Projenize gidin
2. **"Deploy"** butonuna tıklayın
3. Coolify otomatik olarak:
   - Repository'yi clone eder (veya local path'ten okur)
   - Docker Compose dosyasını okur
   - Image'ları build eder
   - Container'ları başlatır
   - Health check'leri çalıştırır

### Adım 2: Deploy Logları

1. **"Logs"** sekmesine tıklayın
2. Real-time log görüntüleme
3. Hataları kontrol edin

### Adım 3: Container Durumları

1. **"Containers"** sekmesine tıklayın
2. Her container'ın durumunu görün:
   - ✅ Running
   - ⚠️ Restarting
   - ❌ Stopped

### Adım 4: Health Checks

1. **"Health Checks"** sekmesine tıklayın
2. Health check sonuçlarını görün
3. Başarısız olanları kontrol edin

---

## 🏷️ Traefik/Caddy Labels (Coolify Reverse Proxy)

Coolify, Traefik veya Caddy kullanarak reverse proxy sağlar. `docker-compose.yml` dosyasında label'lar zaten tanımlıdır, ancak Coolify bunları otomatik olarak da ekleyebilir.

### Traefik Labels

`docker-compose.yml` dosyasında her servis için Traefik label'ları mevcuttur:

**Client Service:**
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.middlewares.gzip.compress=true"
  - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
  - "traefik.http.routers.http-0-client.entryPoints=http"
  - "traefik.http.routers.http-0-client.middlewares=gzip"
  - "traefik.http.routers.http-0-client.rule=Host(`yourdomain.com`) && PathPrefix(`/`)"
  - "traefik.http.services.http-0-client.loadbalancer.server.port=80"
  - "traefik.http.routers.https-0-client.entryPoints=https"
  - "traefik.http.routers.https-0-client.tls=true"
```

**Server Service:**
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.middlewares.gzip.compress=true"
  - "traefik.http.routers.http-0-server.entryPoints=http"
  - "traefik.http.routers.http-0-server.rule=Host(`api.yourdomain.com`) && PathPrefix(`/`)"
  - "traefik.http.services.http-0-server.loadbalancer.server.port=3001"
  - "traefik.http.routers.https-0-server.entryPoints=https"
  - "traefik.http.routers.https-0-server.tls=true"
```

### Caddy Labels

Coolify Caddy kullanıyorsa, Caddy label'ları otomatik olarak eklenir:

```yaml
# Coolify tarafından otomatik eklenir
caddy_0.encode=zstd gzip
caddy_0.handle_path.0_reverse_proxy={{upstreams 80}}
caddy_0.handle_path=/*
caddy_0.header=-Server
caddy_0.try_files={path} /index.html
caddy_0=http://yourdomain.com
caddy_ingress_network=coolify
```

### Önemli Notlar

1. **Coolify Otomatik Yönetim:**
   - Coolify, domain'ler eklendiğinde label'ları otomatik olarak ekleyebilir
   - Manuel label eklemek isterseniz `docker-compose.yml`'deki label'ları kullanabilirsiniz
   - Coolify Dashboard'dan domain eklediğinizde label'lar otomatik güncellenir

2. **Port Yapılandırması:**
   - Client: Port `80` (Nginx)
   - Server: Port `3001` (Node.js)
   - Bu portlar `expose` bölümünde tanımlıdır

3. **Gzip Compression:**
   - Traefik label'larında `gzip` middleware aktif
   - Caddy'de `zstd gzip` encoding aktif
   - Performans için önerilir

4. **HTTPS Redirect:**
   - Traefik'te `redirect-to-https` middleware mevcut
   - Caddy otomatik olarak HTTPS yönlendirmesi yapar

5. **SPA Routing:**
   - Client için `try_files` Caddy label'ı mevcut
   - React Router için gerekli

### Label'ları Güncelleme

Eğer Coolify'da label'ları manuel olarak güncellemek isterseniz:

1. **Coolify Dashboard** > Projeniz > **"Configuration"** sekmesine gidin
2. **"Labels"** bölümüne tıklayın
3. Label'ları ekleyin veya düzenleyin
4. **"Save"** butonuna tıklayın
5. Projeyi yeniden deploy edin

**Veya** `docker-compose.yml` dosyasındaki label'ları düzenleyip Git'e push edin.

---

## 🔒 SSL/HTTPS Yapılandırması

### Adım 1: Domain Ekleme

1. Projenize gidin
2. **"Domains"** sekmesine tıklayın
3. **"Add Domain"** butonuna tıklayın
4. Domain'inizi ekleyin:
   - `yourdomain.com` (Client için)
   - `api.yourdomain.com` (Server için)
5. **"Save"** butonuna tıklayın

### Adım 2: DNS Yapılandırması

Domain'inizi Coolify sunucusuna yönlendirin:

```
A Record:
yourdomain.com → YOUR_COOLIFY_SERVER_IP
api.yourdomain.com → YOUR_COOLIFY_SERVER_IP

CNAME (opsiyonel):
www.yourdomain.com → yourdomain.com
```

**DNS Propagation:** 5-30 dakika sürebilir.

### Adım 3: SSL Sertifikası Oluşturma

1. Domain eklendikten sonra **"Generate SSL"** butonuna tıklayın
2. Coolify otomatik olarak:
   - Let's Encrypt ile SSL sertifikası alır
   - HTTP → HTTPS redirect yapar
   - Sertifikaları otomatik yeniler

### Adım 4: SSL Durumunu Kontrol Et

1. **"Domains"** sekmesinde SSL durumunu görün
2. ✅ Yeşil: SSL aktif
3. ⚠️ Sarı: SSL bekleniyor
4. ❌ Kırmızı: SSL hatası

### Adım 5: Test

```bash
# HTTP → HTTPS redirect test
curl -I http://yourdomain.com

# HTTPS test
curl -I https://yourdomain.com

# SSL sertifika kontrolü
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

---

## 📊 Monitoring ve Logs

### Logs Görüntüleme

1. Projenize gidin
2. **"Logs"** sekmesine tıklayın
3. Container seçin (client, server, traefik)
4. Real-time log görüntüleme

### Log Filtreleme

- **Search**: Belirli kelimeleri ara
- **Filter**: Log seviyesine göre filtrele
- **Download**: Logları indir

### Metrics

1. **"Metrics"** sekmesine tıklayın
2. Görüntülenen metrikler:
   - CPU kullanımı
   - Memory kullanımı
   - Network trafiği
   - Disk kullanımı

### Health Checks

1. **"Health Checks"** sekmesine tıklayın
2. Health check sonuçlarını görün
3. Başarısız olanları kontrol edin

---

## 🐛 Sorun Giderme

### Problem 0: Build Hatası - TypeScript Not Found (Nixpacks)

**Belirtiler:**
```
sh: 1: tsc: not found
ERROR: process "/bin/bash -ol pipefail -c npm run build" did not complete successfully
```

**Neden:**
- Coolify Nixpacks kullanıyor ve root'tan build yapıyor
- Root'ta `npm ci` çalışıyor ama `client` klasöründe dependencies yüklenmiyor
- `npm run build` → `cd client && npm run build` çalışıyor ama `tsc` bulunamıyor

**Çözüm:**

**Yöntem 1: Root package.json Güncelleme (Önerilen)**

Root `package.json` dosyasını güncelleyin:

```json
{
  "scripts": {
    "build": "cd client && npm install && npm run build",
    "postinstall": "cd client && npm install"
  }
}
```

Bu sayede:
- `npm ci` çalıştığında `postinstall` otomatik olarak client dependencies'lerini yükler
- `npm run build` çalıştığında client'ta dependencies hazır olur

**Yöntem 2: Docker Compose Kullanma (Alternatif)**

Coolify'da Docker Compose kullanıyorsanız, `docker-compose.yml` dosyası zaten doğru yapılandırılmıştır:
- ✅ `client/Dockerfile` kullanılıyor
- ✅ `npm install` ile devDependencies dahil yükleniyor

**Not:** 
- Docker Compose kullanıyorsanız, Nixpacks build'i atlanır
- Sadece Git ile deploy ediyorsanız, Yöntem 1'i kullanın

### Problem 1: Repository Clone Edilemiyor

**Belirtiler:**
- "Repository not found" hatası
- "Permission denied" hatası

**Çözüm:**
1. Repository URL'ini kontrol edin
2. Private repository için access token ekleyin
3. SSH key ekleyin (SSH kullanıyorsanız)
4. Repository'nin public olduğundan emin olun (public için)

### Problem 2: Server Build Hatası - npm ci Package Lock Senkronizasyonu

**Belirtiler:**
```
npm error `npm ci` can only install packages when your package.json and package-lock.json are in sync.
npm error Missing: mysql2@3.15.3 from lock file
npm error Missing: pg@8.16.3 from lock file
```

**Neden:**
- `server/package.json`'a yeni paketler eklendi (`mysql2`, `pg`) ama `server/package-lock.json` güncellenmedi
- Coolify Nixpacks `npm ci` kullanıyor ve lock file ile `package.json` senkronize olmalı

**Çözüm:**

1. Local'de `server` dizinine gidin:
   ```bash
   cd server
   ```

2. `npm install` çalıştırın (package-lock.json'ı günceller):
   ```bash
   npm install
   ```

3. Değişiklikleri commit edin ve push edin:
   ```bash
   git add server/package-lock.json
   git commit -m "Update server package-lock.json for Coolify deployment"
   git push
   ```

4. Coolify otomatik olarak yeniden deploy eder

**Önleme:** 
- Yeni paket eklediğinizde her zaman `npm install` çalıştırıp `package-lock.json`'ı commit edin
- `package.json`'ı değiştirdiğinizde `package-lock.json`'ı da güncelleyin

### Problem 3: Docker Compose Build Başarısız

**Belirtiler:**
- Build loglarında hata
- Container başlamıyor

**Çözüm:**
1. Logları kontrol edin
2. Dockerfile'ları kontrol edin
3. Environment variables'ı kontrol edin
4. Disk alanını kontrol edin:
   ```bash
   df -h
   docker system df
   ```

### Problem 4: CORS Hatası - "No 'Access-Control-Allow-Origin' header"

**Belirtiler:**
```
Access to XMLHttpRequest at 'http://server-domain/socket.io/...' from origin 'http://client-domain' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**Neden:**
- `CORS_ORIGINS=*` verildiğinde, kod bunu `["*"]` array'ine çeviriyor
- Socket.io ve Express CORS middleware'i `*` string'ini özel olarak handle etmiyor
- Express CORS middleware'i yapılandırılmamış olabilir

**Çözüm:**

1. **Server Environment Variables'ı kontrol edin:**
   - Coolify Dashboard'da server resource'unuza gidin
   - **"Environment Variables"** sekmesine tıklayın
   - `CORS_ORIGINS` değişkenini kontrol edin

2. **`CORS_ORIGINS=*` kullanın (tüm origin'lere izin verir):**
   ```env
   CORS_ORIGINS=*
   ```
   ⚠️ **Not:** Kod güncellendi, artık `*` değeri doğru şekilde handle ediliyor.

3. **Veya belirli domain'leri belirtin:**
   ```env
   CORS_ORIGINS=http://go84skkwo4g8sos0scc840k0.20.56.65.121.sslip.io,http://twk0ko4wk8kwgcs0g0cow4sk.20.56.65.121.sslip.io
   ```

4. **Server'ı yeniden deploy edin:**
   - Environment variable'ı değiştirdikten sonra server'ı yeniden deploy edin
   - Coolify otomatik olarak yeniden başlatır

5. **Kod güncellemesi:**
   - `server/index.js` dosyası güncellendi
   - `CORS_ORIGINS=*` artık doğru şekilde `origin: true` olarak yorumlanıyor
   - Express CORS middleware'i de yapılandırıldı

**Önleme:**
- Production'da `CORS_ORIGINS=*` yerine belirli domain'leri kullanın
- Development için `*` kullanabilirsiniz

### Problem 5: Database Bağlantı Hatası

**Belirtiler:**
- "Connection refused" hatası
- "Authentication failed" hatası

**Çözüm:**
1. Database servisinin çalıştığını kontrol edin
2. Environment variables'ı kontrol edin:
   - `POSTGRES_HOST` doğru mu?
   - `POSTGRES_USER` doğru mu?
   - `POSTGRES_PASSWORD` doğru mu?
3. Network ayarlarını kontrol edin (aynı network'te olmalı)
4. Database host adını kontrol edin (Coolify'de servis adı)

### Problem 4: Static Site Build Hatası - "/app/client/dist" Not Found

**Belirtiler:**
```
ERROR: failed to calculate checksum of ref: "/app/client/dist": not found
```

**Neden:**
- Coolify Static Site deployment'ında Root Directory `client` olarak ayarlandığında
- Build context `client/` klasörü olur
- Build command `npm run build` `client/` içinde çalışır ve `client/dist` oluşturur
- Ama Coolify'ın Dockerfile'ı `/app/client/dist` arıyor (yanlış path)

**Çözüm:**

**Static Site ayarlarını düzeltin:**

Coolify Static Site otomatik Dockerfile oluştururken build context **root dizin** oluyor. Bu yüzden:

1. Coolify Dashboard'da Static Site resource'unuza gidin
2. **"Settings"** > **"Build"** sekmesine tıklayın
3. Ayarları şu şekilde yapın:
   - **"Root Directory"**: (boş bırakın) ⚠️ **ÖNEMLİ**
   - **"Build Command"**: `cd client && npm install && npm run build`
   - **"Publish Directory"**: `client/dist` ✅
4. **"Save"** butonuna tıklayın
5. Yeniden deploy edin

**Açıklama:**
- Coolify Static Site build stage'inde build context **root dizin** oluyor
- Bu yüzden Root Directory boş bırakılmalı
- Build Command `cd client && npm run build` ile `client/` klasörüne girip build yapıyor
- Build output `client/dist` oluyor, bu yüzden **Publish Directory** `client/dist` olmalı

**Neden Root Directory `client` Çalışmıyor?**
- Root Directory `client` olduğunda, Coolify build context'i `client/` yapmaya çalışıyor
- Ama otomatik Dockerfile'da build stage root dizinde çalışıyor ve `/app/client/dist` arıyor
- Bu path uyuşmazlığı hataya neden oluyor

### Problem 5: SSL Sertifikası Alınamıyor

**Belirtiler:**
- SSL hatası
- "Certificate generation failed"

**Çözüm:**
1. DNS kayıtlarını kontrol edin:
   ```bash
   nslookup yourdomain.com
   dig yourdomain.com
   ```
2. Port 80'in açık olduğundan emin olun (Let's Encrypt için)
3. Domain'in doğru yönlendirildiğini kontrol edin
4. Let's Encrypt rate limit'ini kontrol edin (çok fazla deneme yapmayın)
5. DNS propagation'ı bekleyin (5-30 dakika)

### Problem 5: Container Restart Loop

**Belirtiler:**
- Container sürekli restart oluyor
- Health check başarısız

**Çözüm:**
1. Logları kontrol edin
2. Health check'leri kontrol edin
3. Environment variables'ı kontrol edin
4. Resource limitlerini kontrol edin
5. Port çakışması olup olmadığını kontrol edin

### Problem 6: Port Zaten Kullanılıyor

**Belirtiler:**
- "Port already in use" hatası

**Çözüm:**
1. Hangi process port'u kullanıyor kontrol edin:
   ```bash
   sudo netstat -tulpn | grep :80
   sudo lsof -i :80
   ```
2. Port'u değiştirin veya process'i durdurun
3. Docker Compose'da port mapping'i kontrol edin

---

## 💡 Best Practices

### 1. Git Repository Yönetimi

- ✅ Production branch kullanın (`main` veya `master`)
- ✅ `.env` dosyalarını `.gitignore`'a ekleyin
- ✅ Environment variables'ı Coolify'de saklayın
- ✅ Secret variables kullanın

### 2. Database Yönetimi

- ✅ Güçlü şifreler kullanın
- ✅ Düzenli backup alın
- ✅ Connection pooling kullanın
- ✅ Index'leri optimize edin

### 3. Security

- ✅ SSL/HTTPS kullanın
- ✅ Firewall ayarlarını yapın
- ✅ Environment variables'ı güvenli tutun
- ✅ Coolify Dashboard'u güvenli hale getirin

### 4. Monitoring

- ✅ Logları düzenli kontrol edin
- ✅ Metrics'i izleyin
- ✅ Health check'leri aktif tutun
- ✅ Alert'leri yapılandırın

### 5. Backup

- ✅ Database backup'ları otomatikleştirin
- ✅ Volume backup'ları alın
- ✅ Configuration backup'ları alın

---

## 📚 Ek Kaynaklar

- [Coolify Documentation](https://coolify.io/docs)
- [Coolify GitHub](https://github.com/coollabsio/coolify)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

---

## ✅ Deployment Checklist

### Öncesi

- [ ] Sunucu hazır (Ubuntu/Debian)
- [ ] Docker ve Docker Compose kurulu
- [ ] Coolify kurulu ve çalışıyor
- [ ] Domain name hazır
- [ ] DNS kayıtları yapıldı
- [ ] Repository hazır (GitHub/GitLab)
- [ ] Database seçimi yapıldı

### Deployment

- [ ] Proje sunucuya çekildi (Git clone veya SCP)
- [ ] Coolify'da Docker Compose projesi oluşturuldu
- [ ] Repository bağlandı
- [ ] Database servisi oluşturuldu
- [ ] Schema oluşturuldu
- [ ] Environment variables eklendi
- [ ] Domain eklendi
- [ ] SSL aktifleştirildi
- [ ] İlk deploy yapıldı

### Sonrası

- [ ] Tüm container'lar çalışıyor
- [ ] Health check'ler başarılı
- [ ] SSL/HTTPS çalışıyor
- [ ] Database bağlantısı başarılı
- [ ] Application erişilebilir
- [ ] Logs temiz
- [ ] Monitoring aktif
- [ ] Backup stratejisi belirlendi

---

## 🎉 Başarılı!

Artık Watch Together projeniz Coolify ile production'da çalışıyor!

**Özellikler:**
- ✅ Docker Compose desteği
- ✅ Otomatik SSL/HTTPS
- ✅ Git integration
- ✅ Auto-deploy
- ✅ Health monitoring
- ✅ PostgreSQL/MySQL desteği
- ✅ Zero vendor lock-in

**İyi eğlenceler! 🚀**

---

## 📞 Destek

Sorun yaşarsanız:
1. Coolify loglarını kontrol edin
2. Docker loglarını kontrol edin
3. [Coolify Discord](https://discord.gg/coolify) topluluğuna katılın
4. [GitHub Issues](https://github.com/coollabsio/coolify/issues) açın
