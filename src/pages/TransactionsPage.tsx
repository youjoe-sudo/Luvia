import React, { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { getProfile } from '@/db/api';
import { transferPointsByCode } from '@/db/api'; // الدالة الجديدة
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Send, Hash, Coins, ArrowRightLeft, RefreshCw, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PointsTransferPage() {
  const [receiverCode, setReceiverCode] = useState('');
  const [amount, setAmount] = useState('');
  const [myPoints, setMyPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadMyBalance() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const profileData = await getProfile(user.id);
        setMyPoints((profileData as any)?.points || 0);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMyBalance();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverCode || !amount) return;

    const pointsToTransfer = Number(amount);
    if (pointsToTransfer <= 0) {
      toast.error('يرجى إدخال كمية نقاط صالحة وأكبر من الصفر');
      return;
    }

    if (pointsToTransfer > myPoints) {
      toast.error('رصيد نقاطك الحالي لا يكفي لإتمام هذه المعاملة');
      return;
    }

    try {
      setIsSubmitting(true);
      await transferPointsByCode(receiverCode, pointsToTransfer);
      toast.success(`تم تحويل ${pointsToTransfer} نقطة بنجاح 🚀`);
      setReceiverCode('');
      setAmount('');
      await loadMyBalance(); // تحديث الرصيد بعد النجاح
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء تحويل النقاط، يرجى المحاولة لاحقاً');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center font-sans antialiased">
        <div className="flex flex-col items-center gap-3 opacity-40">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-xs font-bold text-slate-400 tracking-wider">جاري تحميل محفظتك الآمنة...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-6 sm:p-8 relative overflow-hidden font-sans antialiased selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* --- BACKGROUND AMBIENT NEON GLOWS --- */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none animate-[pulse_12s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/5 blur-[130px] rounded-full pointer-events-none animate-[pulse_10s_ease-in-out_infinite]" />

      <div className="max-w-4xl mx-auto z-10 relative pt-4 space-y-8">
        
        {/* --- HEADER PROFILE VIEW --- */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-right rtl:text-right space-y-2"
        >
          <div className="flex items-center gap-3 justify-start">
            <div className="w-2 h-7 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>تحويل رصيد النقاط</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 mr-5">
            قم بتبادل وتحويل رصيد النقاط التعليمية الخاص بك فوراً وبأمان تام لأي طالب داخل المنصة
          </p>
        </motion.div>

        {/* --- GRID PLATFORM LAYOUT --- */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 sm:gap-8 items-start">
          
          {/* كارد عرض الرصيد الحالي */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="md:col-span-2"
          >
            <Card className="bg-gradient-to-br from-blue-900/30 to-indigo-950/20 border border-blue-500/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl p-6 text-right rtl:text-right border-b-4 border-b-blue-500/20 relative">
              <div className="absolute top-[-20%] right-[-20%] w-48 h-48 bg-blue-500/[0.03] blur-3xl rounded-full pointer-events-none" />
              
              <div className="flex items-center justify-between gap-4 mb-6 flex-row-reverse">
                <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 shadow-inner">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">محفظتك الرقمية</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">رصيد النقاط المتوفر حالياً</p>
                </div>
              </div>

              <div className="space-y-1 mt-4">
                <div className="text-4xl font-black text-white font-mono tracking-tight flex items-baseline gap-2 justify-start">
                  <span>{myPoints.toLocaleString()}</span>
                  <span className="text-xs font-bold text-slate-400 font-sans">نقطة</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">يمكنك استخدام هذا الرصيد لإرساله لزملائك لتفعيل المساقات والخدمات.</p>
              </div>
            </Card>
          </motion.div>

          {/* كارد نموذج التحويل المتقدم */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="md:col-span-3"
          >
            <Card className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl relative">
              <CardHeader className="p-6 border-b border-slate-950/60 bg-slate-950/20 text-right rtl:text-right flex flex-row items-center justify-between gap-4 flex-row-reverse">
                <div className="p-2 bg-slate-950/60 border border-slate-900 rounded-xl text-slate-400">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-200">بيانات التحويل الفوري</CardTitle>
                  <CardDescription className="text-[11px] text-slate-500 mt-0.5">يرجى التأكد من الكود المدخل لتفادي الأخطاء</CardDescription>
                </div>
              </CardHeader>

              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  
                  {/* حقل كود الطالب المستقبل */}
                  <div className="space-y-2 text-right rtl:text-right">
                    <Label htmlFor="code" className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-2 flex-row-reverse justify-end">
                      <span>كود الطالب المستلم</span>
                      <Hash className="w-3.5 h-3.5 text-slate-500" />
                    </Label>
                    <div className="relative group">
                      <Input
                        id="code"
                        type="text"
                        value={receiverCode}
                        onChange={(e) => setReceiverCode(e.target.value)}
                        placeholder="ST-000000"
                        className="h-12 bg-slate-950/50 border-slate-800/80 rounded-xl text-slate-200 text-sm placeholder:text-slate-700 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 focus:bg-slate-950/90 transition-all px-4 text-left font-mono tracking-wide"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* حقل كمية النقاط المراد تحويلها */}
                  <div className="space-y-2 text-right rtl:text-right">
                    <Label htmlFor="amount" className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-2 flex-row-reverse justify-end">
                      <span>النقاط المراد تحويلها</span>
                      <Coins className="w-3.5 h-3.5 text-slate-500" />
                    </Label>
                    <div className="relative group">
                      <Input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        className="h-12 bg-slate-950/50 border-slate-800/80 rounded-xl text-slate-200 text-sm placeholder:text-slate-700 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 focus:bg-slate-950/90 transition-all px-4 font-mono"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* زر الإرسال النهائي */}
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/5 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 mt-4 cursor-pointer"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2 justify-center">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-xs font-medium">جاري معالجة التحويل بأمان...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span>تحويل النقاط الآن 🚀</span>
                        <Send className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </div>
    </div>
  );
}