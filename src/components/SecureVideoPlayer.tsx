import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface SecureVideoPlayerProps {
  videoId: string;
  studentName: string;
  studentPhone: string;
}

export default function SecureVideoPlayer({ videoId, studentName, studentPhone }: SecureVideoPlayerProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  // حالة مكان العلامة المائية عشان تتحرك
  const [watermarkPos, setWatermarkPos] = useState({ top: 20, left: 20 });

  // تحريك العلامة المائية كل 3 ثواني لمكان عشوائي (عشان لو بيسجل الشاشة)
  useEffect(() => {
    const moveWatermark = () => {
      setWatermarkPos({
        top: Math.floor(Math.random() * 70) + 10, // من 10% لـ 80%
        left: Math.floor(Math.random() * 70) + 10,
      });
    };
    const interval = setInterval(moveWatermark, 3000);
    return () => clearInterval(interval);
  }, []);

  // حماية إضافية: منع الكليك يمين واختصارات الـ DevTools
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      showWarning();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // منع F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.key === 'S' || e.key === 's'))
      ) {
        e.preventDefault();
        showWarning();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const showWarning = (msg?: string) => {
    toast({
      title: t('تحذير أمني 🚨', 'Security Warning 🚨'),
      description: msg || t('غير مسموح بهذا الإجراء. الجلسة مشفرة.', 'Action not allowed. Session is encrypted.'),
      variant: 'destructive',
    });
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-[#020617] rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-slate-800/50"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* شريط الحماية العلوي (زي اللي في الصورة عندك) */}
      <div className="absolute top-0 left-0 w-full h-10 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center gap-2 border-b border-emerald-500/20 text-emerald-500 pointer-events-none">
        <ShieldCheck className="w-5 h-5" />
        <span className="text-sm font-bold tracking-wide">
          {t('جلسة مشاهدة مشفرة ومراقبة. يمنع التسجيل أو النسخ.', 'Encrypted and monitored session. Recording or copying is prohibited.')}
        </span>
      </div>

      {/* 🚀 الدرع الخفي لقتل زرار جوجل درايف (Pop-out Blocker) 🚀 */}
      {/* موجود فوق يمين ومغطي مساحة الزرار بالظبط */}
      <div 
        className="absolute top-10 right-0 w-[80px] h-[80px] z-[60]"
        style={{ cursor: 'not-allowed' }}
        title={t('ممنوع فتح الفيديو خارج المنصة', 'Pop-out disabled')}
        onClick={(e) => {
          e.stopPropagation();
          showWarning(t('عفواً، لا يمكن فتح الفيديو خارج منصة لوفيا', 'Cannot open video outside Luvia'));
        }}
      />

      {/* العلامة المائية الديناميكية المتحركة */}
      <motion.div
        animate={{ 
          top: `${watermarkPos.top}%`, 
          left: `${watermarkPos.left}%`,
          opacity: [0.15, 0.3, 0.15]
        }}
        transition={{ 
          top: { duration: 2.5, ease: "easeInOut" },
          left: { duration: 2.5, ease: "easeInOut" },
          opacity: { duration: 4, repeat: Infinity }
        }}
        className="absolute z-40 pointer-events-none flex flex-col items-center justify-center -rotate-[15deg]"
      >
        <span className="text-white/20 font-black text-2xl md:text-4xl tracking-widest drop-shadow-lg select-none">
          {studentPhone || studentName}
        </span>
        <span className="text-white/10 font-bold text-sm md:text-xl tracking-widest select-none mt-1">
          Luvia Platform
        </span>
      </motion.div>

      {/* مشغل جوجل درايف */}
      <div className="absolute inset-0 pt-10"> {/* pt-10 عشان ينزل تحت شريط الحماية */}
        <iframe
          src={`https://drive.google.com/file/d/${videoId}/preview`}
          className="w-full h-full"
          allow="autoplay; fullscreen"
          style={{ border: 'none' }}
          title="Luvia Secure Player"
        />
      </div>
    </div>
  );
}