# 🐳 Docker Production Deployment - Watch Together

Bu rehber, Watch Together projesini Docker ile production ortamında deploy etmek için gereken tüm adımları içerir.

## 📋 İçindekiler

1. [Gereksinimler](#gereksinimler)
2. [Hızlı Başlangıç](#hızlı-başlangıç)
3. [Production Yapılandırması](#production-yapılandırması)
4. [Traefik ile SSL/HTTPS](#traefik-ile-sslhttps)
5. [Database Seçimi](#database-seçimi)
6. [Monitoring ve Logging](#monitoring-ve-logging)
7. [Backup ve Recovery](#backup-ve-recovery)
8. [Scaling](#scaling)
9. [Sorun Giderme](#sorun-giderme)

---

## 📦 Gereksinimler

### Sunucu Gereksinimleri

- **OS**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+ (veya Docker destekleyen herhangi bir Linux)
- **RAM**: Minimum 2GB (önerilen: 4GB+)
- **CPU**: 2+ core (önerilen: 4+ core)
- **Disk**: 20GB+ boş alan
- **Network**: Statik IP ve domain name (SSL için)

### Yazılım Gereksinimleri

- Docker 20.10+
- Docker Compose 2.0+
- Git

---

## 🚀 Hızlı Başlangıç

### Adım 1: Sunucu Hazırlığı

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y docker.io docker-compose git

# Docker servisini başlat
sudo systemctl start docker
sudo systemctl enable docker

# Docker Compose kurulumu (eğer yoksa)
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Kontrol
docker --version
docker compose version
```

### Adım 2: Projeyi Klonla

```bash
# Projeyi klonla
git clone <your-repo-url> ReactWatchTogether
cd ReactWatchTogether

# Veya mevcut projeyi sunucuya yükle
scp -r ReactWatchTogether user@your-server:/opt/
```

### Adım 3: Environment Variables

```bash
# .env dosyası oluştur
nano .env
```

`.env` dosyası içeriği:

```env
# Database Provider (supabase veya mysql)
DB_PROVIDER=supabase

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# MySQL Configuration (DB_PROVIDER=mysql olduğunda)
# MYSQL_HOST=mysql-db
# MYSQL_PORT=3306
# MYSQL_USER=watchtogether
# MYSQL_PASSWORD=your-secure-password
# MYSQL_DATABASE=watch_together

# Traefik Configuration
ACME_EMAIL=your-email@example.com
CLIENT_DOMAIN=yourdomain.com
SERVER_DOMAIN=api.yourdomain.com

# CORS Origins
CORS_ORIGINS=https://yourdomain.com,https://api.yourdomain.com

# Client Environment (Build-time)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SOCKET_IO_URL=https://api.yourdomain.com

# Server Configuration
PORT=3001
NODE_ENV=production
```

### Adım 4: Traefik ACME JSON

```bash
# ACME JSON dosyası oluştur
mkdir -p traefik
touch traefik/acme.json
chmod 600 traefik/acme.json
```

### Adım 5: Deploy

```bash
# Tüm servisleri başlat
docker compose up -d --build

# Logları kontrol et
docker compose logs -f

# Servis durumunu kontrol et
docker compose ps
```

### Adım 6: DNS Yapılandırması

Domain'inizi sunucuya yönlendirin:

```
A Record:
yourdomain.com → YOUR_SERVER_IP
api.yourdomain.com → YOUR_SERVER_IP

CNAME (opsiyonel):
www.yourdomain.com → yourdomain.com
```

---

## ⚙️ Production Yapılandırması

### Docker Compose Production Optimizasyonu

`docker-compose.prod.yml` oluşturun (opsiyonel):

```yaml
version: '3.8'

services:
  traefik:
    # ... mevcut yapılandırma
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  server:
    # ... mevcut yapılandırma
    restart: always
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  client:
    # ... mevcut yapılandırma
    restart: always
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

Kullanım:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 🔒 Traefik ile SSL/HTTPS

### Let's Encrypt Yapılandırması

Traefik otomatik olarak Let's Encrypt ile SSL sertifikası alır.

### Gereksinimler

1. **Domain Name**: Geçerli bir domain
2. **DNS**: Domain'in sunucuya yönlendirilmesi
3. **Port 80 Açık**: Let's Encrypt HTTP challenge için

### Yapılandırma

`.env` dosyasında:

```env
ACME_EMAIL=your-email@example.com
CLIENT_DOMAIN=yourdomain.com
SERVER_DOMAIN=api.yourdomain.com
```

Traefik otomatik olarak:
- SSL sertifikası alır
- HTTP'yi HTTPS'ye yönlendirir
- Sertifikaları otomatik yeniler

### Test

```bash
# HTTP → HTTPS redirect test
curl -I http://yourdomain.com

# HTTPS test
curl -I https://yourdomain.com

# SSL sertifika kontrolü
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

---

## 🗄️ Database Seçimi

### Supabase (Önerilen - Production)

**Avantajlar:**
- ✅ Managed service (hosting gerekmez)
- ✅ Otomatik yedekleme
- ✅ Real-time subscriptions
- ✅ Auth entegrasyonu

**Yapılandırma:**

```env
DB_PROVIDER=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### MySQL (Self-Hosted)

**Avantajlar:**
- ✅ Tam kontrol
- ✅ Self-hosted
- ✅ Vendor lock-in yok

**Yapılandırma:**

```env
DB_PROVIDER=mysql
MYSQL_HOST=mysql-db
MYSQL_PORT=3306
MYSQL_USER=watchtogether
MYSQL_PASSWORD=your-secure-password
MYSQL_DATABASE=watch_together
```

**MySQL ile Deploy:**

```bash
# MySQL servisini dahil et
docker compose --profile mysql up -d mysql-db

# Server'ı MySQL ile başlat
DB_PROVIDER=mysql docker compose up -d server
```

---

## 📊 Monitoring ve Logging

### Docker Logs

```bash
# Tüm servislerin logları
docker compose logs -f

# Belirli bir servisin logları
docker compose logs -f server
docker compose logs -f client
docker compose logs -f traefik

# Son 100 satır
docker compose logs --tail=100

# Belirli bir zaman aralığı
docker compose logs --since 1h
```

### Log Rotation

Docker Compose'da otomatik log rotation:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### Health Checks

```bash
# Health check endpoint'leri
curl http://localhost/health
curl https://api.yourdomain.com/health

# Docker health status
docker compose ps
```

### Resource Monitoring

```bash
# Container resource kullanımı
docker stats

# Disk kullanımı
docker system df

# Volume kullanımı
docker volume ls
docker volume inspect watch-together-mysql-data
```

---

## 💾 Backup ve Recovery

### Database Backup

#### Supabase

Supabase otomatik yedekleme yapar. Manuel yedekleme için Supabase Dashboard kullanın.

#### MySQL

```bash
# Backup oluştur
docker compose exec mysql-db mysqldump -u watchtogether -p watch_together > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup'ı geri yükle
docker compose exec -T mysql-db mysql -u watchtogether -p watch_together < backup_20240101_120000.sql

# Otomatik backup script
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec mysql-db mysqldump -u watchtogether -p$MYSQL_PASSWORD watch_together > $BACKUP_DIR/backup_$DATE.sql
# Eski backup'ları sil (7 günden eski)
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

### Volume Backup

```bash
# Volume'u yedekle
docker run --rm -v watch-together-mysql-data:/data -v $(pwd):/backup alpine tar czf /backup/mysql-data-backup.tar.gz /data

# Volume'u geri yükle
docker run --rm -v watch-together-mysql-data:/data -v $(pwd):/backup alpine tar xzf /backup/mysql-data-backup.tar.gz -C /
```

### Otomatik Backup (Cron)

```bash
# Crontab düzenle
crontab -e

# Her gün saat 02:00'de backup al
0 2 * * * /opt/ReactWatchTogether/scripts/backup.sh
```

---

## 📈 Scaling

### Horizontal Scaling (Load Balancing)

Traefik ile otomatik load balancing:

```yaml
# docker-compose.scale.yml
services:
  server:
    deploy:
      replicas: 3
```

```bash
# 3 instance başlat
docker compose -f docker-compose.yml -f docker-compose.scale.yml up -d --scale server=3
```

### Vertical Scaling

Resource limitlerini artır:

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
```

### Database Scaling

#### Supabase

Supabase otomatik scaling yapar. Plan yükseltme gerekebilir.

#### MySQL

- Read replicas ekle
- Connection pool limitlerini artır
- Query optimization

---

## 🔧 Sorun Giderme

### Problem 1: Container Başlamıyor

```bash
# Logları kontrol et
docker compose logs server

# Container durumunu kontrol et
docker compose ps

# Container'ı yeniden başlat
docker compose restart server

# Container'ı sıfırdan başlat
docker compose up -d --force-recreate server
```

### Problem 2: SSL Sertifikası Alınamıyor

```bash
# Traefik loglarını kontrol et
docker compose logs traefik | grep acme

# DNS kontrolü
nslookup yourdomain.com

# Port kontrolü
netstat -tuln | grep 80
netstat -tuln | grep 443

# ACME JSON izinleri
chmod 600 traefik/acme.json
```

### Problem 3: Database Bağlantı Hatası

```bash
# Database container durumu
docker compose ps mysql-db

# Database logları
docker compose logs mysql-db

# Bağlantı testi
docker compose exec mysql-db mysql -u watchtogether -p -e "SELECT 1"

# Environment variables kontrolü
docker compose exec server env | grep MYSQL
```

### Problem 4: Yüksek Memory Kullanımı

```bash
# Memory kullanımını kontrol et
docker stats

# Resource limitleri ekle
# docker-compose.yml'de deploy.resources.limits ekle

# Gereksiz container'ları temizle
docker system prune -a
```

### Problem 5: Disk Dolu

```bash
# Disk kullanımını kontrol et
df -h
docker system df

# Gereksiz dosyaları temizle
docker system prune -a --volumes

# Log dosyalarını temizle
docker compose down
docker volume prune
```

---

## 🚀 Production Checklist

### Deployment Öncesi

- [ ] Sunucu gereksinimleri karşılandı
- [ ] Docker ve Docker Compose kurulu
- [ ] Domain name yapılandırıldı
- [ ] DNS kayıtları yapıldı
- [ ] Environment variables ayarlandı
- [ ] ACME JSON dosyası oluşturuldu
- [ ] Database yapılandırıldı (Supabase veya MySQL)
- [ ] Firewall ayarları yapıldı (80, 443, 8080)
- [ ] SSL sertifikaları alındı
- [ ] Backup stratejisi belirlendi

### Deployment Sonrası

- [ ] Tüm servisler çalışıyor
- [ ] Health check'ler başarılı
- [ ] SSL/HTTPS çalışıyor
- [ ] Database bağlantısı başarılı
- [ ] Log rotation çalışıyor
- [ ] Monitoring aktif
- [ ] Backup otomatik çalışıyor
- [ ] Performance test edildi

---

## 📚 Ek Kaynaklar

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Traefik Documentation](https://doc.traefik.io/traefik/v1.7/)
- [Let's Encrypt](https://letsencrypt.org/)

---

## 🎉 Başarılı!

Artık Watch Together projeniz Docker ile production'da çalışıyor!

**Özellikler:**
- ✅ Docker Compose ile kolay deployment
- ✅ Traefik ile SSL/HTTPS
- ✅ Otomatik service discovery
- ✅ Health checks
- ✅ Log rotation
- ✅ Backup desteği
- ✅ Scaling desteği

**İyi eğlenceler! 🐳**

