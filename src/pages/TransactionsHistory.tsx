import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUserTransactions } from '@/db/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Gift, BookOpen, HelpCircle, Calendar, Coins } from 'lucide-react';

interface Transaction {
  id: string | number;
  amount: number;
  transaction_type: string;
  description: string;
  activated_at: string; // 🎯 العمود الحقيقي
}

export default function TransactionHistory() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!user?.id) return;
      try {
        setLoading(true);
        const data = await getUserTransactions(user.id);
        console.log("العمليات المسترجعة من الحساب الحركي:", data);
        setTransactions(data || []);
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [user?.id]);

  const getTransactionStyle = (type: string, amount: number) => {
    switch (type) {
      case 'daily_spin':
        return {
          icon: <Gift className="w-5 h-5 text-amber-400" />,
          bgColor: 'bg-amber-500/10 border-amber-500/20',
          textColor: 'text-emerald-400'
        };
      case 'lesson_completion':
        return {
          icon: <BookOpen className="w-5 h-5 text-purple-400" />,
          bgColor: 'bg-purple-500/10 border-purple-500/20',
          textColor: 'text-emerald-400'
        };
      case 'p2p_transfer':
        const isLoss = amount < 0;
        return {
          icon: isLoss ? <ArrowUpRight className="w-5 h-5 text-red-400" /> : <ArrowDownLeft className="w-5 h-5 text-emerald-400" />,
          bgColor: isLoss ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20',
          textColor: isLoss ? 'text-red-400' : 'text-emerald-400'
        };
      default:
        return {
          icon: <HelpCircle className="w-5 h-5 text-blue-400" />,
          bgColor: 'bg-blue-500/10 border-blue-500/20',
          textColor: amount >= 0 ? 'text-emerald-400' : 'text-red-400'
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-8 font-sans antialiased relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-4xl mx-auto z-10 relative">
        <div className="flex items-center gap-3 mb-8 justify-end flex-row-reverse text-right">
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
            <Coins className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              {t('سجل العمليات والحركات', 'Transaction History')}
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              {t('تابع تفاصيل حركات نقاطك داخل منصة لوفيا', 'Track your points activities')}
            </p>
          </div>
        </div>

        <Card className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl">
          <CardHeader className="border-b border-slate-800/60 pb-4">
            <CardTitle className="text-slate-200 text-sm font-bold text-right">
              {t('آخر العمليات المسجلة', 'Recent Transactions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-sm">
                {t('لا توجد عمليات مسجلة في حسابك حتى الآن.', 'No transactions recorded yet.')}
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {transactions.map((tx, index) => {
                  const style = getTransactionStyle(tx.transaction_type, tx.amount);
                  // 🎯 قراءة الوقت من العمود الصحيح بالملّي
                  const date = tx.activated_at ? new Date(tx.activated_at).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '';

                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="p-4 md:p-5 flex items-center justify-between hover:bg-slate-800/20 transition-colors flex-row-reverse text-right"
                    >
                      <div className="flex items-center gap-4 flex-row-reverse">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${style.bgColor}`}>
                          {style.icon}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-200 leading-tight">
                            {tx.description}
                          </p>
                          <div className="flex items-center gap-1 text-slate-500 text-xs mt-1.5 flex-row-reverse justify-end">
                            <Calendar className="w-3 h-3" />
                            <span className="font-mono">{date}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left font-sans">
                        <span className={`text-base font-extrabold ${style.textColor}`}>
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                        </span>
                        <span className="text-slate-500 text-xs font-medium ml-1">🪙</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}