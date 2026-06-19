import React, { useEffect, useState } from 'react';
import { getLeaderboard, getPointsHistory } from '@/db/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Medal, Award, Flame, Coins, Clock } from 'lucide-react';
import { supabase } from '@/db/supabase';

interface LeaderboardUser {
  id: string;
  name: string;
  points: number;
  rank?: number;
}

interface PointsLog {
  id: string;
  points_change: number;
  reason: string;
  created_at: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [history, setHistory] = useState<PointsLog[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // 1. جلب بيانات المستخدم الحالي بأمان
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          // جلب تاريخ نقاط الطالب الحالي
          const historyData = await getPointsHistory(user.id);
          
          // تأمين الـ Mapping للسجل لحل مشكلة اختلاف المسميات (points_change أو amount)
          const formattedHistory = (historyData || []).map((log: any) => ({
            id: log.id,
            reason: log.reason || log.transaction_type || 'مكافأة دراسية 🌟',
            points_change: log.points_change !== undefined ? log.points_change : (log.amount || 0),
            created_at: log.created_at || log.activated_at || new Date().toISOString()
          }));
          
          setHistory(formattedHistory);
        }

        // 2. جلب لوحة الشرف
        const boardData = await getLeaderboard();
        console.log("البيانات القادمة من السيرفر للوحة الشرف:", boardData);

        // ترتيب الطلاب وإضافة رقم المركز (Rank) مع حماية الـ Fallback للحقول
        const sortedBoard = (boardData || [])
          .map((item: any) => ({
            id: item.id,
            // لو الاسم مش name ومكتوب في الداتابيز full_name يلقطه فوراً منعاً للكراش
            name: item.name || item.full_name || 'طالب لوفيا المتميز 🎓', 
            points: item.points || 0,
          }))
          .sort((a: any, b: any) => b.points - a.points)
          .map((item: any, index: number) => ({
            ...item,
            rank: index + 1
          }));

        setLeaderboard(sortedBoard);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // دالة مخصصة لإظهار أيكونة مميزة لأول 3 مراكز
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-amber-500 animate-bounce" />;
      case 2:
        return <Medal className="h-6 w-6 text-slate-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-700" />;
      default:
        return <span className="font-bold text-muted-foreground w-6 text-center">{rank}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px] text-lg font-bold">
        جاري تحميل لوحة الصدارة والأبطال... 🏆
      </div>
    );
  }

  // معرفة مركز الطالب الحالي جوة اللوحة
  const myRankInfo = leaderboard.find(u => u.id === currentUserId);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 dir-rtl text-right">
      
      {/* قسم كارت الصدارة السريع للمستخدِم الحالي */}
      {myRankInfo && (
        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-background border-2 border-primary/30 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary text-primary-foreground rounded-full">
              <Flame className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-lg">مركزي الحالي في المنصة</h2>
              <p className="text-sm text-muted-foreground">استمر في حل الواجبات والاختبارات لتصعد للمركز الأول!</p>
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div className="bg-background px-4 py-2 rounded-lg border shadow-sm">
              <span className="text-xs text-muted-foreground block">الترتيب</span>
              <span className="text-xl font-extrabold text-primary">#{myRankInfo.rank}</span>
            </div>
            <div className="bg-background px-4 py-2 rounded-lg border shadow-sm">
              <span className="text-xs text-muted-foreground block">إجمالي النقاط</span>
              <span className="text-xl font-extrabold text-amber-600 flex items-center gap-1 justify-center">
                {myRankInfo.points} 🪙
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* عمود لوحة الشرف الكاملة */}
        <Card className="lg:col-span-2 border shadow-lg">
          <CardHeader className="bg-secondary/10 border-b">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              قائمة أبطال لوفيا 👑
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] text-center">المركز</TableHead>
                  <TableHead className="text-right">اسم الطالب</TableHead>
                  <TableHead className="text-left">النقاط الكلية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      لا يوجد طلاب في لوحة الشرف حالياً. كن أول المنافسين!
                    </TableCell>
                  </TableRow>
                ) : (
                  leaderboard.map((student) => (
                    <TableRow 
                      key={student.id} 
                      className={`hover:bg-muted/50 transition-colors ${student.id === currentUserId ? 'bg-primary/5 font-bold border-r-4 border-r-primary' : ''}`}
                    >
                      <TableCell className="flex items-center justify-center pt-4">
                        {getRankBadge(student.rank || 0)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {student.name}
                        {student.id === currentUserId && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full mr-2">أنت</span>}
                      </TableCell>
                      <TableCell className="text-left font-bold text-amber-600">
                        {student.points} 🪙
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* عمود تاريخ وسجل النقاط الأخير الخاص بالطالب */}
        <Card className="border shadow-lg h-fit">
          <CardHeader className="bg-secondary/10 border-b">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              سجل نقاطي الأخيرة 🪙
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">
                لم تقم بأي نشاطات منحتك نقاطاً بعد. ابدأ اللعب والتعلم الآن!
              </p>
            ) : (
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {history.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex justify-between items-center p-3 bg-muted/40 rounded-lg border hover:bg-muted/70 transition-colors text-sm"
                  >
                    <div>
                      <p className="font-semibold">{log.reason}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleDateString('ar-EG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <span className={`font-bold text-base px-2 py-1 rounded ${log.points_change >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-destructive bg-destructive/5'}`}>
                      {log.points_change >= 0 ? `+${log.points_change}` : log.points_change}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}