# Supabase Auth Entegrasyon Rehberi

## ✅ Tamamlanan Özellikler

1. **Supabase Auth Client** - `client/src/lib/supabase.ts`
2. **useAuth Hook** - `client/src/hooks/useAuth.ts`
3. **Auth Component** - Supabase Auth desteği + Fallback mod
4. **App.tsx Entegrasyonu** - Auth state yönetimi
5. **Otomatik Profil Oluşturma** - Yeni kullanıcı kaydında
6. **Session Yönetimi** - Otomatik token refresh
7. **Profil Güncelleme** - Avatar, durum, kullanıcı adı

## 📋 Kurulum Adımları

### 1. Supabase Projesi Oluştur

1. https://supabase.com adresine gidin
2. Yeni proje oluşturun
3. **Project Settings > API** bölümünden:
   - `SUPABASE_URL` (örn: `https://xxxxx.supabase.co`)
   - `SUPABASE_ANON_KEY` (anon/public key)

### 2. Environment Variables

`client/.env.local` dosyası oluşturun:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Not:** Bu dosya yoksa veya boşsa, uygulama localStorage fallback modunda çalışır.

### 3. Supabase Schema

Supabase SQL Editor'de aşağıdaki SQL'i çalıştırın:

```sql
-- Kullanıcılar tablosu (Auth ile entegre)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  color TEXT,
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'away', 'busy')),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index'ler (performans için)
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi profillerini görebilir ve güncelleyebilir
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Herkes kullanıcı adlarını görebilir (chat için)
CREATE POLICY "Users can view usernames"
  ON users FOR SELECT
  USING (true);

-- Trigger: updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Yeni kullanıcı kaydında profil oluştur
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, email, color)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    -- Rastgele renk oluştur
    '#' || LPAD(TO_HEX((random() * 16777215)::int), 6, '0')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### 4. Supabase Auth Ayarları

**Authentication > Settings** bölümünde:

1. **Site URL**: 
   - Development: `http://localhost:5173`
   - Production: `https://your-vercel-app.vercel.app`

2. **Redirect URLs**: 
   - `http://localhost:5173/**`
   - `https://your-vercel-app.vercel.app/**`

3. **Email Templates**: İstediğiniz gibi özelleştirin

4. **Auth Providers**: 
   - Email/Password: Aktif
   - (Opsiyonel) Google, GitHub, vb. ekleyebilirsiniz

5. **Email Confirmation**: 
   - Development: Kapalı (hızlı test için)
   - Production: Açık (güvenlik için)

### 5. Paket Kurulumu

```bash
cd client
npm install @supabase/supabase-js
```

## 🔧 Kullanım

### Auth Component

Auth component otomatik olarak:
- Supabase varsa → Supabase Auth kullanır
- Supabase yoksa → localStorage fallback kullanır

### useAuth Hook

```typescript
import { useAuth } from '../hooks/useAuth';

const { 
  user,           // Kullanıcı bilgileri
  session,        // Supabase session
  loading,        // Yükleniyor mu?
  signIn,         // Giriş yap
  signUp,          // Kayıt ol
  signOut,        // Çıkış yap
  updateProfile   // Profil güncelle
} = useAuth();
```

### Örnek Kullanım

```typescript
// Giriş yap
await signIn('user@example.com', 'password123');

// Kayıt ol
await signUp('user@example.com', 'password123', 'username');

// Profil güncelle
await updateProfile({
  username: 'yeni_kullanici_adi',
  avatar: 'https://example.com/avatar.jpg',
  status: 'away'
});

// Çıkış yap
await signOut();
```

## 🔒 Güvenlik

### Row Level Security (RLS)

- Kullanıcılar sadece kendi profillerini görebilir ve güncelleyebilir
- Herkes kullanıcı adlarını görebilir (chat için gerekli)
- Admin rolleri için özel politikalar eklenebilir

### JWT Tokens

- Supabase otomatik JWT token yönetimi yapar
- Tokens otomatik olarak refresh edilir
- Tokens localStorage'da güvenli bir şekilde saklanır

### Password Hashing

- Supabase otomatik olarak şifreleri hash'ler
- Şifreler asla düz metin olarak saklanmaz
- Bcrypt algoritması kullanılır

## 📝 Özellikler

### ✅ Tamamlanan

- [x] Supabase Auth entegrasyonu
- [x] useAuth hook
- [x] Otomatik profil oluşturma
- [x] Session yönetimi
- [x] Fallback mod (Supabase yoksa)
- [x] Profil güncelleme
- [x] Otomatik token refresh
- [x] Auth state senkronizasyonu

### 🚀 İleri Seviye Özellikler (Opsiyonel)

- [ ] Email doğrulama
- [ ] Şifre sıfırlama
- [ ] Social login (Google, GitHub, vb.)
- [ ] 2FA (Two-Factor Authentication)
- [ ] OAuth providers
- [ ] Magic link authentication

## 🐛 Sorun Giderme

### "Supabase yapılandırılmamış" Uyarısı

**Çözüm:**
1. `.env.local` dosyasının `client/` klasöründe olduğundan emin olun
2. Environment variables'ın `VITE_` ile başladığından emin olun
3. Vite dev server'ı yeniden başlatın (`npm run dev`)

**Not:** Bu uyarı normaldir ve fallback mod aktif olur.

### "Table doesn't exist" Hatası

**Çözüm:**
1. Supabase SQL Editor'de schema'yı çalıştırdığınızdan emin olun
2. RLS politikalarının doğru ayarlandığından emin olun
3. Trigger'ların oluşturulduğundan emin olun

### Auth State Güncellenmiyor

**Çözüm:**
1. `useAuth` hook'unun doğru kullanıldığından emin olun
2. Browser console'da hata olup olmadığını kontrol edin
3. Supabase dashboard'da kullanıcının oluşturulduğunu kontrol edin

### "Email already registered" Hatası

**Çözüm:**
1. Supabase dashboard'da kullanıcıyı kontrol edin
2. Eğer kullanıcı varsa, giriş yapmayı deneyin
3. Kullanıcıyı silmek isterseniz, Supabase dashboard'dan silebilirsiniz

## 📚 Kaynaklar

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)

## 🔄 Migration (LocalStorage'dan Supabase'e)

Mevcut localStorage kullanıcıları Supabase'e geçirmek için:

1. Kullanıcıdan giriş yapmasını isteyin
2. Eski localStorage verilerini temizleyin
3. Yeni Supabase session'ı kullanın

Fallback mod sayesinde, Supabase yoksa eski sistem çalışmaya devam eder.
