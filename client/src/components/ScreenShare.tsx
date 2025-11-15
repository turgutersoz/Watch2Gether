import { useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Monitor, MonitorOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface ScreenShareProps {
  onStreamChange?: (stream: MediaStream | null) => void;
}

function ScreenShare({ onStreamChange }: ScreenShareProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startScreenShare = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      setStream(mediaStream);
      setIsSharing(true);
      onStreamChange?.(mediaStream);
      toast.success('Ekran paylaşımı başlatıldı!');

      // Kullanıcı paylaşımı durdurduğunda
      mediaStream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
      });
    } catch (error: any) {
      if (error.name !== 'NotAllowedError') {
        toast.error('Ekran paylaşımı başlatılamadı!');
      }
    }
  }, [onStreamChange]);

  const stopScreenShare = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsSharing(false);
      onStreamChange?.(null);
      toast.info('Ekran paylaşımı durduruldu');
    }
  }, [stream, onStreamChange]);

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={isSharing ? stopScreenShare : startScreenShare}
      className={`glass rounded-lg p-2 text-white hover:bg-white/20 transition-all ${
        isSharing ? 'bg-green-500/50' : ''
      }`}
      title={isSharing ? 'Ekran paylaşımını durdur' : 'Ekran paylaş'}
    >
      {isSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
    </motion.button>
  );
}

export default memo(ScreenShare);

