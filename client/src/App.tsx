import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Monitor } from 'lucide-react';
import Home from './components/Home';
import Room from './components/Room';
import Auth from './components/Auth';
import ToastProvider from './components/ToastProvider';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabase';
import toast from 'react-hot-toast';

interface User {
  username: string;
  email: string;
  isAuthenticated: boolean;
  id?: string;
  avatar?: string;
  color?: string;
  status?: 'online' | 'away' | 'busy';
  role?: string;
}

function App() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const { theme, changeTheme, resolvedTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  
  // Supabase Auth hook
  const { user: authUser, loading: authLoading, signOut } = useAuth();
  const isSupabaseAvailable = !!supabase;

  // Auth user değiştiğinde local user state'ini güncelle
  useEffect(() => {
    if (isSupabaseAvailable && authUser) {
      setUser({
        username: authUser.username,
        email: authUser.email,
        isAuthenticated: true,
        id: authUser.id,
        avatar: authUser.avatar,
        color: authUser.color,
        status: authUser.status,
        role: authUser.role
      });
      setUsername(authUser.username);
    } else if (!isSupabaseAvailable) {
      // Fallback: localStorage'dan yükle
      const savedUser = localStorage.getItem('watchTogether_user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setUsername(userData.username);
        } catch (e) {
          console.error('Kullanıcı bilgisi yüklenemedi:', e);
        }
      }
    }
  }, [authUser, isSupabaseAvailable]);

  // URL'den roomId'yi oku
  useEffect(() => {
    const path = window.location.pathname.replace('/', '').trim().toUpperCase();
    if (path) {
      // URL'de roomId varsa, kullanıcıdan isim iste ve odaya katıl
      const savedUsername = localStorage.getItem('watchTogether_username');
      if (savedUsername) {
        setUsername(savedUsername);
        setRoomId(path);
      }
    }
  }, []);

  // Bildirim izni iste
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Bildirim izni verildi');
        }
      });
    }
  }, []);

  const handleLogin = (username: string, email: string) => {
    // Supabase kullanılıyorsa, useAuth hook'u otomatik handle ediyor
    if (!isSupabaseAvailable) {
      // Fallback: localStorage
      const userData: User = {
        username,
        email,
        isAuthenticated: true
      };
      setUser(userData);
      setUsername(username);
      localStorage.setItem('watchTogether_user', JSON.stringify(userData));
      localStorage.setItem('watchTogether_username', username);
      localStorage.setItem('watchTogether_email', email);
    }
    setShowAuth(false);
  };

  const handleRegister = (username: string, email: string, password: string) => {
    // Supabase kullanılıyorsa, useAuth hook'u otomatik handle ediyor
    if (!isSupabaseAvailable) {
      // Fallback: localStorage
      const userData: User = {
        username,
        email,
        isAuthenticated: true
      };
      setUser(userData);
      setUsername(username);
      localStorage.setItem('watchTogether_user', JSON.stringify(userData));
      localStorage.setItem('watchTogether_username', username);
      localStorage.setItem('watchTogether_email', email);
      localStorage.setItem('watchTogether_password', btoa(password));
    }
    setShowAuth(false);
  };

  const handleLogout = async () => {
    if (isSupabaseAvailable && signOut) {
      await signOut();
    } else {
      // Fallback: localStorage temizle
      setUser(null);
      setUsername('');
      localStorage.removeItem('watchTogether_user');
      localStorage.removeItem('watchTogether_username');
      localStorage.removeItem('watchTogether_email');
      localStorage.removeItem('watchTogether_password');
      toast.success('Çıkış yapıldı');
    }
  };

  const handleJoinRoom = (id: string, name: string, password?: string) => {
    // Kullanıcı adını localStorage'a kaydet
    localStorage.setItem('watchTogether_username', name);
    setRoomId(id || '');
    setUsername(name);
    // Password'ü geçici olarak sakla (socket bağlantısı için)
    if (password) {
      sessionStorage.setItem('room_password', password);
      // Eğer yeni oda oluşturuluyorsa, şifreyi sakla (link kopyalama için)
      if (!id) {
        sessionStorage.setItem('created_room_password', password);
      }
    }
    // Eğer yeni oda oluşturulduysa, URL'yi güncelleme useSocket içinde yapılacak
    if (id) {
      window.history.pushState({}, '', `/${id}`);
    }
  };

  const handleLeaveRoom = () => {
    setRoomId(null);
    setUsername('');
    window.history.pushState({}, '', '/');
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${
      resolvedTheme === 'dark' 
        ? 'from-purple-900 via-blue-900 to-indigo-900' 
        : 'from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      <ToastProvider />
      
      {/* Tema Toggle Button */}
      <div className="fixed top-4 right-4 z-50">
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className={`glass rounded-full p-3 text-white shadow-lg transition-all ${
              resolvedTheme === 'light' ? 'text-gray-800' : 'text-white'
            }`}
            title="Tema Değiştir"
          >
            {resolvedTheme === 'dark' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </motion.button>

          {showThemeMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 mt-2 glass-dark rounded-lg p-2 min-w-[150px] shadow-xl"
            >
              <button
                onClick={() => {
                  changeTheme('light');
                  setShowThemeMenu(false);
                }}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                  theme === 'light'
                    ? 'bg-purple-600 text-white'
                    : resolvedTheme === 'light'
                    ? 'text-gray-800 hover:bg-white/20'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <Sun className="w-4 h-4" />
                Aydınlık
              </button>
              <button
                onClick={() => {
                  changeTheme('dark');
                  setShowThemeMenu(false);
                }}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 mt-1 ${
                  theme === 'dark'
                    ? 'bg-purple-600 text-white'
                    : resolvedTheme === 'dark'
                    ? 'text-white hover:bg-white/20'
                    : 'text-gray-800 hover:bg-white/20'
                }`}
              >
                <Moon className="w-4 h-4" />
                Karanlık
              </button>
              <button
                onClick={() => {
                  changeTheme('auto');
                  setShowThemeMenu(false);
                }}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 mt-1 ${
                  theme === 'auto'
                    ? 'bg-purple-600 text-white'
                    : resolvedTheme === 'dark'
                    ? 'text-white hover:bg-white/20'
                    : 'text-gray-800 hover:bg-white/20'
                }`}
              >
                <Monitor className="w-4 h-4" />
                Sistem
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Menü dışına tıklandığında kapat */}
      {showThemeMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowThemeMenu(false)}
        />
      )}

      {showAuth ? (
        <Auth
          onLogin={handleLogin}
          onRegister={handleRegister}
          onSkip={() => {
            setShowAuth(false);
            toast.info('Misafir olarak devam ediyorsunuz');
          }}
        />
      ) : roomId !== null ? (
        <Room 
          roomId={roomId} 
          username={username} 
          onLeave={handleLeaveRoom}
          user={user}
          onLogout={handleLogout}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Home 
            onJoinRoom={handleJoinRoom}
            onShowAuth={() => setShowAuth(true)}
            user={user}
          />
        </motion.div>
      )}
    </div>
  );
}

export default App;

