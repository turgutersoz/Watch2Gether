# 🔀 Traefik v1 Entegrasyonu - Watch Together

Bu rehber, Watch Together projesine Traefik v1 reverse proxy entegrasyonunu açıklar.

## 📋 İçindekiler

1. [Traefik Nedir?](#traefik-nedir)
2. [Kurulum](#kurulum)
3. [Yapılandırma](#yapılandırma)
4. [Kullanım](#kullanım)
5. [SSL/HTTPS](#sslhttps)
6. [Sorun Giderme](#sorun-giderme)

---

## 🔀 Traefik Nedir?

Traefik, modern bir reverse proxy ve load balancer'dır. Özellikleri:

- **Otomatik Service Discovery**: Docker container'ları otomatik algılar
- **SSL/HTTPS**: Let's Encrypt ile otomatik SSL sertifikası
- **Load Balancing**: Çoklu instance desteği
- **Dashboard**: Web arayüzü ile monitoring
- **Dynamic Configuration**: Yapılandırma değişiklikleri için restart gerekmez

---

## 📦 Kurulum

### Gereksinimler

- Docker ve Docker Compose kurulu
- Domain name (production için)
- Port 80 ve 443 açık

### Adım 1: Traefik Klasörü Oluştur

```bash
mkdir -p traefik
```

### Adım 2: ACME JSON Dosyası

```bash
touch traefik/acme.json
chmod 600 traefik/acme.json
```

**Windows'ta:**
```powershell
New-Item -ItemType File -Path traefik\acme.json
# Dosya izinlerini manuel olarak ayarlayın (600)
```

### Adım 3: Environment Variables

`.env` dosyasına ekleyin:

```env
# Traefik Configuration
ACME_EMAIL=your-email@example.com
CLIENT_DOMAIN=localhost
SERVER_DOMAIN=api.localhost

# Production için:
# CLIENT_DOMAIN=yourdomain.com
# SERVER_DOMAIN=api.yourdomain.com
```

---

## ⚙️ Yapılandırma

### Docker Compose Yapılandırması

`docker-compose.yml` dosyasında Traefik servisi otomatik olarak yapılandırılmıştır:

```yaml
traefik:
  image: traefik:v1.7-alpine
  # ... yapılandırma
```

### Service Labels

Her servis Traefik labels ile yapılandırılır:

#### Client Labels

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.backend=client"
  - "traefik.port=80"
  - "traefik.frontend.rule=Host:localhost"
  - "traefik.frontend.entryPoints=http,https"
```

#### Server Labels

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.backend=server"
  - "traefik.port=3001"
  - "traefik.frontend.rule=Host:api.localhost"
  - "traefik.frontend.entryPoints=http,https"
```

---

## 🚀 Kullanım

### Başlatma

```bash
# Tüm servisleri başlat (Traefik dahil)
docker compose up -d --build

# Sadece Traefik'i başlat
docker compose up -d traefik
```

### Erişim

- **Client**: http://localhost veya https://localhost
- **Server API**: http://api.localhost veya https://api.localhost
- **Traefik Dashboard**: http://localhost:8080
- **Health Check**: http://api.localhost/health

### Traefik Dashboard

Traefik dashboard'a erişmek için:

1. Tarayıcıda `http://localhost:8080` adresine gidin
2. Tüm frontend'ler, backend'ler ve entry points görüntülenir
3. Real-time metrics ve statistics görüntülenir

---

## 🔒 SSL/HTTPS

### Let's Encrypt (Production)

Production için Let's Encrypt ile otomatik SSL:

1. **Domain Ayarları**: DNS kayıtlarınızı yapılandırın
2. **Environment Variables**: `.env` dosyasında domain'leri ayarlayın:
   ```env
   CLIENT_DOMAIN=yourdomain.com
   SERVER_DOMAIN=api.yourdomain.com
   ACME_EMAIL=your-email@example.com
   ```
3. **ACME JSON**: `traefik/acme.json` dosyası oluşturulduğundan emin olun
4. **Deploy**: `docker compose up -d --build`

Traefik otomatik olarak:
- Let's Encrypt'ten SSL sertifikası alır
- HTTP'yi HTTPS'ye yönlendirir
- Sertifikaları otomatik yeniler

### Self-Signed Certificate (Development)

Development için self-signed certificate:

```bash
# Traefik configuration'da self-signed certificate kullan
# docker-compose.yml'de acme bölümünü kaldırın veya devam edin
```

---

## 📊 Routing Kuralları

### Client Routing

```
http://localhost → client (port 80)
https://localhost → client (port 80, SSL)
```

### Server Routing

```
http://api.localhost → server (port 3001)
https://api.localhost → server (port 3001, SSL)
```

### Custom Domain (Production)

```
http://yourdomain.com → client
https://yourdomain.com → client (SSL)
http://api.yourdomain.com → server
https://api.yourdomain.com → server (SSL)
```

---

## 🔧 Gelişmiş Yapılandırma

### Middleware Ekleme

Rate limiting, authentication vb. için:

```yaml
labels:
  - "traefik.frontend.middlewares=auth"
  - "traefik.middlewares.auth.basicauth.users=user:password"
```

### Load Balancing

Çoklu instance için:

```yaml
labels:
  - "traefik.backend.loadbalancer.method=roundrobin"
```

### Custom Entry Points

```yaml
labels:
  - "traefik.frontend.entryPoints=http,https,ws"
```

---

## 🐛 Sorun Giderme

### Problem 1: Traefik Dashboard Erişilemiyor

**Belirtiler:**
- `http://localhost:8080` açılmıyor

**Çözüm:**
1. Traefik container'ının çalıştığını kontrol edin:
   ```bash
   docker compose ps traefik
   ```
2. Port 8080'in açık olduğundan emin olun
3. Logları kontrol edin:
   ```bash
   docker compose logs traefik
   ```

### Problem 2: SSL Sertifikası Alınamıyor

**Belirtiler:**
- HTTPS çalışmıyor
- ACME hatası

**Çözüm:**
1. Domain DNS kayıtlarını kontrol edin
2. Port 80'in açık olduğundan emin olun (Let's Encrypt için gerekli)
3. `acme.json` dosyasının izinlerini kontrol edin:
   ```bash
   chmod 600 traefik/acme.json
   ```
4. ACME email'in doğru olduğundan emin olun

### Problem 3: Service Bulunamıyor

**Belirtiler:**
- 404 Not Found
- Service Traefik'te görünmüyor

**Çözüm:**
1. Service'in `traefik.enable=true` label'ına sahip olduğundan emin olun
2. Service'in aynı network'te olduğundan emin olun:
   ```yaml
   networks:
     - watch-together-network
   ```
3. Service'in expose edildiğinden emin olun:
   ```yaml
   expose:
     - "3001"
   ```

### Problem 4: HTTP → HTTPS Redirect Çalışmıyor

**Belirtiler:**
- HTTP redirect olmuyor

**Çözüm:**
1. Entry point yapılandırmasını kontrol edin
2. Client labels'da redirect rule'u kontrol edin:
   ```yaml
   - "traefik.frontend.redirect.entryPoint=https"
   ```

### Problem 5: WebSocket Bağlantısı Çalışmıyor

**Belirtiler:**
- Socket.io bağlanamıyor
- WebSocket connection failed

**Çözüm:**
1. WebSocket için özel entry point ekleyin:
   ```yaml
   labels:
     - "traefik.frontend.entryPoints=http,https,ws"
   ```
2. Server labels'ı güncelleyin:
   ```yaml
   labels:
     - "traefik.backend.loadbalancer.sticky=true"
   ```

---

## 📝 Environment Variables

### Traefik için Gerekli Variables

```env
# Traefik Configuration
ACME_EMAIL=your-email@example.com

# Domain Configuration
CLIENT_DOMAIN=localhost
SERVER_DOMAIN=api.localhost

# Production için:
# CLIENT_DOMAIN=yourdomain.com
# SERVER_DOMAIN=api.yourdomain.com
```

---

## 🎯 Best Practices

1. **Security**: Traefik dashboard'u production'da güvenli hale getirin
2. **Monitoring**: Traefik metrics'lerini izleyin
3. **Backup**: `acme.json` dosyasını yedekleyin
4. **Logging**: Traefik loglarını external service'e yönlendirin
5. **Rate Limiting**: DDoS koruması için rate limiting ekleyin

---

## 🔍 Monitoring

### Traefik Dashboard

- **URL**: http://localhost:8080
- **Features**: 
  - Frontend/Backend listesi
  - Real-time metrics
  - Health checks
  - Statistics

### Log Monitoring

```bash
# Traefik logları
docker compose logs -f traefik

# Tüm servis logları
docker compose logs -f
```

---

## 📚 Ek Kaynaklar

- [Traefik v1 Documentation](https://doc.traefik.io/traefik/v1.7/)
- [Traefik Docker Provider](https://doc.traefik.io/traefik/v1.7/configuration/backends/docker/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Traefik Examples](https://github.com/traefik/traefik/tree/v1.7/examples)

---

## ✅ Checklist

### Kurulum

- [ ] Traefik klasörü oluşturuldu
- [ ] `acme.json` dosyası oluşturuldu ve izinler ayarlandı
- [ ] `.env` dosyasında domain'ler ayarlandı
- [ ] `docker-compose.yml` güncellendi
- [ ] Tüm servisler Traefik network'ünde

### Test

- [ ] Traefik dashboard erişilebilir
- [ ] Client erişilebilir (http/https)
- [ ] Server API erişilebilir
- [ ] HTTP → HTTPS redirect çalışıyor
- [ ] SSL sertifikaları çalışıyor (production)

---

## 🎉 Başarılı!

Artık Watch Together projeniz Traefik v1 ile reverse proxy kullanıyor!

**Özellikler:**
- ✅ Otomatik service discovery
- ✅ SSL/HTTPS desteği
- ✅ Load balancing
- ✅ Web dashboard
- ✅ Dynamic configuration

**İyi eğlenceler! 🔀**

