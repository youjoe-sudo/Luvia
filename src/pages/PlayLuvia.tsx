import { useState } from 'react';
import { executeDailySpin, type SpinResult } from '@/db/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner'; // أو حسب مكتبة الـ toast المستخدمة عندك (sonner أو use-toast)
import { Gift, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function PlayLuvia() {
  const { user } = useAuth();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prizeMessage, setPrizeMessage] = useState<string | null>(null);

  // المصفوفة دي مطابقة تماماً للي كتبناها جوة الداتابيز عشان شكل العجلة يطابق الواقع
  const sectors = [5, 10, 15, 20, 50]; 
  const sectorDegrees = 360 / sectors.length;

  const handleSpin = async () => {
    if (isSpinning || !user) return;

    setIsSpinning(true);
    setPrizeMessage(null);

    try {
      // 1. نادي الدالة الذكية من الباك إند
      const result: SpinResult = await executeDailySpin(user.id);

      if (!result.success) {
        toast.error(result.message);
        setIsSpinning(false);
        return;
      }

      // 2. تحديد الزاوية بناءً على النقطة اللي فاز بيها من السيرفر
      const wonPoints = result.rewardPoints || 5;
      const sectorIndex = sectors.indexOf(wonPoints);
      
      // حسابات اللفة: عدد لفات كاملة (5 لفات) + زاوية السهم الموجه للمكسب
      const extraDegrees = 360 - (sectorIndex * sectorDegrees) - (sectorDegrees / 2);
      const totalRotation = rotation + (360 * 5) + extraDegrees;
      
      setRotation(totalRotation);

      // 3. انتظر الأنيميشن يخلص (مثلاً 4 ثواني) وعرض النتيجة
      setTimeout(() => {
        setIsSpinning(false);
        setPrizeMessage(result.message);
        toast.success(result.message);
      }, 4000);

    } catch (error) {
      toast.error('حدث خطأ غير متوقع، جرب تاني يا بطل.');
      setIsSpinning(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-lg text-center dir-rtl">
      <Card className="border-2 border-primary/20 shadow-xl bg-gradient-to-b from-background to-secondary/10">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2 text-primary">
            <Sparkles className="h-6 w-6 text-amber-500 animate-pulse" />
            عجلة الحظ اليومية 🎡
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-6">
          <p className="text-muted-foreground text-sm">
            جرب حظك كل 24 ساعة واكسب نقاط لوفيا إضافية تساعدك في صدارة لوحة الشرف!
          </p>

          {/* الهيكل الخارجي للعجلة والسهم */}
          <div className="relative w-72 h-72 my-4 flex items-center justify-center">
            {/* سهم المؤشر العلوي */}
            <div className="absolute -top-2 z-20 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-destructive drop-shadow-md" />

            {/* جسم العجلة الدوارة */}
            <div
              className="w-full h-full rounded-full border-4 border-primary bg-background shadow-2xl relative overflow-hidden flex items-center justify-center"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.1, 1)' : 'none',
              }}
            >
              {/* تقسيم وتصميم السيكتورز جوة العجلة بـ CSS رائع */}
              {sectors.map((points, index) => (
                <div
                  key={index}
                  className="absolute w-full h-full origin-center flex items-start justify-center pt-8 font-bold text-lg"
                  style={{
                    transform: `rotate(${index * sectorDegrees}deg)`,
                  }}
                >
                  <span 
                    className="bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 shadow-sm"
                    style={{ transform: 'rotate(0deg)' }}
                  >
                    {points} 🪙
                  </span>
                </div>
              ))}
              
              {/* السنتر الداخلي للعجلة */}
              <div className="absolute w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-md flex items-center justify-center z-10 border-2 border-background">
                <Gift className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* زر اللف وعرض النتيجة */}
          <Button
            size="lg"
            className="w-full text-lg font-bold shadow-md"
            disabled={isSpinning}
            onClick={handleSpin}
          >
            {isSpinning ? 'العجلة بتلف... 🎰' : 'إبرم العجلة المحظوظة! 🚀'}
          </Button>

          {prizeMessage && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-center font-bold animate-bounce">
              {prizeMessage}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}