import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Send, MessageSquare, Smile } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { saveChatMessages, getChatMessages } from '../utils/indexedDB';

// react-window'u dynamic import ile yükle (Vite uyumluluğu için)
let FixedSizeListComponent: any = null;
let isReactWindowLoaded = false;

const loadReactWindow = async () => {
  if (!isReactWindowLoaded) {
    try {
      // react-window'u dynamic import ile yükle
      const reactWindow = await import('react-window');
      // react-window'un export yapısını kontrol et
      if (reactWindow && typeof reactWindow === 'object') {
        // Named export olarak dene
        if ('FixedSizeList' in reactWindow) {
          FixedSizeListComponent = (reactWindow as any).FixedSizeList;
          isReactWindowLoaded = true;
        } else {
          // Default export olarak dene
          FixedSizeListComponent = (reactWindow as any).default?.FixedSizeList || (reactWindow as any).default;
          if (FixedSizeListComponent) {
            isReactWindowLoaded = true;
          }
        }
      }
      if (!isReactWindowLoaded) {
        console.warn('react-window FixedSizeList bulunamadı, normal scroll kullanılacak');
      }
    } catch (error) {
      console.warn('react-window yüklenemedi, normal scroll kullanılacak:', error);
    }
  }
  return FixedSizeListComponent;
};

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  color?: string;
  message: string;
  timestamp: number;
}

interface ChatProps {
  messages: ChatMessage[];
  currentUsername: string;
  onSendMessage: (message: string) => void;
  isMuted?: boolean;
  roomId?: string; // IndexedDB için
}

