import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface SecureVideoPlayerProps {
  videoId: string;
  watermarkText?: string;
  onSecurityViolation?: () => void;
}

export default function SecureVideoPlayer({ 
  videoId, 
  watermarkText = 'Luvia Platform',
  onSecurityViolation 
}: SecureVideoPlayerProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [securityWarning, setSecurityWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    // منع النقر بزر الفأرة الأيمن
    // Prevent right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      showWarning(t('النقر بزر الفأرة الأيمن غير مسموح', 'Right-click is not allowed'));
      return false;
    };

    // منع اختصارات لوحة المفاتيح للتسجيل والتقاط الشاشة
    // Prevent keyboard shortcuts for recording and screenshots
    const handleKeyDown = (e: KeyboardEvent) => {
      // منع F12 وأدوات المطورين
      // Prevent F12 and developer tools
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        showWarning(t('أدوات المطورين غير مسموحة أثناء المشاهدة', 'Developer tools are not allowed during playback'));
        if (onSecurityViolation) onSecurityViolation();
        return false;
      }

      // منع Print Screen
      // Prevent Print Screen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        showWarning(t('لقطات الشاشة غير مسموحة', 'Screenshots are not allowed'));
        if (onSecurityViolation) onSecurityViolation();
        return false;
      }

      // منع اختصارات التسجيل الشائعة
      // Prevent common recording shortcuts
      if (
        (e.ctrlKey && e.shiftKey && e.key === 'R') || // OBS
        (e.altKey && e.key === 'R') || // Windows Game Bar
        (e.metaKey && e.shiftKey && e.key === '5') // macOS screenshot
      ) {
        e.preventDefault();
        showWarning(t('تسجيل الشاشة غير مسموح', 'Screen recording is not allowed'));
        if (onSecurityViolation) onSecurityViolation();
        return false;
      }
    };

    // كشف فقدان التركيز (التبديل إلى نافذة أخرى)
    // Detect focus loss (switching to another window)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // إيقاف الفيديو عند التبديل إلى نافذة أخرى
        // Pause video when switching to another window
        const iframe = containerRef.current?.querySelector('iframe');
        if (iframe) {
          // إرسال أمر إيقاف إلى iframe
          // Send pause command to iframe
          iframe.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        }
        showWarning(t('تم إيقاف الفيديو - لا تغادر النافذة أثناء المشاهدة', 'Video paused - Do not leave the window during playback'));
      }
    };

    // كشف تغيير حجم النافذة (قد يشير إلى تسجيل)
    // Detect window resize (may indicate recording)
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // تحذير عند تغيير حجم النافذة بشكل مفاجئ
        // Warning on sudden window resize
        if (Math.abs(window.innerWidth - screen.width) > 100) {
          showWarning(t('تم اكتشاف تغيير في حجم النافذة', 'Window resize detected'));
        }
      }, 500);
    };

    // منع السحب والإفلات
    // Prevent drag and drop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // منع التحديد
    // Prevent text selection
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // إضافة المستمعين
    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', handleResize);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('selectstart', handleSelectStart);

    // كشف أدوات المطورين المفتوحة
    // Detect open developer tools
    const devToolsCheck = setInterval(() => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      
      if (widthThreshold || heightThreshold) {
        showWarning(t('يرجى إغلاق أدوات المطورين', 'Please close developer tools'));
        if (onSecurityViolation) onSecurityViolation();
      }
    }, 1000);

    // التنظيف
    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('selectstart', handleSelectStart);
      clearInterval(devToolsCheck);
      clearTimeout(resizeTimeout);
    };
  }, [t, onSecurityViolation]);

  const showWarning = (message: string) => {
    setWarningMessage(message);
    setSecurityWarning(true);
    setTimeout(() => setSecurityWarning(false), 5000);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* تحذير الأمان */}
      {/* Security warning */}
      {securityWarning && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{warningMessage}</AlertDescription>
        </Alert>
      )}

      {/* إشعار الحماية */}
      {/* Protection notice */}
      <div className="mb-4 p-3 bg-muted rounded-lg flex items-center gap-2 text-sm">
        <Shield className="h-4 w-4 text-primary" />
        <span className="text-muted-foreground">
          {t(
            'هذا الفيديو محمي. التسجيل أو التقاط الشاشة غير مسموح.',
            'This video is protected. Recording or screenshots are not allowed.'
          )}
        </span>
      </div>

      {/* مشغل الفيديو */}
      {/* Video player */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {/* العلامة المائية */}
        {/* Watermark */}
        <div 
          className="absolute top-4 right-4 z-10 text-white/30 text-sm font-bold pointer-events-none select-none"
          style={{
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          {watermarkText}
        </div>

        {/* Google Drive Video Player */}
        <iframe
          src={`https://drive.google.com/file/d/${videoId}/preview`}
          className="w-full h-full"
          allow="autoplay"
          style={{
            border: 'none',
            pointerEvents: 'auto',
          }}
          title="Secure Video Player"
        />

        {/* طبقة حماية شفافة */}
        {/* Transparent protection layer */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'transparent',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        />
      </div>

      {/* تحذير إضافي */}
      {/* Additional warning */}
      <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <p className="text-sm text-amber-700 dark:text-amber-400">
          ⚠️ {t(
            'تنبيه: أي محاولة لتسجيل أو تحميل هذا الفيديو ستؤدي إلى إيقاف حسابك.',
            'Warning: Any attempt to record or download this video will result in account suspension.'
          )}
        </p>
      </div>
    </div>
  );
}
