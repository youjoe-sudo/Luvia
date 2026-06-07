import { useEffect, useState, useMemo } from 'react'; // استخدمنا useMemo للأداء
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllDeviceLoginAttempts } from '@/db/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Shield, Search, AlertCircle } from 'lucide-react';

interface DeviceLoginAttempt {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  old_browser_fingerprint: string | null;
  new_browser_fingerprint: string;
  old_ip_address: string | null;
  new_ip_address: string;
  attempted_at: string;
  is_reviewed: boolean;
}

export default function AdminDeviceAttemptsPage() {
  const { t, language } = useLanguage();
  const [attempts, setAttempts] = useState<DeviceLoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null); // إضافة حالة للخطأ

  // 1. لوجيك سحب البيانات مع معالجة الأخطاء
  const loadAttempts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllDeviceLoginAttempts();
      
      // التأكد أن البيانات مصفوفة قبل الحفظ
      if (data && Array.isArray(data)) {
        setAttempts(data as DeviceLoginAttempt[]);
      } else {
        console.warn("Data received is not an array:", data);
        setAttempts([]);
      }
    } catch (err) {
      console.error('Error loading device attempts:', err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttempts();
  }, []);

  // 2. لوجيك التصفية باستخدام useMemo (أسرع وأنضف)
  const filteredAttempts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return attempts;

    return attempts.filter(attempt => {
      // الـ Optional Chaining هنا مهم جداً عشان لو في حقل جاي null الكود ميفصلش
      const name = attempt.user_name?.toLowerCase() || '';
      const email = attempt.user_email?.toLowerCase() || '';
      const ip = attempt.new_ip_address || '';
      
      return name.includes(query) || email.includes(query) || ip.includes(query);
    });
  }, [searchQuery, attempts]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // لو في خطأ في الـ API نظهر رسالة تنبيه
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-red-500">
        <AlertCircle className="w-10 h-10 mb-2" />
        <p>{t('حدث خطأ أثناء تحميل البيانات', 'Error loading data')}</p>
        <button onClick={loadAttempts} className="mt-4 underline text-blue-500">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          {t('محاولات تسجيل الدخول من أجهزة جديدة', 'New Device Login Attempts')}
        </h2>
        <p className="text-muted-foreground">
          {t('مراقبة محاولات تسجيل الدخول من أجهزة أو متصفحات جديدة', 'Monitor login attempts from new devices or browsers')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('البحث والتصفية', 'Search and Filter')}</CardTitle>
          <CardDescription>
            {t('ابحث عن محاولات معينة حسب الاسم أو البريد الإلكتروني أو عنوان IP', 'Search for specific attempts by name, email, or IP address')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('ابحث...', 'Search...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('سجل المحاولات', 'Attempts Log')}</CardTitle>
          <CardDescription>
            {t('إجمالي المحاولات:', 'Total Attempts:')} {filteredAttempts.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAttempts.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? t('لا توجد نتائج للبحث', 'No search results')
                  : t('لا توجد محاولات تسجيل دخول من أجهزة جديدة حالياً', 'No attempts found')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('المستخدم', 'User')}</TableHead>
                    <TableHead>{t('البريد الإلكتروني', 'Email')}</TableHead>
                    <TableHead>{t('عنوان IP الجديد', 'New IP')}</TableHead>
                    <TableHead>{t('التاريخ', 'Date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="font-medium">{attempt.user_name || 'N/A'}</TableCell>
                      <TableCell>{attempt.user_email || 'N/A'}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {attempt.new_ip_address}
                        </code>
                      </TableCell>
                      <TableCell>
                        {attempt.attempted_at ? new Date(attempt.attempted_at).toLocaleString(
                          language === 'ar' ? 'ar-EG' : 'en-US'
                        ) : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}