function Chat({ messages, currentUsername, onSendMessage, isMuted = false, roomId }: ChatProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [useVirtualScroll, setUseVirtualScroll] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const roomIdRef = useRef<string>('');

  // IndexedDB'den cache'lenmiş mesajları yükle
  useEffect(() => {
    if (roomId && roomId !== roomIdRef.current) {
      roomIdRef.current = roomId;
      getChatMessages(roomId).then((cachedMessages) => {
        if (cachedMessages && cachedMessages.length > 0 && messages.length === 0) {
          // Cache'den mesajları yükle (sadece mesaj yoksa)
          // Bu kısım Room component'inden gelen messages prop'u ile birleştirilebilir
        }
      });
    }
  }, [roomId, messages.length]);

  // Mesajları IndexedDB'ye kaydet (debounce ile)
  useEffect(() => {
    if (messages.length > 0 && roomId) {
      const timeout = setTimeout(() => {
        saveChatMessages(roomId, messages);
      }, 2000); // 2 saniye bekle, sonra kaydet
      return () => clearTimeout(timeout);
    }
  }, [messages, roomId]);

  // Son mesajlara scroll et (sadece yeni mesaj geldiğinde)
  useEffect(() => {
    if (messages.length > 0) {
      const timeout = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [messages.length]);

  const handleSend = useCallback(() => {
    if (inputMessage.trim() && !isMuted) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
      setShowEmojiPicker(false);
    }
  }, [inputMessage, onSendMessage, isMuted]);

  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }, []);

  const handleEmojiSelect = useCallback((emoji: any) => {
    setInputMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  }, []);

  // Memoize edilmiş mesaj listesi (performans için)
  // Benzersiz mesajları filtrele (duplicate önleme)
  const renderedMessages = useMemo(() => {
    // Son 500 mesajı göster (performans optimizasyonu için)
    const limitedMessages = messages.slice(-500);
    
    // Benzersiz mesajları filtrele (id + timestamp kombinasyonu ile)
    const uniqueMessages = limitedMessages.filter((msg, index, self) => 
      index === self.findIndex(m => m.id === msg.id && m.timestamp === msg.timestamp)
    );
    
    return uniqueMessages;
  }, [messages]);

  // react-window'u yükle (sadece bir kez, 50+ mesaj varsa)
  useEffect(() => {
    if (renderedMessages.length > 50 && !isReactWindowLoaded) {
      loadReactWindow().then((Component) => {
        if (Component) {
          setUseVirtualScroll(true);
        }
      });
    }
  }, [renderedMessages.length]);

  // Virtual scrolling için mesaj render fonksiyonu
  const MessageRow = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const message = renderedMessages[index];
    if (!message) return null;

    const isOwn = message.username === currentUsername;
    const uniqueKey = `${message.id}-${message.timestamp}`;
    const userColor = message.color || '#8B5CF6';
    const userInitial = message.username.charAt(0).toUpperCase();

    return (
      <div style={style} key={uniqueKey}>
        <div className={`flex gap-2 px-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
          {/* Avatar */}
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
            style={{ 
              backgroundColor: message.avatar ? 'transparent' : userColor,
              backgroundImage: message.avatar ? `url(${message.avatar})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {!message.avatar && userInitial}
          </div>
          
          {/* Message */}
          <div className={`flex-1 ${isOwn ? 'text-right' : ''}`}>
            <div
              className={`inline-block max-w-[80%] rounded-lg p-3 ${
                isOwn
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'glass text-white'
              }`}
            >
              {!isOwn && (
                <div 
                  className="text-xs font-semibold mb-1 opacity-80"
                  style={{ color: userColor }}
                >
                  {message.username}
                </div>
              )}
              <div className="text-sm whitespace-pre-wrap break-words">{message.message}</div>
              <div className="text-xs opacity-60 mt-1">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [renderedMessages, currentUsername, formatTime]);

  return (
    <div className="glass-dark rounded-xl p-4 h-[600px] flex flex-col relative">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
        <MessageSquare className="w-5 h-5 text-white" />
        <h3 className="text-white font-semibold">Sohbet</h3>
        <span className="ml-auto text-white/60 text-sm">
          {messages.length} mesaj
        </span>
      </div>

      <div 
        ref={chatContainerRef}
        className="flex-1 mb-4 pr-2"
        style={{ height: '500px' }}
      >
        {renderedMessages.length === 0 ? (
          <div className="text-center text-white/40 py-8 h-full flex items-center justify-center">
            <div>
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Henüz mesaj yok. İlk mesajı siz gönderin!</p>
            </div>
          </div>
        ) : renderedMessages.length > 50 && useVirtualScroll && FixedSizeListComponent ? (
          // Virtual scrolling sadece 50+ mesaj varsa ve yüklendiyse kullan
          <FixedSizeListComponent
            height={500}
            itemCount={renderedMessages.length}
            itemSize={100}
            width="100%"
            className="scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-transparent"
          >
            {MessageRow}
          </FixedSizeListComponent>
        ) : (
          // 50'den az mesaj varsa normal scroll kullan
          <div className="space-y-3 overflow-y-auto h-full pr-2">
            {renderedMessages.map((message) => {
              const isOwn = message.username === currentUsername;
              const uniqueKey = `${message.id}-${message.timestamp}`;
              const userColor = message.color || '#8B5CF6';
              const userInitial = message.username.charAt(0).toUpperCase();

              return (
                <div key={uniqueKey} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                    style={{ 
                      backgroundColor: message.avatar ? 'transparent' : userColor,
                      backgroundImage: message.avatar ? `url(${message.avatar})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {!message.avatar && userInitial}
                  </div>
                  <div className={`flex-1 ${isOwn ? 'text-right' : ''}`}>
                    <div
                      className={`inline-block max-w-[80%] rounded-lg p-3 ${
                        isOwn
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : 'glass text-white'
                      }`}
                    >
                      {!isOwn && (
                        <div 
                          className="text-xs font-semibold mb-1 opacity-80"
                          style={{ color: userColor }}
                        >
                          {message.username}
                        </div>
                      )}
                      <div className="text-sm whitespace-pre-wrap break-words">{message.message}</div>
                      <div className="text-xs opacity-60 mt-1">
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 relative">
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={isMuted}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Smile className="w-5 h-5" />
          </button>
          
          {showEmojiPicker && (
            <div className="absolute bottom-12 left-0 z-50">
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="dark"
                previewPosition="none"
                skinTonePosition="none"
              />
            </div>
          )}
        </div>
        
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !isMuted) {
              handleSend();
            }
          }}
          placeholder={isMuted ? "Chat yazma yetkiniz yok!" : "Mesajınızı yazın..."}
          disabled={isMuted}
          className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleSend}
          disabled={isMuted}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default memo(Chat);
