import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllCourses, generateVoucher, getVouchersByCourse } from '@/db/api';
import type { Course, Voucher } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Ticket, Copy, CheckCircle, XCircle } from 'lucide-react';

export default function AdminVouchersPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const { t, language } = useLanguage();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    course_id: '',
    expiry_date: '',
    count: '1',
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
    if (!selectedCourseId) return;
    setLoading(true);
    try {
      const data = await getVouchersByCourse(selectedCourseId);
      setVouchers(data);
    } catch (error) {
      console.error('Error loading vouchers:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل تحميل الأكواد', 'Failed to load vouchers'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.course_id) {
      toast({
        title: t('خطأ', 'Error'),
        description: t('يجب اختيار كورس', 'Please select a course'),
        variant: 'destructive',
      });
      return;
    }

    const count = parseInt(formData.count) || 1;
    const codes: string[] = [];

    try {
      for (let i = 0; i < count; i++) {
        const voucher = await generateVoucher(
          formData.course_id,
          formData.expiry_date || undefined
        );
        codes.push(voucher.code);
      }

      setGeneratedCode(codes.join('\n'));
      toast({
        title: t('تم التوليد', 'Generated'),
        description: t(`تم توليد ${count} كود بنجاح`, `Successfully generated ${count} voucher(s)`),
      });

      if (selectedCourseId === formData.course_id) {
        loadVouchers();
      }
    } catch (error) {
      console.error('Error generating voucher:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل توليد الكود', 'Failed to generate voucher'),
        variant: 'destructive',
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: t('تم النسخ', 'Copied'),
      description: t('تم نسخ الكود', 'Code copied to clipboard'),
    });
  };

  const handleCopyAllCodes = () => {
    navigator.clipboard.writeText(generatedCode);
    toast({
      title: t('تم النسخ', 'Copied'),
      description: t('تم نسخ جميع الأكواد', 'All codes copied to clipboard'),
    });
  };

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{t('إدارة الأكواد', 'Voucher Management')}</CardTitle>
              <CardDescription>
                {t('توليد وتتبع أكواد التفعيل', 'Generate and track activation codes')}
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setGeneratedCode(''); setFormData({ course_id: '', expiry_date: '', count: '1' }); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('توليد كود', 'Generate Voucher')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('توليد أكواد تفعيل', 'Generate Vouchers')}</DialogTitle>
                  <DialogDescription>
                    {t('اختر الكورس وعدد الأكواد المطلوبة', 'Select course and number of vouchers')}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="course">{t('الكورس', 'Course')} *</Label>
                    <Select value={formData.course_id} onValueChange={(value) => setFormData({ ...formData, course_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('اختر كورس', 'Select a course')} />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {language === 'ar' ? course.title_ar : course.title_en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="count">{t('عدد الأكواد', 'Number of Vouchers')}</Label>
                    <Input
                      id="count"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.count}
                      onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry">{t('تاريخ الانتهاء (اختياري)', 'Expiry Date (Optional)')}</Label>
                    <Input
                      id="expiry"
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    />
                  </div>

                  {generatedCode && (
                    <div className="space-y-2">
                      <Label>{t('الأكواد المولدة', 'Generated Codes')}</Label>
                      <div className="relative">
                        <Textarea
                          value={generatedCode}
                          readOnly
                          rows={5}
                          className="font-mono text-sm"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2"
                          onClick={handleCopyAllCodes}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      {t('إغلاق', 'Close')}
                    </Button>
                    <Button type="submit">
                      {t('توليد', 'Generate')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('اختر الكورس لعرض الأكواد', 'Select Course to View Vouchers')}</Label>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger>
                <SelectValue placeholder={t('اختر كورس', 'Select a course')} />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {language === 'ar' ? course.title_ar : course.title_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCourseId && (
            <>
              {loading ? (
                <div className="text-center py-8">{t('جاري التحميل...', 'Loading...')}</div>
              ) : vouchers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Ticket className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>{t('لا توجد أكواد لهذا الكورس', 'No vouchers for this course yet')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>{t('إجمالي الأكواد', 'Total Vouchers')}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{vouchers.length}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>{t('المستخدمة', 'Used')}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {vouchers.filter(v => v.is_used).length}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>{t('المتاحة', 'Available')}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                          {vouchers.filter(v => !v.is_used).length}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('الكود', 'Code')}</TableHead>
                        <TableHead>{t('الحالة', 'Status')}</TableHead>
                        <TableHead>{t('تاريخ الانتهاء', 'Expiry Date')}</TableHead>
                        <TableHead>{t('تاريخ الاستخدام', 'Used At')}</TableHead>
                        <TableHead className="text-right">{t('الإجراءات', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vouchers.map((voucher) => (
                        <TableRow key={voucher.id}>
                          <TableCell className="font-mono font-semibold">{voucher.code}</TableCell>
                          <TableCell>
                            {voucher.is_used ? (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                {t('مستخدم', 'Used')}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-blue-600">
                                <XCircle className="h-4 w-4" />
                                {t('متاح', 'Available')}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {voucher.expiry_date ? new Date(voucher.expiry_date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '-'}
                          </TableCell>
                          <TableCell>
                            {voucher.used_at ? new Date(voucher.used_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyCode(voucher.code)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
