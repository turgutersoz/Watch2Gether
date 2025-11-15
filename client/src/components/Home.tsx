import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { Users, Video, Sparkles, User } from 'lucide-react';

interface User {
  username: string;
  email: string;
  isAuthenticated: boolean;
}

interface HomeProps {
  onJoinRoom: (roomId: string, username: string, password?: string) => void;
  onShowAuth?: () => void;
  user?: User | null;
}

function Home({ onJoinRoom, onShowAuth, user }: HomeProps) {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // URL'den roomId'yi oku ve kullanıcı bilgilerini yükle
  useEffect(() => {
    const path = window.location.pathname.replace('/', '').trim().toUpperCase();
    if (path) {
      setRoomId(path);
    }
    // Giriş yapılmış kullanıcının adını otomatik doldur
    if (user?.username) {
      setUsername(user.username);
    } else {
      // Giriş yapılmamışsa localStorage'dan al
      const savedUsername = localStorage.getItem('watchTogether_username');
      if (savedUsername) {
        setUsername(savedUsername);
      }
    }
  }, [user]);

  const handleCreateRoom = () => {
    if (!username.trim()) {
      alert('Lütfen bir kullanıcı adı girin!');
      return;
    }
    setIsCreating(true);
    // Oda ID'si socket.io tarafından oluşturulacak
    onJoinRoom('', username, password);
  };

  const handleJoinRoom = () => {
    if (!username.trim()) {
      alert('Lütfen kullanıcı adı girin!');
      return;
    }
    if (!roomId.trim()) {
      alert('Lütfen oda ID\'si girin!');
      return;
    }
    if (roomId.trim().length < 3) {
      alert('Oda ID en az 3 karakter olmalıdır!');
      return;
    }
    onJoinRoom(roomId.trim().toUpperCase(), username, roomPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Giriş/Kayıt Butonu */}
      {onShowAuth && (
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={onShowAuth}
            className="glass rounded-lg px-4 py-2 text-white hover:bg-white/20 transition-all flex items-center gap-2"
          >
            {user ? (
              <>
                <User className="w-4 h-4" />
                {user.username}
              </>
            ) : (
              <>
                <User className="w-4 h-4" />
                Giriş Yap / Kayıt Ol
              </>
            )}
          </button>
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-dark rounded-2xl p-8 md:p-12 max-w-md w-full shadow-2xl"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-block mb-4"
          >
            <Video className="w-16 h-16 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Watch Together
          </h1>
          <p className="text-gray-300 text-sm">
            Arkadaşlarınızla senkronize video izleyin
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Kullanıcı Adınız
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="İsminizi girin"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && username.trim()) {
                  if (roomId.trim()) {
                    handleJoinRoom();
                  } else {
                    handleCreateRoom();
                  }
                }
              }}
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Oda ID (Boş bırakırsanız yeni oda oluşturulur)
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => {
                setRoomId(e.target.value.toUpperCase());
                setShowPasswordInput(e.target.value.trim().length > 0);
              }}
              placeholder="Oda ID girin veya boş bırakın"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all uppercase"
              maxLength={8}
            />
          </div>

          {showPasswordInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label className="block text-white text-sm font-medium mb-2">
                Oda Şifresi (Varsa)
              </label>
              <input
                type="password"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="Oda şifresini girin"
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </motion.div>
          )}

          <div>
            <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
              <input
                type="checkbox"
                checked={showCreatePassword}
                onChange={(e) => {
                  setShowCreatePassword(e.target.checked);
                  if (!e.target.checked) {
                    setPassword('');
                  }
                }}
                className="w-4 h-4 rounded"
              />
              Odayı şifre ile koru
            </label>
            {showCreatePassword && (
              <motion.input
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Oda şifresi belirleyin"
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all mt-2"
              />
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateRoom}
              disabled={isCreating}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Yeni Oda Oluştur
            </motion.button>

            {roomId && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleJoinRoom}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Users className="w-5 h-5" />
                Odaya Katıl
              </motion.button>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-gray-400 text-xs text-center">
            YouTube, Twitch ve direkt video linklerini destekler
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default memo(Home);

