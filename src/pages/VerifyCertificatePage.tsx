import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, CheckCircle2, XCircle, Shield, Calendar, User, BookOpen, UserCheck, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { verifyCertificate } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function VerifyCertificatePage() {
  const [searchParams] = useSearchParams();
  const [certificateId, setCertificateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();

  const handleVerify = async (idToVerify?: string) => {
    const idValue = idToVerify || certificateId;
    
    if (!idValue || !idValue.trim()) {
      toast({
        title: 'خطأ',
        description: 'الرجاء إدخال معرف الشهادة',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setVerificationResult(null);
    setNotFound(false);

    try {
      console.log('التحقق من الشهادة:', idValue.trim());
      const result = await verifyCertificate(idValue.trim());
      console.log('نتيجة التحقق:', result);
      
      if (result) {
        setVerificationResult(result);
        setNotFound(false);
      } else {
        setVerificationResult(null);
        setNotFound(true);
      }
    } catch (error) {
      console.error('خطأ في التحقق من الشهادة:', error);
      setVerificationResult(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // التحقق التلقائي إذا كان هناك معرف في URL
  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    console.log('معرف من URL:', idFromUrl);
    if (idFromUrl && idFromUrl.trim()) {
      setCertificateId(idFromUrl);
      setTimeout(() => {
        handleVerify(idFromUrl);
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 pb-20 relative overflow-hidden font-sans antialiased selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* --- PREMIUM BACKGROUND AMBIENT GLOWS --- */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-blue-600/5 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[450px] h-[450px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="container mx-auto px-4 pt-16 max-w-5xl relative z-10">
        
        {/* الرأس / Header */}
        <motion.div 
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12 space-y-3"
        >
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl shadow-inner relative group">
              <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-md opacity-50 group-hover:opacity-100 transition-opacity" />
              <Shield className="w-10 h-10 text-blue-400 relative z-10" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">التحقق من الشهادة</h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto font-medium">
            تحقق من موثوقية وصحة الشهادات الأكاديمية الصادرة فوراً وبشكل رسمي
          </p>
        </motion.div>

        {/* نموذج البحث / Search form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card className="max-w-2xl mx-auto mb-10 bg-slate-900/30 border border-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/[0.01] blur-3xl rounded-full pointer-events-none" />
            
            <CardHeader className="text-right rtl:text-right border-b border-slate-950/60 bg-slate-950/20 p-5">
              <CardTitle className="text-sm font-bold text-slate-200">أدخل معرف الشهادة الرقمي</CardTitle>
              <CardDescription className="text-[11px] text-slate-500 mt-0.5">
                يمكنك العثور على المعرف الفريد مطبوعاً في الجزء السفلي من الشهادة الورقية أو الرقمية
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="أدخل معرف الشهادة هنا..."
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="h-12 bg-slate-950/50 border-slate-800/80 rounded-xl text-slate-200 text-sm placeholder:text-slate-700 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 focus:bg-slate-950/90 transition-all px-4 text-left font-mono tracking-wide flex-1"
                  dir="ltr"
                />
                <Button 
                  onClick={() => handleVerify()} 
                  disabled={loading}
                  className="h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold px-6 text-xs transition-all shadow-md shadow-blue-600/5 active:scale-[0.98] cursor-pointer shrink-0"
                >
                  {loading ? (
                    <div className="flex items-center gap-2 justify-center">
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>جاري الفحص...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 flex-row-reverse">
                      <span>تحقق الآن</span>
                      <Search className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* كروت عرض النتائج التفاعلية */}
        <AnimatePresence mode="wait">
          {/* نتيجة التحقق - شهادة صحيحة / Verification result - Valid */}
          {verificationResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="max-w-3xl mx-auto bg-slate-900/20 border border-emerald-500/30 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
                <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/10 p-6 text-right rtl:text-right flex flex-row items-center justify-between gap-4 flex-row-reverse">
                  <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
                    <CheckCircle2 className="w-5 h-5 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" />
                  </div>
                  <div className="space-y-0.5">
                    <CardTitle className="text-base font-bold text-emerald-400">
                      شهادة معتمدة وصحيحة ✓
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      تم مطابقة البيانات والتحقق من صحة هذه السجلات بنجاح
                    </CardDescription>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6 md:p-8 space-y-6 text-right rtl:text-right">
                  {/* معلومات الشهادة / Certificate information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-slate-900 pb-6 flex-row-reverse">
                    
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-medium text-slate-500 flex items-center gap-2 flex-row-reverse justify-end">
                        <span>اسم الطالب الخريج</span>
                        <User className="w-3.5 h-3.5 text-slate-600" />
                      </h3>
                      <p className="text-sm font-bold text-white">
                        {verificationResult.student_full_name}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-xs font-medium text-slate-500 flex items-center gap-2 flex-row-reverse justify-end">
                        <span>عنوان المسار الدراسي</span>
                        <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                      </h3>
                      <p className="text-sm font-bold text-white">
                        {verificationResult.courses?.title_ar || verificationResult.courses?.title_en}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-xs font-medium text-slate-500 flex items-center gap-2 flex-row-reverse justify-end">
                        <span>تاريخ الاعتماد والإصدار</span>
                        <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      </h3>
                      <p className="text-sm font-bold text-white font-sans">
                        {new Date(verificationResult.issued_at).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-xs font-medium text-slate-500 flex items-center gap-2 flex-row-reverse justify-end">
                        <span>المحاضر / كبير المدربين</span>
                        <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                      </h3>
                      <p className="text-sm font-bold text-white">
                        {verificationResult.instructor_signature_text || 
                         verificationResult.courses?.instructor_name_ar || 
                         verificationResult.courses?.instructor_name_en}
                      </p>
                    </div>

                    <div className="sm:col-span-2 space-y-1.5 pt-2">
                      <h3 className="text-xs font-medium text-slate-500 flex items-center gap-2 flex-row-reverse justify-end">
                        <span>المعرف الرقمي الموحد (UUID)</span>
                        <Hash className="w-3.5 h-3.5 text-slate-600" />
                      </h3>
                      <p className="text-xs font-mono bg-slate-950/60 border border-slate-900 p-3 rounded-xl break-all text-slate-300 text-left selection:bg-blue-500/20">
                        {verificationResult.id}
                      </p>
                    </div>
                  </div>

                  {/* رسالة التأكيد / Confirmation message */}
                  <Alert className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl py-3.5 flex items-start gap-3 flex-row-reverse text-right">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    <AlertDescription className="text-xs font-medium text-emerald-400/90 leading-relaxed">
                      هذه الشهادة رسمية صادرة ومعتمدة مباشرة من منصة Luvia التعليمية ومسجلة مشفرة داخل قاعدة بياناتنا السحابية بشكل آمن، مما يضمن صحة وموثوقية مؤهلات الطالب.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* نتيجة التحقق - شهادة غير موجودة / Verification result - Not found */}
          {notFound && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="max-w-3xl mx-auto bg-slate-900/20 border border-red-500/30 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
                <CardHeader className="bg-red-500/5 border-b border-red-500/10 p-6 text-right rtl:text-right flex flex-row items-center justify-between gap-4 flex-row-reverse">
                  <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-400 shadow-inner shrink-0">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <CardTitle className="text-base font-bold text-red-400">
                      بيانات غير مطابقة أو منعدمة ✗
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      لم يتم العثور على أي سجلات متوافقة مع هذا المعرف الرقمي
                    </CardDescription>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6 md:p-8 text-right rtl:text-right space-y-6">
                  <Alert variant="destructive" className="bg-red-950/30 border-red-900/50 rounded-xl text-red-400 py-4 flex items-start gap-3 flex-row-reverse">
                    <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <AlertDescription className="text-xs font-medium leading-relaxed">
                      <strong className="font-bold">تنبيه أمني:</strong> المعرف الرقمي الذي قمت بإدخاله غير مسجل نهائياً بالنظام. قد تكون الشهادة المدخلة غير معتمدة أو تم نسخ الكود بشكل منقوص. يرجى إعادة فحص الخانات والمحاولة مجدداً بحذر.
                    </AlertDescription>
                  </Alert>

                  <div className="p-5 bg-slate-950/40 border border-slate-900 rounded-xl space-y-3">
                    <h3 className="text-xs font-bold text-slate-300">نصائح وإرشادات للتحقق:</h3>
                    <ul className="space-y-2 text-xs text-slate-500 pr-1 list-none">
                      <li className="flex items-center gap-2 flex-row-reverse justify-end">
                        <div className="w-1 h-1 bg-slate-700 rounded-full" />
                        <span>تأكد من نسخ معرف الشهادة بالكامل بما يحتويه من رموز أو شرطات تفصل الأرقام.</span>
                      </li>
                      <li className="flex items-center gap-2 flex-row-reverse justify-end">
                        <div className="w-1 h-1 bg-slate-700 rounded-full" />
                        <span>تحقق من عدم إدراج أي مسافات فارغة إضافية في بداية الحقل أو نهايته أثناء اللصق.</span>
                      </li>
                      <li className="flex items-center gap-2 flex-row-reverse justify-end">
                        <div className="w-1 h-1 bg-slate-700 rounded-full" />
                        <span>إذا كنت متأكداً من صحة الكود، يرجى مراجعة إدارة الدعم الفني للمنصة لتحديث سجلاتك الصادرة.</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* معلومات إضافية / Additional information */}
        {!verificationResult && !notFound && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="max-w-3xl mx-auto mt-6"
          >
            <Card className="bg-slate-900/10 border border-slate-900/60 rounded-2xl backdrop-blur-sm">
              <CardHeader className="text-right rtl:text-right border-b border-slate-950/40 p-5">
                <CardTitle className="text-xs font-bold text-slate-400">خطوات تتبع وإثبات موثوقية الشهادة</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5 text-right rtl:text-right">
                
                <div className="flex gap-4 flex-row-reverse items-start">
                  <div className="flex-shrink-0 w-7 h-7 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs rounded-xl flex items-center justify-center font-bold shadow-inner">
                    1
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-slate-200">الوصول للمعرف الفريد</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      ستجد معرف التوثيق المشفر مطبوعاً أسفل الشهادة الممنوحة لك، بجانب التوقيع الرسمي للجهة المصدرة أو تاريخ المنح الأكاديمي.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 flex-row-reverse items-start">
                  <div className="flex-shrink-0 w-7 h-7 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs rounded-xl flex items-center justify-center font-bold shadow-inner">
                    2
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-slate-200">إدراج الكود في لوحة الفحص</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      قم بنسخ المعرف كاملاً كما هو، وتأكد من وضعه داخل حقل البحث الإلكتروني المخصص بالأعلى بمنتهى الدقة.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 flex-row-reverse items-start">
                  <div className="flex-shrink-0 w-7 h-7 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs rounded-xl flex items-center justify-center font-bold shadow-inner">
                    3
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-slate-200">إصدار النتيجة الفورية للعامة</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      عند النقر فوق زر التحقق، سيقوم النظام بالاستعلام المشفر وعرض النتيجة الحية وتفاصيل الدورة التدريبية لتوثيقها أمام أي جهات خارجية.
                    </p>
                  </div>
                </div>

              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}