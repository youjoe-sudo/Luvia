import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllCourses, generateVoucher, getVouchersByCourse } from '@/db/api';
import type { Course, Voucher } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Ticket, Copy, CheckCircle, XCircle, Search, Sparkles, Zap } from 'lucide-react';

export default function AdminVouchersPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const { t, language } = useLanguage();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    course_id: '',
    expiry_days: '30',
  });

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadVouchers();
    }
  }, [selectedCourseId]);

  const loadCourses = async () => {
    try {
      const data = await getAllCourses(false);
      setCourses(data);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadVouchers = async () => {
    setLoading(true);
    try {
      const data = await getVouchersByCourse(selectedCourseId);
      setVouchers(data);
    } catch (error) {
      console.error('Error loading vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(formData.expiry_days));

      const voucher = await generateVoucher(formData.course_id, expiryDate.toISOString());
      setGeneratedCode(voucher.code);
      if (selectedCourseId === formData.course_id) {
        loadVouchers();
      }
      toast({
        title: t('تم إنشاء الكود', 'Voucher Generated'),
        description: t('تم إنشاء كود الاشتراك بنجاح', 'Subscription voucher created successfully'),
      });
    } catch (error) {
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل إنشاء الكود', 'Failed to generate voucher'),
        variant: 'destructive',
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: t('تم النسخ', 'Copied'),
      description: t('تم نسخ الكود إلى الحافظة', 'Code copied to clipboard'),
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700" dir="ltr">
      <Card className="bg-[#0a0f1e] border-white/5 shadow-2xl rounded-[2rem] overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/5 p-6 md:p-10">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black italic flex items-center gap-3">
              <Ticket className="w-8 h-8 text-blue-500" />
              {t('أكواد الاشتراك', 'VOUCHER SYSTEM')}
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              {t('توليد وإدارة أكواد الوصول للكورسات المدفوعة', 'Generate and manage access codes for premium courses')}
            </CardDescription>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="w-full md:w-64">
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl text-white">
                  <SelectValue placeholder={t('تصفية حسب الكورس', 'Filter by Course')} />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0f1e] border-white/10 text-white">
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {language === 'ar' ? course.title_ar : course.title_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={() => setDialogOpen(true)} 
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-6 h-12 font-bold shadow-[0_0_20px_rgba(37,99,235,0.3)]"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('إنشاء كود', 'New Voucher')}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {!selectedCourseId ? (
            <div className="flex flex-col items-center justify-center py-24 opacity-30">
              <Search className="h-16 w-16 mb-4 text-blue-500" />
              <p className="font-mono text-xs uppercase tracking-[0.2em]">{t('اختر كورس لعرض الأكواد', 'SELECT_COURSE_TO_VIEW_CODES')}</p>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Sparkles className="h-8 w-8 text-blue-500 animate-pulse mb-4" />
              <p className="font-mono text-[10px] text-blue-400 uppercase tracking-widest">{t('جاري التحميل...', 'FETCHING_DATA...')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              {vouchers.length === 0 ? (
                <div className="text-center py-20 text-slate-600 font-mono text-xs uppercase tracking-widest">
                  {t('لا توجد أكواد لهذا الكورس', 'NO_VOUCHERS_FOUND')}
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="hover:bg-transparent border-white/5">
                      <TableHead className="font-black uppercase text-[10px] tracking-widest py-6 px-8">{t('الكود', 'CODE')}</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">{t('الحالة', 'STATUS')}</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">{t('تاريخ الانتهاء', 'EXPIRY')}</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">{t('تاريخ الاستخدام', 'USED AT')}</TableHead>
                      <TableHead className="text-right px-8 font-black uppercase text-[10px] tracking-widest">{t('نسخ', 'COPY')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vouchers.map((voucher) => (
                      <TableRow key={voucher.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <TableCell className="py-5 px-8">
                          <span className="font-mono font-black text-blue-400 tracking-wider bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                            {voucher.code}
                          </span>
                        </TableCell>
                        <TableCell>
                          {voucher.is_used ? (
                            <div className="flex items-center gap-2 text-red-500/70 text-[10px] font-black uppercase tracking-tighter">
                              <XCircle className="h-4 w-4" />
                              {t('مستخدم', 'USED')}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-tighter">
                              <CheckCircle className="h-4 w-4" />
                              {t('متاح', 'AVAILABLE')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-slate-500">
                          {voucher.expiry_date ? new Date(voucher.expiry_date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US') : '-'}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-slate-500">
                          {voucher.used_at ? new Date(voucher.used_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US') : '-'}
                        </TableCell>
                        <TableCell className="text-right px-8">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyCode(voucher.code)}
                            className="hover:bg-blue-500/20 text-blue-400 transition-all active:scale-90"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) setGeneratedCode('');
      }}>
        <DialogContent className="max-w-md bg-[#0a0f1e] border-white/10 text-white rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic uppercase flex items-center gap-3">
              <Zap className="w-6 h-6 text-yellow-500" />
              {t('توليد كود جديد', 'GENERATE VOUCHER')}
            </DialogTitle>
            <DialogDescription className="text-slate-500 pt-2">
              {t('سيتم إنشاء كود اشتراك فريد يمكن استخدامه مرة واحدة.', 'Create a unique, one-time use access code.')}
            </DialogDescription>
          </DialogHeader>

          {generatedCode ? (
            <div className="space-y-6 py-6 text-center animate-in zoom-in-95 duration-300">
              <div className="p-8 bg-blue-500/10 rounded-[2rem] border border-blue-500/20 relative group">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-[10px] font-black px-4 py-1 rounded-full shadow-lg">READY</div>
                <p className="text-4xl font-black font-mono tracking-widest text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                  {generatedCode}
                </p>
              </div>
              <Button 
                onClick={() => handleCopyCode(generatedCode)} 
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg gap-2"
              >
                <Copy className="w-5 h-5" />
                {t('نسخ الكود ومتابعة', 'COPY & CONTINUE')}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleGenerate} className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('الكورس المستهدف', 'TARGET COURSE')}</Label>
                <Select value={formData.course_id} onValueChange={(v) => setFormData({ ...formData, course_id: v })} required>
                  <SelectTrigger className="bg-white/5 border-white/10 h-14 rounded-2xl">
                    <SelectValue placeholder={t('اختر الكورس', 'Select Course')} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0f1e] border-white/10 text-white">
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {language === 'ar' ? course.title_ar : course.title_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('صلاحية الكود (أيام)', 'VALIDITY (DAYS)')}</Label>
                <Input
                  type="number"
                  className="bg-white/5 border-white/10 h-14 rounded-2xl font-mono"
                  value={formData.expiry_days}
                  onChange={(e) => setFormData({ ...formData, expiry_days: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} className="flex-1 h-14 rounded-2xl text-slate-400">
                  {t('إلغاء', 'Cancel')}
                </Button>
                <Button type="submit" className="flex-[2] h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black shadow-lg">
                  {t('توليد الكود', 'GENERATE NOW')}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}