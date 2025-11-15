import { useEffect, useRef, useCallback, useState, memo } from 'react';
import ReactPlayer from 'react-player';
import { motion } from 'framer-motion';
import { Maximize, Minimize, Monitor, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Settings } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  isPlaying: boolean;
  currentTime: number;
  volume?: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onTimeUpdate: (time: number) => void;
  onVolumeChange?: (volume: number) => void;
  screenShareStream?: MediaStream | null;
  remoteScreenStreams?: Map<string, MediaStream>;
}

function VideoPlayer({
  url,
  isPlaying,
  currentTime,
  volume = 1.0,
  onPlay,
  onPause,
  onSeek,
  onTimeUpdate,
  onVolumeChange,
  screenShareStream,
  remoteScreenStreams
}: VideoPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null);
  const isSeekingRef = useRef(false);
  const lastSyncTimeRef = useRef(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastVolumeRef = useRef(volume);
  const lastCheckedVolumeRef = useRef(volume);
  const volumeCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const volumeSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onReadyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeView, setActiveView] = useState<'video' | 'screen'>('video');
  const [showControls, setShowControls] = useState(true); // Başlangıçta göster
  const [localVolume, setLocalVolume] = useState(volume);
  const [duration, setDuration] = useState(0);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>('auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isYouTube, setIsYouTube] = useState(false);
  const screenShareVideoRef = useRef<HTMLVideoElement>(null);
  const remoteScreenShareRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Senkronizasyon için dışarıdan gelen değişiklikleri uygula (daha agresif)
  useEffect(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      if (playerRef.current && !isSeekingRef.current) {
        try {
          const player = playerRef.current;
          const internalTime = player.getCurrentTime();
          
          if (internalTime !== null && internalTime !== undefined && !isNaN(internalTime)) {
            const timeDiff = Math.abs(internalTime - currentTime);

            // Eğer zaman farkı 0.3 saniyeden fazlaysa senkronize et (daha hassas)
            if (timeDiff > 0.3) {
              player.seekTo(currentTime, 'seconds');
              lastSyncTimeRef.current = currentTime;
            }
          }
        } catch (error) {
          // Player henüz hazır değilse sessizce geç
        }
      }
    }, 50); // 50ms throttle - daha hızlı senkronizasyon

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [currentTime]);

  // Local volume'u prop'tan senkronize et
  useEffect(() => {
    setLocalVolume(volume);
  }, [volume]);

  // Volume senkronizasyonu - dışarıdan gelen değişiklikleri uygula
  useEffect(() => {
    if (!playerRef.current) return;

    console.log('[VideoPlayer] Volume prop değişti:', volume);

    // Volume değişikliğini hemen uygula (React Player prop'u otomatik olarak hallediyor)
    // Ama YouTube için ekstra kontrol yapalım
    const applyVolume = () => {
      try {
        const player = playerRef.current;
        if (!player) {
          console.log('[VideoPlayer] Player ref yok');
          return;
        }
        
        const internalPlayer = player.getInternalPlayer();
        
        if (internalPlayer) {
          // YouTube IFrame API için - setVolume 0-100 arası değer alır
          if (internalPlayer.setVolume && typeof internalPlayer.setVolume === 'function') {
            const volumePercent = Math.max(0, Math.min(100, Math.round(volume * 100)));
            console.log('[VideoPlayer] YouTube volume ayarlanıyor:', volumePercent);
            try {
              internalPlayer.setVolume(volumePercent);
              // Mute durumunu kontrol et
              if (volume === 0 && internalPlayer.isMuted && typeof internalPlayer.isMuted === 'function') {
                if (!internalPlayer.isMuted()) {
                  console.log('[VideoPlayer] YouTube mute yapılıyor');
                  internalPlayer.mute();
                }
              } else if (volume > 0 && internalPlayer.isMuted && typeof internalPlayer.isMuted === 'function') {
                if (internalPlayer.isMuted()) {
                  console.log('[VideoPlayer] YouTube unmute yapılıyor');
                  internalPlayer.unMute();
                }
              }
            } catch (e) {
              console.error('[VideoPlayer] YouTube volume ayarlama hatası:', e);
              // YouTube API henüz hazır olmayabilir, tekrar dene
              setTimeout(applyVolume, 200);
            }
          }
          // HTML5 video element için - volume 0-1 arası değer alır
          else if (internalPlayer.volume !== undefined && typeof internalPlayer.volume === 'number') {
            console.log('[VideoPlayer] HTML5 volume ayarlanıyor:', volume);
            internalPlayer.volume = Math.max(0, Math.min(1, volume));
            internalPlayer.muted = volume === 0;
          } else {
            console.log('[VideoPlayer] Internal player bulunamadı veya volume metodu yok');
          }
        } else {
          console.log('[VideoPlayer] Internal player null');
        }
        
        // Ref'i güncelle (senkronizasyondan geldiğini işaretle)
        lastVolumeRef.current = volume;
        lastCheckedVolumeRef.current = volume;
      } catch (error) {
        console.error('[VideoPlayer] Volume ayarlama genel hatası:', error);
      }
    };

    // Hemen uygula
    applyVolume();
    
    // Player hazır olmayabilir, kısa bir gecikme ile tekrar dene
    const timeout = setTimeout(applyVolume, 100);
    const timeout2 = setTimeout(applyVolume, 500);

    return () => {
      clearTimeout(timeout);
      clearTimeout(timeout2);
      if (volumeSyncTimeoutRef.current) {
        clearTimeout(volumeSyncTimeoutRef.current);
        volumeSyncTimeoutRef.current = null;
      }
    };
  }, [volume]);

  // Volume değişikliklerini dinle (sadece kullanıcı kontrollerinden - slider/mute button)
  // Bu useEffect artık sadece UI kontrollerinden gelen değişiklikleri yakalar
  // YouTube player'dan gelen değişiklikleri yakalamaya gerek yok çünkü kontrollerimizi kullanıyoruz

  // Oynatma durumunu senkronize et - React Player'ın playing prop'u otomatik olarak hallediyor
  // Internal player kontrolüne gerek yok, React Player zaten playing prop'unu yönetiyor

  const handlePlay = useCallback(() => {
    // Her zaman bildir - senkronizasyon için
    onPlay();
  }, [onPlay]);

  const handlePause = useCallback(() => {
    // Her zaman bildir - senkronizasyon için
    onPause();
  }, [onPause]);

  const handleSeek = useCallback((seconds: number) => {
    isSeekingRef.current = true;
    onSeek(seconds);
    setTimeout(() => {
      isSeekingRef.current = false;
    }, 500);
  }, [onSeek]);

  const handleProgress = useCallback((state: { playedSeconds: number }) => {
    if (!isSeekingRef.current) {
      const now = Date.now();
      // Her 2 saniyede bir güncelle (spam önleme - daha az sıklık)
      if (now - lastSyncTimeRef.current > 2000) {
        onTimeUpdate(state.playedSeconds);
        lastSyncTimeRef.current = now;
      }
    }
  }, [onTimeUpdate]);

  const handleDuration = useCallback((duration: number) => {
    setDuration(duration);
  }, []);

  const handleSeekBackward = useCallback(() => {
    const newTime = Math.max(0, currentTime - 10);
    onSeek(newTime);
  }, [currentTime, onSeek]);

  const handleSeekForward = useCallback(() => {
    const newTime = Math.min(duration || Infinity, currentTime + 10);
    onSeek(newTime);
  }, [currentTime, duration, onSeek]);

  const formatTime = useCallback((seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // YouTube kalite seçme
  const handleQualityChange = useCallback((quality: string) => {
    if (!playerRef.current || !isYouTube) return;
    
    try {
      const internalPlayer = playerRef.current.getInternalPlayer();
      if (internalPlayer && internalPlayer.setPlaybackQuality && typeof internalPlayer.setPlaybackQuality === 'function') {
        internalPlayer.setPlaybackQuality(quality);
        setCurrentQuality(quality);
        setShowQualityMenu(false);
      }
    } catch (error) {
      console.error('[VideoPlayer] Kalite ayarlama hatası:', error);
    }
  }, [isYouTube]);

  // YouTube kalitelerini al
  useEffect(() => {
    if (!playerRef.current || !isYouTube) return;

    const checkQualities = () => {
      try {
        const internalPlayer = playerRef.current?.getInternalPlayer();
        if (internalPlayer) {
          // YouTube IFrame API - kaliteleri al
          if (internalPlayer.getAvailableQualityLevels && typeof internalPlayer.getAvailableQualityLevels === 'function') {
            const qualities = internalPlayer.getAvailableQualityLevels();
            if (qualities && qualities.length > 0) {
              setAvailableQualities(qualities);
              // Mevcut kaliteyi al
              if (internalPlayer.getPlaybackQuality && typeof internalPlayer.getPlaybackQuality === 'function') {
                const current = internalPlayer.getPlaybackQuality();
                if (current) setCurrentQuality(current);
              }
            }
          }
        }
      } catch (error) {
        // Hata durumunda sessizce geç
      }
    };

    // Player hazır olduğunda kaliteleri kontrol et
    const timeout = setTimeout(checkQualities, 1000);
    const interval = setInterval(checkQualities, 5000); // Her 5 saniyede bir kontrol et

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [isYouTube, url]);

  // URL'den YouTube kontrolü
  useEffect(() => {
    const isYoutubeUrl = url.includes('youtube.com') || url.includes('youtu.be');
    setIsYouTube(isYoutubeUrl);
    if (!isYoutubeUrl) {
      setAvailableQualities([]);
      setCurrentQuality('auto');
    }
  }, [url]);

  // Screen share stream'i video element'e bağla
  useEffect(() => {
    if (screenShareStream && screenShareVideoRef.current) {
      screenShareVideoRef.current.srcObject = screenShareStream;
    } else if (screenShareVideoRef.current && !screenShareStream) {
      screenShareVideoRef.current.srcObject = null;
    }
  }, [screenShareStream]);

  // Remote screen share stream'leri video element'lere bağla
  useEffect(() => {
    if (remoteScreenStreams) {
      remoteScreenStreams.forEach((stream, userId) => {
        const videoElement = remoteScreenShareRefs.current.get(userId);
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      });
    }
  }, [remoteScreenStreams]);

  // Tam ekran yönetimi
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      } else if ((containerRef.current as any).msRequestFullscreen) {
        (containerRef.current as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  }, [isFullscreen]);

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Ekran paylaşımı varsa otomatik olarak göster
  useEffect(() => {
    if (screenShareStream || (remoteScreenStreams && remoteScreenStreams.size > 0)) {
      setActiveView('screen');
    } else if (!url) {
      setActiveView('screen');
    } else {
      setActiveView('video');
    }
  }, [screenShareStream, remoteScreenStreams, url]);

  const hasScreenShare = screenShareStream || (remoteScreenStreams && remoteScreenStreams.size > 0);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full aspect-video glass rounded-xl overflow-hidden"
    >
      {/* View Toggle Buttons */}
      {(url || hasScreenShare) && (
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          {url && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveView('video')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeView === 'video'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-black/50 text-white/70 hover:bg-black/70'
              }`}
            >
              Video
            </motion.button>
          )}
          {hasScreenShare && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveView('screen')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeView === 'screen'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-black/50 text-white/70 hover:bg-black/70'
              }`}
            >
              <Monitor className="w-4 h-4" />
              Ekran
            </motion.button>
          )}
        </div>
      )}

      {/* Fullscreen Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-all"
        title={isFullscreen ? 'Tam ekrandan çık' : 'Tam ekran'}
      >
        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
      </motion.button>

      {/* Video Player */}
      {activeView === 'video' && url && (
        <div 
          className="w-full h-full relative group"
          onMouseMove={() => {
            setShowControls(true);
            if (controlsTimeoutRef.current) {
              clearTimeout(controlsTimeoutRef.current);
            }
            controlsTimeoutRef.current = setTimeout(() => {
              setShowControls(false);
            }, 3000);
          }}
          onMouseLeave={() => {
            if (controlsTimeoutRef.current) {
              clearTimeout(controlsTimeoutRef.current);
            }
            setShowControls(false);
          }}
        >
          <ReactPlayer
            ref={playerRef}
            url={url}
            width="100%"
            height="100%"
            playing={isPlaying}
            volume={volume}
            controls={false}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeek={handleSeek}
            onProgress={handleProgress}
            onDuration={handleDuration}
            onReady={(player) => {
              // Player hazır olduğunda volume'u ayarla
              try {
                const internalPlayer = player.getInternalPlayer();
                if (internalPlayer) {
                  // YouTube IFrame API için
                  if (internalPlayer.setVolume && typeof internalPlayer.setVolume === 'function') {
                    const volumePercent = Math.max(0, Math.min(100, Math.round(volume * 100)));
                    internalPlayer.setVolume(volumePercent);
                    // Mute durumunu ayarla
                    if (volume === 0) {
                      if (internalPlayer.mute && typeof internalPlayer.mute === 'function') {
                        internalPlayer.mute();
                      }
                    } else {
                      if (internalPlayer.unMute && typeof internalPlayer.unMute === 'function') {
                        if (internalPlayer.isMuted && typeof internalPlayer.isMuted === 'function' && internalPlayer.isMuted()) {
                          internalPlayer.unMute();
                        }
                      }
                    }
                    
                    // YouTube kalitelerini al
                    if (isYouTube) {
                      setTimeout(() => {
                        try {
                          if (internalPlayer.getAvailableQualityLevels && typeof internalPlayer.getAvailableQualityLevels === 'function') {
                            const qualities = internalPlayer.getAvailableQualityLevels();
                            if (qualities && qualities.length > 0) {
                              setAvailableQualities(qualities);
                            }
                          }
                          if (internalPlayer.getPlaybackQuality && typeof internalPlayer.getPlaybackQuality === 'function') {
                            const current = internalPlayer.getPlaybackQuality();
                            if (current) setCurrentQuality(current);
                          }
                        } catch (e) {
                          // Hata durumunda sessizce geç
                        }
                      }, 1000);
                    }
                  }
                  // HTML5 video için
                  else if (internalPlayer.volume !== undefined) {
                    internalPlayer.volume = Math.max(0, Math.min(1, volume));
                    internalPlayer.muted = volume === 0;
                  }
                }
                // Ref'leri güncelle
                lastVolumeRef.current = volume;
                lastCheckedVolumeRef.current = volume;
              } catch (error) {
                // Hata durumunda sessizce geç
              }
            }}
            onError={(error) => {
              // Video yükleme hatalarını sessizce yakala
              console.warn('Video oynatma hatası:', error);
            }}
            config={{
              youtube: {
                playerVars: {
                  autoplay: 0,
                  controls: 0, // YouTube kontrollerini devre dışı bırak - kendi kontrollerimizi kullanacağız
                  modestbranding: 1,
                  rel: 0,
                  enablejsapi: 1,
                  iv_load_policy: 3, // Annotations'ı kapat
                },
              },
              twitch: {
                options: {
                  autoplay: false,
                },
              },
              file: {
                attributes: {
                  controlsList: 'nodownload',
                },
              },
            }}
          />
          
          {/* Custom Controls */}
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
            onMouseLeave={() => {
              // Quality menu'yu kapat
              setShowQualityMenu(false);
            }}
          >
            {/* Progress Bar */}
            <div className="mb-2">
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={(e) => {
                  const newTime = parseFloat(e.target.value);
                  onSeek(newTime);
                }}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                style={{
                  background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255, 255, 255, 0.2) ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255, 255, 255, 0.2) 100%)`
                }}
              />
            </div>

            <div className="flex items-center gap-4">
              {/* Seek Backward Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSeekBackward}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all"
                title="10 saniye geri"
              >
                <SkipBack className="w-5 h-5" />
              </motion.button>

              {/* Play/Pause Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (isPlaying) {
                    handlePause();
                  } else {
                    handlePlay();
                  }
                }}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </motion.button>

              {/* Seek Forward Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSeekForward}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all"
                title="10 saniye ileri"
              >
                <SkipForward className="w-5 h-5" />
              </motion.button>

              {/* Time Display */}
              <div className="text-white text-sm font-mono min-w-[100px] text-center">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              {/* Quality Settings (YouTube only) */}
              {isYouTube && availableQualities.length > 0 && (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowQualityMenu(!showQualityMenu)}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all relative"
                    title="Kalite ayarları"
                  >
                    <Settings className="w-5 h-5" />
                    {currentQuality !== 'auto' && (
                      <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {currentQuality.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </motion.button>
                  
                  {showQualityMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-xl rounded-lg shadow-2xl border border-white/20 min-w-[120px] z-50">
                      <div className="py-1">
                        <button
                          onClick={() => handleQualityChange('auto')}
                          className={`w-full text-left px-4 py-2 text-sm text-white hover:bg-white/20 transition-colors ${
                            currentQuality === 'auto' ? 'bg-purple-600' : ''
                          }`}
                        >
                          Otomatik
                        </button>
                        {availableQualities.map((quality) => {
                          const qualityLabels: { [key: string]: string } = {
                            'tiny': '144p',
                            'small': '240p',
                            'medium': '360p',
                            'large': '480p',
                            'hd720': '720p',
                            'hd1080': '1080p',
                            'highres': '1440p+'
                          };
                          return (
                            <button
                              key={quality}
                              onClick={() => handleQualityChange(quality)}
                              className={`w-full text-left px-4 py-2 text-sm text-white hover:bg-white/20 transition-colors ${
                                currentQuality === quality ? 'bg-purple-600' : ''
                              }`}
                            >
                              {qualityLabels[quality] || quality.toUpperCase()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Volume Control */}
              <div className="flex items-center gap-2 flex-1 max-w-xs ml-auto">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    const newVolume = localVolume === 0 ? 1 : 0;
                    setLocalVolume(newVolume);
                    onVolumeChange?.(newVolume);
                  }}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all"
                >
                  {localVolume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </motion.button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={localVolume}
                  onChange={(e) => {
                    const newVolume = parseFloat(e.target.value);
                    setLocalVolume(newVolume);
                    onVolumeChange?.(newVolume);
                  }}
                  className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  style={{
                    background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${localVolume * 100}%, rgba(255, 255, 255, 0.2) ${localVolume * 100}%, rgba(255, 255, 255, 0.2) 100%)`
                  }}
                />
                <span className="text-white text-sm w-12 text-right">
                  {Math.round(localVolume * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen Share - Local (Host) */}
      {activeView === 'screen' && screenShareStream && (
        <video
          ref={screenShareVideoRef}
          autoPlay
          playsInline
          muted={true}
          className="w-full h-full object-contain bg-black"
        />
      )}

      {/* Screen Share - Remote (Clients) */}
      {activeView === 'screen' && remoteScreenStreams && remoteScreenStreams.size > 0 && (
        <div className="w-full h-full">
          {Array.from(remoteScreenStreams.entries()).map(([userId, stream]) => (
            <video
              key={userId}
              ref={(el) => {
                if (el) {
                  remoteScreenShareRefs.current.set(userId, el);
                  el.srcObject = stream;
                }
              }}
              autoPlay
              playsInline
              muted={false}
              className="w-full h-full object-contain bg-black"
            />
          ))}
        </div>
      )}

      {/* No Content Message */}
      {activeView === 'screen' && !screenShareStream && (!remoteScreenStreams || remoteScreenStreams.size === 0) && (
        <div className="w-full h-full flex items-center justify-center bg-black/50">
          <div className="text-center text-white/60">
            <Monitor className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Ekran paylaşımı bekleniyor...</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default memo(VideoPlayer);

