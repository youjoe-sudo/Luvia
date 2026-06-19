import React, { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { getProfile } from '@/db/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Coins, 
  History, 
  User, 
  QrCode, 
  Calendar, 
  Gift,
  ArrowRightLeft
} from 'lucide-react';

interface TransactionLog {
  id: string;
  points_change: number;
  reason: string;
  transaction_type: string; // 'charge' | 'transfer_sent' | 'transfer_received' | 'reward'
  sender_name?: string;
  receiver_name?: string;
  sender_code?: string;
  receiver_code?: string;
  created_at: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionLog[]>([]);
  const [myPoints, setMyPoints] = useState(0);
  const [totalCharged, setTotalCharged] = useState(0);
  const [totalSent, setTotalSent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTransactionData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // 1. جلب رصيد الطالب الحالي
          const profileData = await getProfile(user.id);
          setMyPoints((profileData as any)?.points || 0);

          // 2. جلب سجل المعاملات من جدول الترانزاكشنز أو الـ history
          // بنعمل استعلام شامل عشان نجيب تفاصيل الراسل والمستقبل لو موجودة
          const { data: logs, error } = await supabase
            .from('points_history')
            .select(`
              id,
              points_change,
              amount,
              reason,
              transaction_type,
              created_at,
              sender_code,
              receiver_code,
              profiles!points_history_sender_id_fkey(name, full_name),
              receiver_profile:profiles!points_history_receiver_id_fkey(name, full_name)
            `)
            .eq('student_id', user.id) // أو لو العمليات مربوطة بحسابه كراسل أو مستقبل
            .order('created_at', { ascending: false });

          if (error) throw error;

          // 3. عمل Mapping مرن للبيانات لتلائم كل مسميات الداتابيز المتاحة عندك
          const formattedLogs: TransactionLog[] = (logs || []).map((log: any) => {
            const change = log.points_change !== undefined ? log.points_change : (log.amount || 0);
            
            // تحديد نوع العملية بدقة لو مش مسجلة في الداتابيز مباشرة
            let type = log.transaction_type || 'reward';
            if (change < 0) type = 'transfer_sent';
            else if (log.reason?.includes('شحن') || log.reason?.includes('كود')) type = 'charge';
            else if (log.sender_code && log.sender_code !== (profileData as any)?.student_code) type = 'transfer_received';

            return {
              id: log.id,
              points_change: change,
              reason: log.reason || 'مكافأة أو عملية منصة 🌟',
              transaction_type: type,
              sender_name: log.profiles?.name || log.profiles?.full_name || undefined,
              receiver_name: log.receiver_profile?.name || log.receiver_profile?.full_name || undefined,
              sender_code: log.sender_code || undefined,
              receiver_code: log.receiver_code || undefined,
              created_at: log.created_at
            };
          });

          setTransactions(formattedLogs);

          // 4. حساب الإحصائيات السريعة للكروت
          let charged = 0;
          let sent = 0;
          formattedLogs.forEach(log => {
            if (log.transaction_type === 'charge') {
              charged += log.points_change;
            } else if (log.transaction_type === 'transfer_sent') {
              sent += Math.abs(log.points_change);
            }
          });
          setTotalCharged(charged);
          setTotalSent(sent);
        }
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTransactionData();
  }, []);

  // دالة لتلوين وتنسيق أيقونة ونوع المعاملة
  const renderTypeBadge = (type: string) => {
    switch (type) {
      case 'charge':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 gap-1 rounded-lg">
            <QrCode className="w-3 h-3" /> شحن كود
          </Badge>
        );
      case 'transfer_sent':
        return (
          <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 gap-1 rounded-lg">
            <ArrowUpRight className="w-3 h-3" /> تحويل لصديق
          </Badge>
        );
      case 'transfer_received':
        return (
          <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 gap-1 rounded-lg">
            <ArrowDownLeft className="w-3 h-3" /> استقبال من صديق
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 gap-1 rounded-lg">
            <Gift className="w-3 h-3" /> مكافأة تعليمية
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6 text-right" dir="rtl">
        <Skeleton className="h-12 w-64 bg-white/5 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28 bg-white/5 rounded-2xl" />
          <Skeleton className="h-28 bg-white/5 rounded-2xl" />
          <Skeleton className="h-28 bg-white/5 rounded-2xl" />
        </div>
        <Skeleton className="h-[400px] w-full bg-white/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8 text-right" dir="rtl">
      
      {/* رأس الصفحة */}
      <div className="space-y-1.5">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <History className="h-7 w-7 text-blue-500" />
          دفتر الحسابات والمعاملات 🪙
        </h1>
        <p className="text-xs text-slate-400">تتبع تفاصيل نقاطك الشاملة، أين تم إنفاقها وكيف تم تحصيلها واستقبالها.</p>
      </div>

      {/* صف الكروت الإحصائية الـ 3 المذهلة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* كارت الرصيد الحالي */}
        <Card className="bg-slate-900/40 border border-slate-800 rounded-2xl shadow-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full" />
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400 font-bold text-xs flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" /> الرصيد المتوفر الآن
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white font-mono flex items-baseline gap-1">
              {myPoints} <span className="text-xs font-sans font-bold text-amber-500">نقطة مجمدة وصالحة</span>
            </div>
          </CardContent>
        </Card>

        {/* كارت إجمالي المشحون */}
        <Card className="bg-slate-900/40 border border-slate-800 rounded-2xl shadow-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full" />
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400 font-bold text-xs flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-emerald-400" /> إجمالي النقاط المشحونة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-400 font-mono flex items-baseline gap-1">
              +{totalCharged} <span className="text-xs font-sans font-bold text-slate-500">نقطة من كروت الشحن</span>
            </div>
          </CardContent>
        </Card>

        {/* كارت إجمالي المحول لجهات خارجية */}
        <Card className="bg-slate-900/40 border border-slate-800 rounded-2xl shadow-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-2xl rounded-full" />
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400 font-bold text-xs flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-red-400" /> نقاط قمت بتحويلها للأصدقاء
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-400 font-mono flex items-baseline gap-1">
              -{totalSent} <span className="text-xs font-sans font-bold text-slate-500">نقطة صادرة بالكامل</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* كارت السجل والجدول الشامل */}
      <Card className="border border-slate-800 bg-slate-950 shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-900/30 border-b border-slate-900">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-200">
            <Coins className="h-5 w-5 text-amber-500" />
            التاريخ التفصيلي لحركات الحساب
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-900/10">
                <TableRow className="border-slate-900 hover:bg-transparent">
                  <TableHead className="text-right text-slate-400 font-bold text-xs py-4 w-[140px]">نوع العملية</TableHead>
                  <TableHead className="text-right text-slate-400 font-bold text-xs py-4">وصف المعاملة والسبب</TableHead>
                  <TableHead className="text-right text-slate-400 font-bold text-xs py-4">الراسل / المستقبل (الكود)</TableHead>
                  <TableHead className="text-center text-slate-400 font-bold text-xs py-4 w-[160px]">التاريخ والوقت</TableHead>
                  <TableHead className="text-left text-slate-400 font-bold text-xs py-4 w-[120px]">القيمة بالفارق</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500 text-sm">
                      لا يوجد أي حركات مالية أو معاملات مسجلة لحسابك حتى الآن 🍃
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id} className="border-slate-900/60 hover:bg-slate-900/20 transition-colors">
                      
                      {/* نوع العملية */}
                      <TableCell className="py-4">
                        {renderTypeBadge(tx.transaction_type)}
                      </TableCell>

                      {/* سبب المعاملة */}
                      <TableCell className="py-4 font-semibold text-xs text-slate-200">
                        {tx.reason}
                      </TableCell>

                      {/* الراسل والمستقبل والأكواد */}
                      <TableCell className="py-4 text-xs text-slate-400">
                        {tx.transaction_type === 'transfer_sent' && (
                          <span className="flex items-center gap-1 text-red-400/80">
                            <User className="w-3 h-3" /> إلى: {tx.receiver_name || 'طالب آخر'} 
                            {tx.receiver_code && <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded text-[10px]">({tx.receiver_code})</span>}
                          </span>
                        )}
                        {tx.transaction_type === 'transfer_received' && (
                          <span className="flex items-center gap-1 text-blue-400/80">
                            <User className="w-3 h-3" /> من: {tx.sender_name || 'طالب آخر'} 
                            {tx.sender_code && <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded text-[10px]">({tx.sender_code})</span>}
                          </span>
                        )}
                        {tx.transaction_type !== 'transfer_sent' && tx.transaction_type !== 'transfer_received' && (
                          <span className="text-slate-600 font-medium">—</span>
                        )}
                      </TableCell>

                      {/* الوقت والتاريخ */}
                      <TableCell className="py-4 text-center text-xs font-medium text-slate-500">
                        <span className="flex items-center justify-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-slate-600" />
                          {new Date(tx.created_at).toLocaleDateString('ar-EG', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </TableCell>

                      {/* قيمة النقاط المضافة أو المخصومة */}
                      <TableCell className="py-4 text-left font-mono text-base font-black">
                        <span className={tx.points_change >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                          {tx.points_change >= 0 ? `+${tx.points_change}` : tx.points_change}
                        </span>
                        <span className="text-[10px] font-sans font-bold text-slate-600 mr-0.5"> 🪙</span>
                      </TableCell>

                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}