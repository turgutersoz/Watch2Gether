# Railway ile Socket.io Server Deployment

## 🚂 Railway Kurulumu

### Adım 1: Railway Hesabı
1. https://railway.app adresine gidin
2. GitHub hesabınızla giriş yapın

### Adım 2: Yeni Proje
1. "New Project" > "Deploy from GitHub repo"
2. Repository'nizi seçin
3. Root directory: `server` olarak ayarlayın

### Adım 3: Environment Variables
Railway Dashboard > Variables bölümüne ekleyin:

```env
# Supabase Configuration (Opsiyonel)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server Configuration
PORT=3001
NODE_ENV=production
```

**Not:** Supabase variables opsiyoneldir. Eğer Supabase kullanmıyorsanız, server in-memory storage kullanır.

### Adım 4: Build Settings
Railway otomatik olarak Node.js projelerini algılar. Eğer manuel ayar gerekirse:

**Build Command:** (boş bırakın, Railway otomatik algılar)
**Start Command:** `npm start`

### Adım 5: Public Domain
1. Railway Dashboard > Settings > Networking
2. "Generate Domain" butonuna tıklayın
3. Oluşan URL'yi kopyalayın (örn: `your-app.railway.app`)
4. Bu URL'yi `VITE_SOCKET_IO_URL` olarak client'a ekleyin

### Adım 6: Custom Domain (Opsiyonel)
1. Railway Dashboard > Settings > Networking
2. "Custom Domain" bölümünden domain ekleyin
3. DNS kayıtlarını yapılandırın

## 🔧 CORS Ayarları

`server/index.js` dosyasında CORS ayarlarını güncelleyin:

```javascript
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

**Önemli:** Production URL'lerini mutlaka ekleyin!

## 📝 Railway.json (Opsiyonel)

Proje root'unda `railway.json` oluşturun:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## ✅ Test

Deployment sonrası:
1. Railway'de logları kontrol edin
2. Socket.io server URL'ini test edin: `https://your-app.railway.app`
3. Client'tan bağlantıyı test edin
4. CORS hatalarını kontrol edin

## 🔍 Monitoring

Railway Dashboard'da:
- **Metrics**: CPU, Memory, Network kullanımı
- **Logs**: Real-time log görüntüleme
- **Deployments**: Deployment geçmişi
- **Settings**: Environment variables, domain ayarları

## 💰 Maliyet

Railway'in ücretsiz tier'ı:
- $5 kredi/ay
- Genellikle küçük-orta ölçekli uygulamalar için yeterli
- Kullanım limitlerini aşarsanız ödeme gerekir

**Tahmini Kullanım:**
- Küçük uygulama: ~$0-2/ay
- Orta ölçekli: ~$3-5/ay
- Büyük ölçekli: $5+/ay

## 🐛 Sorun Giderme

### Problem: npm ci Hatası - Package Lock Senkronizasyonu

**Belirtiler:**
```
npm error `npm ci` can only install packages when your package.json and package-lock.json are in sync.
npm error Missing: @supabase/supabase-js@2.81.1 from lock file
```

**Çözüm:**
1. Local'de `server` dizinine gidin
2. `npm install` çalıştırın (package-lock.json'ı günceller)
3. Değişiklikleri commit edin ve push edin:
   ```bash
   git add server/package-lock.json
   git commit -m "Update package-lock.json for Railway deployment"
   git push
   ```
4. Railway otomatik olarak yeniden deploy eder

**Önleme:** Yeni paket eklediğinizde her zaman `npm install` çalıştırıp `package-lock.json`'ı commit edin.

---

## 🐛 Sorun Giderme (Devam)

### Deployment Başarısız

**Hata:** Build başarısız oluyor

**Çözüm:**
1. Root directory'nin `server` olduğundan emin olun
2. `package.json` dosyasının doğru olduğundan emin olun
3. Logları kontrol edin
4. Node.js version'ı kontrol edin

### Socket.io Bağlanmıyor

**Hata:** Client'tan server'a bağlanılamıyor

**Çözüm:**
1. Railway URL'inin doğru olduğundan emin olun
2. CORS ayarlarını kontrol edin
3. Environment variable'ı kontrol edin (`VITE_SOCKET_IO_URL`)
4. Railway loglarını kontrol edin
5. Firewall ayarlarını kontrol edin

### Port Hatası

**Hata:** Port zaten kullanılıyor

**Çözüm:**
1. Railway otomatik olarak port atar
2. `PORT` environment variable'ını kaldırın veya Railway'in atadığı port'u kullanın
3. `process.env.PORT` kullanın

### Memory Limit

**Hata:** Memory limit aşıldı

**Çözüm:**
1. Railway plan'ınızı yükseltin
2. Memory kullanımını optimize edin
3. Gereksiz verileri temizleyin

## 🔄 Auto-Deploy

Railway otomatik olarak:
- GitHub push'larında deploy eder
- Build hatalarında bildirim gönderir
- Deployment başarısız olursa önceki versiyona geri döner

## 📚 Kaynaklar

- [Railway Docs](https://docs.railway.app)
- [Railway Pricing](https://railway.app/pricing)
- [Socket.io Deployment](https://socket.io/docs/v4/deployment/)

## 🎯 Best Practices

1. **Environment Variables**: Hassas bilgileri environment variables'da saklayın
2. **Logging**: Önemli event'leri loglayın
3. **Error Handling**: Hataları yakalayın ve loglayın
4. **Monitoring**: Railway metrics'i düzenli kontrol edin
5. **Backup**: Önemli verileri yedekleyin (Supabase kullanıyorsanız otomatik)
