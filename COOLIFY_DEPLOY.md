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

### Yöntem 1: Docker Compose ile (Önerilen)

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
POSTGRES_HOST=postgres-db
POSTGRES_PORT=5432
POSTGRES_USER=watchtogether
POSTGRES_PASSWORD=your-secure-password-here
POSTGRES_DATABASE=watch_together
POSTGRES_SSL=false

# CORS Origins (Coolify domain'lerinizi ekleyin)
# Not: Boşluklar otomatik olarak temizlenir, virgülle ayırın
CORS_ORIGINS=https://yourdomain.com,https://api.yourdomain.com
# veya boşluklu format (otomatik trim edilir):
# CORS_ORIGINS=https://yourdomain.com, https://api.yourdomain.com

# Client Environment (Coolify domain'lerinizi kullanın)
VITE_SOCKET_IO_URL=https://api.yourdomain.com

# Server Configuration
NODE_ENV=production
PORT=3001
```

**Not:** 
- ✅ **Sadece PostgreSQL kullanılıyor** - Supabase yok
- ✅ Traefik environment variables'ına gerek yok (Coolify kendi reverse proxy'sini sağlıyor)
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

### Problem 2: Docker Compose Build Başarısız

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

### Problem 3: Database Bağlantı Hatası

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

### Problem 4: SSL Sertifikası Alınamıyor

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
