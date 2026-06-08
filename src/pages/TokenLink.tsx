import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { redeemVoucher } from "@/db/api";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";

export default function TokenLink() {
  const { tokenId } = useParams<{ tokenId: string }>();
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  // الحالات: 'loading' | 'success' | 'invalid-token' | 'error'
  const [status, setStatus] = useState<'loading' | 'success' | 'invalid-token' | 'error'>('loading');
  
  // حماية لمنع التكرار في الـ StrictMode أو النقرات المزدوجة
  const hasCalled = useRef(false);

  useEffect(() => {
    // 1. التحقق المبدئي من طول التوكن
    if (!tokenId || tokenId.length !== 10) {
      setStatus('invalid-token');
      return;
    }

    // 2. التحقق من تسجيل الدخول
    if (!user?.id) {
      return;
    }

    // 3. قفل الأمان من التكرار
    if (hasCalled.current) return;
    hasCalled.current = true;

    async function handleRedeem() {
      try {
        // حطينا الـ ! هنا عشان نقفل بوق التايب سكريبت تماماً
        await redeemVoucher(tokenId!, user!.id);
        setStatus('success');
        
        // توجيه تلقائي لكورسات الطالب بعد ثانيتين
        setTimeout(() => {
          navigate("/my-courses");
        }, 2500);
      } catch (error) {
        console.error("Voucher redemption failed:", error);
        setStatus('error');
      }
    }

    handleRedeem();
  }, [tokenId, user, navigate]);

  // --- واجهات العرض بستايل لوفيا الفخم ---

  // 1. حالة التوكن غير صالح (طول غير مطابق)
  if (!tokenId || tokenId.length !== 10) {
    return (
      <ErrorContainer 
        title={t("كود غير صالح", "Invalid Token")}
        message={t("رابط التفعيل هذا غير صحيح أو قد يكون تالفاً، تأكد من الرابط الصحيح.", "This activation link is incorrect or corrupted.")} 
        icon={<XCircle className="w-10 h-10 text-red-400" />} 
      />
    );
  }

  // 2. حالة الطالب مش مسجل دخول
  if (!user?.id) {
    return (
      <ErrorContainer 
        title={t("تسجيل الدخول مطلوب", "Login Required")}
        message={t("يجب عليك تسجيل الدخول أولاً في منصة لوفيا لتتمكن من تفعيل هذا الكورس لحسابك.", "You must log in to Luvia first to activate this course to your account.")} 
        icon={<ShieldAlert className="w-10 h-10 text-amber-400" />}
        action={
          <button 
            onClick={() => navigate("/login", { state: { from: `/tokens/${tokenId}` } })}
            className="mt-6 px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all text-sm w-full"
          >
            {t("تسجيل الدخول الآن", "Log In Now")}
          </button>
        }
      />
    );
  }

  // 3. الشاشة الرئيسية للمعالجة
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* هالات الإضاءة الخلفية (Glow Effects) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

      <AnimatePresence mode="wait">
        <motion.div 
          key={status}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="w-full max-w-md bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-[2.5rem] p-10 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10"
        >
          {status === 'loading' && (
            <>
              <div className="relative w-20 h-20 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(59,130,246,0.1)] mx-auto">
                <Loader2 className="w-9 h-9 text-blue-500 animate-spin" />
              </div>
              <h2 className="text-xl font-black text-white mb-2">
                {t("جاري تفعيل الكورس", "Activating Your Course")}
              </h2>
              <p className="text-slate-400 text-sm max-w-xs mx-auto">
                {t("ثوانٍ معدودة.. نقوم الآن بالتحقق من الكود وتأمين الجلسة لحسابك.", "Just a moment.. Checking token validity and securing session.")}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-black text-emerald-400 mb-2">
                {t("تم التفعيل بنجاح! 🎉", "Activated Successfully! 🎉")}
              </h2>
              <p className="text-slate-300 font-medium text-sm mt-3">
                {t("مبارك عليك الكورس، جاري توجيهك إلى لوحة التحكم الخاصة بك...", "Congrats! Redirecting you to your dashboard...")}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-xl font-black text-red-400 mb-2">
                {t("فشل تفعيل الكود", "Activation Failed")}
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                {t("هذا الكود غير صالح، أو ربما تم استخدامه مسبقاً من قِبل طالب آخر.", "This token is invalid, or it might have been already redeemed.")}
              </p>
              <button 
                onClick={() => navigate("/my-courses")}
                className="w-full h-12 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl border border-white/5 transition-all text-sm"
              >
                {t("العودة إلى كورساتي", "Back to My Courses")}
              </button>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ErrorContainer({ title, message, icon, action }: { title: string; message: string; icon: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-slate-800/10 blur-[100px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-[2rem] p-8 text-center shadow-2xl relative z-10"
      >
        <div className="w-16 h-16 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
          {icon}
        </div>
        <h3 className="text-lg font-black text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-xs leading-relaxed px-2">{message}</p>
        {action}
      </motion.div>
    </div>
  );
}