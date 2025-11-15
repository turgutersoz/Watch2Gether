# 🗄️ MySQL Kurulumu - Watch Together

Bu rehber, Watch Together projesine MySQL veritabanı desteği eklemek için gereken tüm adımları içerir.

## 📋 İçindekiler

1. [MySQL Nedir?](#mysql-nedir)
2. [Kurulum](#kurulum)
3. [Schema Oluşturma](#schema-oluşturma)
4. [Yapılandırma](#yapılandırma)
5. [Docker ile MySQL](#docker-ile-mysql)
6. [Kullanım](#kullanım)
7. [Supabase vs MySQL](#supabase-vs-mysql)
8. [Sorun Giderme](#sorun-giderme)

---

## 🗄️ MySQL Nedir?

MySQL, açık kaynaklı bir ilişkisel veritabanı yönetim sistemidir. Özellikleri:

- **Yüksek Performans**: Hızlı ve optimize edilmiş sorgular
- **Güvenilirlik**: Production-ready, stabil
- **Ölçeklenebilirlik**: Büyük veri setleri için uygun
- **Topluluk Desteği**: Geniş topluluk ve dokümantasyon
- **Ücretsiz**: Açık kaynak (GPL lisansı)

---

## 📦 Kurulum

### Gereksinimler

- Node.js 18+
- MySQL 8.0+ veya MariaDB 10.3+
- Docker (opsiyonel)

### Adım 1: MySQL Kurulumu

#### Windows/Mac

1. [MySQL Community Server](https://dev.mysql.com/downloads/mysql/) indirin ve kurun
2. Kurulum sırasında root şifresini belirleyin
3. MySQL Workbench (opsiyonel) ile yönetim yapabilirsiniz

#### Linux

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# CentOS/RHEL
sudo yum install mysql-server

# MySQL servisini başlat
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### Docker (Önerilen)

```bash
docker run --name watch-together-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=watch_together \
  -e MYSQL_USER=watchtogether \
  -e MYSQL_PASSWORD=watchtogether123 \
  -p 3306:3306 \
  -v mysql-data:/var/lib/mysql \
  -d mysql:8.0
```

### Adım 2: Node.js Paketleri

```bash
cd server
npm install mysql2
```

---

## 🗃️ Schema Oluşturma

### Manuel Kurulum

1. MySQL'e bağlanın:
   ```bash
   mysql -u root -p
   ```

2. Schema dosyasını çalıştırın:
   ```bash
   mysql -u root -p < MYSQL_SCHEMA.sql
   ```

   veya MySQL içinde:
   ```sql
   source MYSQL_SCHEMA.sql;
   ```

### Docker ile Otomatik

Docker Compose kullanıyorsanız, schema otomatik olarak oluşturulur:

```bash
docker compose --profile mysql up -d mysql-db
```

---

## ⚙️ Yapılandırma

### Environment Variables

`.env` dosyasına ekleyin:

```env
# Database Provider Seçimi
DB_PROVIDER=mysql

# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=watchtogether
MYSQL_PASSWORD=watchtogether123
MYSQL_DATABASE=watch_together
```

### Server Yapılandırması

Server otomatik olarak `DB_PROVIDER` environment variable'ına göre veritabanı seçer:

- `DB_PROVIDER=supabase` → Supabase kullanır
- `DB_PROVIDER=mysql` → MySQL kullanır
- Tanımsız veya boş → In-memory storage kullanır

---

## 🐳 Docker ile MySQL

### Docker Compose

`docker-compose.yml` dosyasında MySQL servisi tanımlıdır:

```yaml
mysql-db:
  image: mysql:8.0
  environment:
    MYSQL_ROOT_PASSWORD: rootpassword
    MYSQL_DATABASE: watch_together
    MYSQL_USER: watchtogether
    MYSQL_PASSWORD: watchtogether123
  ports:
    - "3306:3306"
  volumes:
    - mysql-data:/var/lib/mysql
    - ./MYSQL_SCHEMA.sql:/docker-entrypoint-initdb.d/init.sql:ro
```

### Başlatma

```bash
# MySQL servisini başlat
docker compose --profile mysql up -d mysql-db

# Logları kontrol et
docker compose logs -f mysql-db

# MySQL'e bağlan
docker compose exec mysql-db mysql -u watchtogether -p watch_together
```

### Tüm Servislerle Birlikte

```bash
# .env dosyasında DB_PROVIDER=mysql olduğundan emin olun
docker compose --profile mysql up -d --build
```

---

## 🚀 Kullanım

### Server Başlatma

```bash
cd server

# Environment variables ayarla
export DB_PROVIDER=mysql
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USER=watchtogether
export MYSQL_PASSWORD=watchtogether123
export MYSQL_DATABASE=watch_together

# Server'ı başlat
npm start
```

### Bağlantı Testi

Server başladığında otomatik olarak bağlantı test edilir:

```
📊 Database Provider: MYSQL
✅ MYSQL bağlantısı başarılı!
🚀 Server running on port 3001
```

### Veritabanı İşlemleri

Tüm veritabanı işlemleri `database-provider.js` üzerinden yapılır:

```javascript
import * as db from './database-provider.js';

// Room kaydet
await db.saveRoom(roomData);

// Room al
const room = await db.getRoom(roomId);

// Chat mesajı kaydet
await db.saveChatMessage(messageData);

// Kullanıcı istatistikleri güncelle
await db.updateUserStats(username, statsUpdate);
```

---

## 🔄 Supabase vs MySQL

### Supabase (Önerilen - Production)

**Avantajlar:**
- ✅ Managed service (hosting gerekmez)
- ✅ Otomatik yedekleme
- ✅ Real-time subscriptions
- ✅ Row Level Security (RLS)
- ✅ Auth entegrasyonu
- ✅ REST API otomatik
- ✅ Ücretsiz tier mevcut

**Dezavantajlar:**
- ❌ Vendor lock-in
- ❌ Özel sorgular için sınırlamalar
- ❌ Ücretsiz tier'da limitler

### MySQL (Self-Hosted)

**Avantajlar:**
- ✅ Tam kontrol
- ✅ Özel sorgular
- ✅ Vendor lock-in yok
- ✅ Ücretsiz (self-hosted)
- ✅ Yüksek performans

**Dezavantajlar:**
- ❌ Hosting gerekir
- ❌ Yedekleme manuel
- ❌ Bakım gerekir
- ❌ Scaling zorluğu

### Ne Zaman Hangisini Kullanmalı?

**Supabase kullanın:**
- Hızlı başlangıç istiyorsanız
- Managed service tercih ediyorsanız
- Real-time özellikler gerekiyorsa
- Auth entegrasyonu önemliyse

**MySQL kullanın:**
- Tam kontrol istiyorsanız
- Self-hosted tercih ediyorsanız
- Özel sorgular gerekiyorsa
- Mevcut MySQL altyapınız varsa

---

## 🐛 Sorun Giderme

### Problem 1: Bağlantı Hatası

**Belirtiler:**
```
❌ MySQL bağlantısı başarısız: connect ECONNREFUSED
```

**Çözüm:**
1. MySQL servisinin çalıştığını kontrol edin:
   ```bash
   # Linux
   sudo systemctl status mysql
   
   # Docker
   docker compose ps mysql-db
   ```

2. Port'un açık olduğundan emin olun:
   ```bash
   netstat -an | grep 3306
   ```

3. Firewall ayarlarını kontrol edin

4. Environment variables'ı kontrol edin:
   ```bash
   echo $MYSQL_HOST
   echo $MYSQL_USER
   ```

### Problem 2: Authentication Hatası

**Belirtiler:**
```
Access denied for user 'watchtogether'@'localhost'
```

**Çözüm:**
1. Kullanıcı ve şifrenin doğru olduğundan emin olun
2. Kullanıcıya yetki verin:
   ```sql
   GRANT ALL PRIVILEGES ON watch_together.* TO 'watchtogether'@'%';
   FLUSH PRIVILEGES;
   ```

### Problem 3: Schema Hatası

**Belirtiler:**
```
Table 'watch_together.rooms' doesn't exist
```

**Çözüm:**
1. Schema'yı oluşturun:
   ```bash
   mysql -u root -p < MYSQL_SCHEMA.sql
   ```

2. Tabloların oluştuğunu kontrol edin:
   ```sql
   USE watch_together;
   SHOW TABLES;
   ```

### Problem 4: JSON Parse Hatası

**Belirtiler:**
```
SyntaxError: Unexpected token in JSON
```

**Çözüm:**
1. MySQL 5.7.8+ kullandığınızdan emin olun (JSON desteği için)
2. JSON alanlarının doğru formatlandığından emin olun

### Problem 5: Connection Pool Hatası

**Belirtiler:**
```
Too many connections
```

**Çözüm:**
1. Connection pool limitini artırın:
   ```javascript
   connectionLimit: 20
   ```

2. MySQL max_connections ayarını kontrol edin:
   ```sql
   SHOW VARIABLES LIKE 'max_connections';
   SET GLOBAL max_connections = 200;
   ```

---

## 📊 Performans Optimizasyonu

### Index'ler

Schema'da otomatik index'ler oluşturulur:
- `rooms.host_id`
- `rooms.is_public`
- `chat_messages.room_id`
- `user_stats.username`

### Connection Pooling

MySQL client otomatik connection pooling kullanır:
- `connectionLimit: 10`
- `queueLimit: 0`
- `enableKeepAlive: true`

### Query Optimization

- Prepared statements kullanılır (SQL injection koruması)
- JSON alanları optimize edilir
- Foreign key constraints performansı artırır

---

## 🔒 Güvenlik

### Best Practices

1. **Şifre Güvenliği**: Güçlü şifreler kullanın
2. **Kullanıcı Yetkileri**: Minimum yetki prensibi
3. **SSL Bağlantı**: Production'da SSL kullanın
4. **Firewall**: Sadece gerekli portları açın
5. **Yedekleme**: Düzenli yedekleme yapın

### Örnek Güvenli Yapılandırma

```env
# Production için
MYSQL_HOST=your-mysql-server.com
MYSQL_PORT=3306
MYSQL_USER=watchtogether_prod
MYSQL_PASSWORD=strong-random-password-here
MYSQL_DATABASE=watch_together_prod
```

---

## 📚 Ek Kaynaklar

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [mysql2 npm package](https://www.npmjs.com/package/mysql2)
- [MySQL Best Practices](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)
- [Docker MySQL Image](https://hub.docker.com/_/mysql)

---

## ✅ Checklist

### Kurulum

- [ ] MySQL kuruldu
- [ ] `mysql2` paketi yüklendi
- [ ] Schema oluşturuldu
- [ ] Environment variables ayarlandı
- [ ] Bağlantı test edildi

### Yapılandırma

- [ ] `DB_PROVIDER=mysql` ayarlandı
- [ ] MySQL credentials doğru
- [ ] Port erişilebilir
- [ ] Firewall ayarları yapıldı

### Test

- [ ] Server başlatıldı
- [ ] Database bağlantısı başarılı
- [ ] Room kaydetme çalışıyor
- [ ] Chat mesajları kaydediliyor
- [ ] User stats güncelleniyor

---

## 🎉 Başarılı!

Artık Watch Together projeniz MySQL desteği ile çalışıyor!

**Özellikler:**
- ✅ Supabase ve MySQL desteği
- ✅ Otomatik provider seçimi
- ✅ Connection pooling
- ✅ Prepared statements
- ✅ JSON desteği
- ✅ Docker entegrasyonu

**İyi eğlenceler! 🗄️**

