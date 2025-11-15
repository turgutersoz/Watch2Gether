import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, User, UserX, VolumeX, Volume2, Crown, Trash2, UserCheck } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface UserItem {
  id: string;
  username: string;
  isHost?: boolean;
  avatar?: string;
  color?: string;
  status?: 'online' | 'away' | 'busy';
  role?: 'host' | 'moderator' | 'admin' | 'user';
}

interface UserListProps {
  users: UserItem[];
  currentUsername: string;
  currentUserId: string;
  isHost: boolean;
  onKickUser: (userId: string) => void;
  onToggleMute: (userId: string) => void;
  onTransferHost: (userId: string) => void;
  onDeleteRoom: () => void;
}

function UserList({ 
  users, 
  currentUsername, 
  currentUserId,
  isHost,
  onKickUser,
  onToggleMute,
  onTransferHost,
  onDeleteRoom
}: UserListProps) {
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const handleDeleteRoom = () => {
    if (window.confirm('Odayı silmek istediğinize emin misiniz? Tüm kullanıcılar odadan çıkacak.')) {
      onDeleteRoom();
    }
  };

  // Menü dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const menuElement = document.querySelector('[data-user-menu]');
      const clickedButton = Array.from(buttonRefs.current.values()).some(btn => btn.contains(target));
      
      if (menuElement && !menuElement.contains(target) && !clickedButton) {
        setShowMenu(null);
        setMenuPosition(null);
      }
    };

    if (showMenu) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMenu]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-dark rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
          <Users className="w-5 h-5 text-white" />
          <h3 className="text-white font-semibold">Kullanıcılar</h3>
          <span className="ml-auto text-white/60 text-sm">
            {users.length} kişi
          </span>
        </div>

        {isHost && (
          <div className="mb-4 pb-4 border-b border-white/10">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDeleteRoom}
              className="w-full px-4 py-2 bg-red-600/50 hover:bg-red-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Odayı Sil
            </motion.button>
          </div>
        )}

        <div className="space-y-2">
          {users.length === 0 ? (
            <div className="text-center text-white/40 py-4">
              <p>Henüz kimse yok</p>
            </div>
          ) : (
            users.map((user, index) => {
              const isOwn = user.id === currentUserId;
              const isUserHost = user.isHost;
              
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-3 p-2 rounded-lg relative ${
                    isOwn ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30' : 'glass'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                        isUserHost 
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                          : ''
                      }`}
                      style={{ 
                        backgroundColor: user.avatar ? 'transparent' : (user.color || (isOwn ? '#8B5CF6' : '#3B82F6')),
                        backgroundImage: user.avatar ? `url(${user.avatar})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      {!user.avatar && (
                        isUserHost ? (
                          <Crown className="w-5 h-5 text-white" />
                        ) : (
                          <span>{user.username.charAt(0).toUpperCase()}</span>
                        )
                      )}
                    </div>
                    {/* Status indicator */}
                    {user.status && (
                      <div 
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
                          user.status === 'online' ? 'bg-green-500' :
                          user.status === 'away' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        title={user.status === 'online' ? 'Çevrimiçi' : user.status === 'away' ? 'Uzakta' : 'Meşgul'}
                      />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium flex items-center gap-2">
                      <span className="truncate">{user.username}</span>
                      {isUserHost && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded flex-shrink-0">Host</span>
                      )}
                      {user.role === 'moderator' && (
                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded flex-shrink-0">Mod</span>
                      )}
                      {isOwn && (
                        <span className="text-xs text-purple-300 flex-shrink-0">(Siz)</span>
                      )}
                    </div>
                  </div>
                  
                  {isHost && !isOwn && (
                    <div className="relative">
                      <motion.button
                        ref={(el) => {
                          if (el) buttonRefs.current.set(user.id, el);
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const button = e.currentTarget;
                          const rect = button.getBoundingClientRect();
                          if (showMenu === user.id) {
                            setShowMenu(null);
                            setMenuPosition(null);
                          } else {
                            setShowMenu(user.id);
                            setMenuPosition({
                              top: rect.bottom + 8,
                              right: window.innerWidth - rect.right
                            });
                          }
                        }}
                        className="p-1 text-white/60 hover:text-white transition-all relative"
                      >
                        <User className="w-4 h-4" />
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Portal ile menüyü body'ye render et */}
      {showMenu && menuPosition && createPortal(
        <AnimatePresence mode="wait">
          <motion.div
            key={showMenu}
            data-user-menu
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed glass-dark rounded-lg p-2 space-y-1 min-w-[150px] shadow-2xl border border-white/20 backdrop-blur-xl bg-black/90"
            style={{ 
              zIndex: 99999,
              top: `${menuPosition.top}px`,
              right: `${menuPosition.right}px`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {users.find(u => u.id === showMenu) && (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onToggleMute(showMenu);
                    setShowMenu(null);
                    setMenuPosition(null);
                  }}
                  className="w-full px-3 py-1.5 text-left text-white text-sm hover:bg-white/10 rounded flex items-center gap-2"
                >
                  <VolumeX className="w-4 h-4" />
                  Chat Engelle/Aç
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (window.confirm(`${users.find(u => u.id === showMenu)?.username} kullanıcısına sahiplik devretmek istediğinize emin misiniz?`)) {
                      onTransferHost(showMenu);
                    }
                    setShowMenu(null);
                    setMenuPosition(null);
                  }}
                  className="w-full px-3 py-1.5 text-left text-white text-sm hover:bg-white/10 rounded flex items-center gap-2"
                >
                  <Crown className="w-4 h-4" />
                  Sahiplik Devret
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (window.confirm(`${users.find(u => u.id === showMenu)?.username} kullanıcısını odadan atmak istediğinize emin misiniz?`)) {
                      onKickUser(showMenu);
                    }
                    setShowMenu(null);
                    setMenuPosition(null);
                  }}
                  className="w-full px-3 py-1.5 text-left text-red-400 text-sm hover:bg-red-500/20 rounded flex items-center gap-2"
                >
                  <UserX className="w-4 h-4" />
                  Odadan At
                </motion.button>
              </>
            )}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

export default memo(UserList);
