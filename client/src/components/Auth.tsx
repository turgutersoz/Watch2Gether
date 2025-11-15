import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, Mail, Lock, User, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface AuthProps {
  onLogin: (username: string, email: string) => void;
  onRegister: (username: string, email: string, password: string) => void;
  onSkip: () => void;
}

function Auth({ onLogin, onRegister, onSkip }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user: authUser } = useAuth();

  // Supabase yoksa fallback moda geç
  const isSupabaseAvailable = !!supabase;

  // localStorage'dan kayıtlı kullanıcı bilgilerini yükle (fallback için)
  useEffect(() => {
    if (!isSupabaseAvailable) {
      const savedEmail = localStorage.getItem('watchTogether_email');
      const savedUsername = localStorage.getItem('watchTogether_username');
      if (savedEmail) setEmail(savedEmail);
      if (savedUsername) setUsername(savedUsername);
    }
  }, [isSupabaseAvailable]);

  // Auth user değiştiğinde callback'i çağır
  useEffect(() => {
    if (authUser && isSupabaseAvailable) {
      onLogin(authUser.username, authUser.email);
    }
  }, [authUser, isSupabaseAvailable, onLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSupabaseAvailable) {
        // Supabase Auth kullan
        if (isLogin) {
          // Giriş yap
          if (!email.trim() || !password.trim()) {
            toast.error('Lütfen e-posta ve şifre girin!');
            setLoading(false);
            return;
          }

          const { error } = await signIn(email.trim(), password);
          if (error) {
            setLoading(false);
            return;
          }
          // Başarılı giriş useAuth hook'u tarafından handle edilecek
        } else {
          // Kayıt ol
          if (!username.trim() || !email.trim() || !password.trim()) {
            toast.error('Lütfen tüm alanları doldurun!');
            setLoading(false);
            return;
          }
          if (username.trim().length < 3) {
            toast.error('Kullanıcı adı en az 3 karakter olmalıdır!');
            setLoading(false);
            return;
          }
          if (password.length < 6) {
            toast.error('Şifre en az 6 karakter olmalıdır!');
            setLoading(false);
            return;
          }
          if (password !== confirmPassword) {
            toast.error('Şifreler eşleşmiyor!');
            setLoading(false);
            return;
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            toast.error('Geçerli bir e-posta adresi girin!');
            setLoading(false);
            return;
          }

          const { error } = await signUp(email.trim(), password, username.trim());
          if (error) {
            setLoading(false);
            return;
          }
          toast.success('Kayıt başarılı! E-posta adresinize gönderilen linki kontrol edin.');
        }
      } else {
        // Fallback: Basit localStorage auth
        if (isLogin) {
          if (!username.trim() || !email.trim()) {
            toast.error('Lütfen kullanıcı adı ve e-posta girin!');
            setLoading(false);
            return;
          }
          onLogin(username.trim(), email.trim());
        } else {
          if (!username.trim() || !email.trim() || !password.trim()) {
            toast.error('Lütfen tüm alanları doldurun!');
            setLoading(false);
            return;
          }
          if (username.trim().length < 3) {
            toast.error('Kullanıcı adı en az 3 karakter olmalıdır!');
            setLoading(false);
            return;
          }
          if (password.length < 6) {
            toast.error('Şifre en az 6 karakter olmalıdır!');
            setLoading(false);
            return;
          }
          if (password !== confirmPassword) {
            toast.error('Şifreler eşleşmiyor!');
            setLoading(false);
            return;
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            toast.error('Geçerli bir e-posta adresi girin!');
            setLoading(false);
            return;
          }
          onRegister(username.trim(), email.trim(), password);
        }
      }
    } catch (error: any) {
      console.error('Auth hatası:', error);
      toast.error(error.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-dark rounded-2xl p-8 w-full max-w-md shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
          </h1>
          <p className="text-gray-300">
            {isLogin
              ? 'Hesabınıza giriş yapın'
              : 'Yeni hesap oluşturun'}
          </p>
          {!isSupabaseAvailable && (
            <p className="text-yellow-400 text-xs mt-2">
              ⚠️ Supabase yapılandırılmamış - Basit mod aktif
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Kullanıcı Adı (Kayıt için) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  placeholder="Kullanıcı adınız"
                  required={!isLogin}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* E-posta */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              E-posta
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="ornek@email.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Şifre */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Şifre
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder={isLogin ? "Şifreniz" : "En az 6 karakter"}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Şifre Tekrar (Kayıt için) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Şifre Tekrar
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  placeholder="Şifrenizi tekrar girin"
                  required={!isLogin}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                {isLogin ? 'Giriş yapılıyor...' : 'Kayıt olunuyor...'}
              </>
            ) : isLogin ? (
              <>
                <LogIn className="w-5 h-5" />
                Giriş Yap
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Kayıt Ol
              </>
            )}
          </button>
        </form>

        {/* Toggle Login/Register */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setPassword('');
              setConfirmPassword('');
            }}
            disabled={loading}
            className="text-purple-400 hover:text-purple-300 transition-colors text-sm disabled:opacity-50"
          >
            {isLogin
              ? 'Hesabınız yok mu? Kayıt olun'
              : 'Zaten hesabınız var mı? Giriş yapın'}
          </button>
        </div>

        {/* Skip Button */}
        <div className="mt-4 text-center">
          <button
            onClick={onSkip}
            disabled={loading}
            className="text-gray-400 hover:text-gray-300 transition-colors text-sm disabled:opacity-50"
          >
            Şimdilik atla (Misafir olarak devam et)
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default memo(Auth);
