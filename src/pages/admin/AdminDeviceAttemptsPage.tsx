import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllDeviceLoginAttempts } from '@/db/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Shield, Search } from 'lucide-react';

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
  const [filteredAttempts, setFilteredAttempts] = useState<DeviceLoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAttempts();
  }, []);

  useEffect(() => {
    // تصفية المحاولات بناءً على البحث
    // Filter attempts based on search
    if (searchQuery.trim() === '') {
      setFilteredAttempts(attempts);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = attempts.filter(
        attempt =>
          attempt.user_name.toLowerCase().includes(query) ||
          attempt.user_email.toLowerCase().includes(query) ||
          attempt.new_ip_address.includes(query)
      );
      setFilteredAttempts(filtered);
    }
  }, [searchQuery, attempts]);

  const loadAttempts = async () => {
    setLoading(true);
    try {
      const data = await getAllDeviceLoginAttempts();
      setAttempts(data as any);
      setFilteredAttempts(data as any);
    } catch (error) {
      console.error('Error loading device attempts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
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
                  : t('لا توجد محاولات تسجيل دخول من أجهزة جديدة', 'No new device login attempts')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('المستخدم', 'User')}</TableHead>
                    <TableHead>{t('البريد الإلكتروني', 'Email')}</TableHead>
                    <TableHead>{t('عنوان IP القديم', 'Old IP')}</TableHead>
                    <TableHead>{t('عنوان IP الجديد', 'New IP')}</TableHead>
                    <TableHead>{t('البصمة القديمة', 'Old Fingerprint')}</TableHead>
                    <TableHead>{t('البصمة الجديدة', 'New Fingerprint')}</TableHead>
                    <TableHead>{t('التاريخ', 'Date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="font-medium">{attempt.user_name}</TableCell>
                      <TableCell>{attempt.user_email}</TableCell>
                      <TableCell>
                        {attempt.old_ip_address ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {attempt.old_ip_address}
                          </code>
                        ) : (
                          <Badge variant="secondary">{t('أول تسجيل', 'First Login')}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {attempt.new_ip_address}
                        </code>
                      </TableCell>
                      <TableCell>
                        {attempt.old_browser_fingerprint ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded max-w-[150px] block truncate">
                            {attempt.old_browser_fingerprint.substring(0, 16)}...
                          </code>
                        ) : (
                          <Badge variant="secondary">{t('لا يوجد', 'None')}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded max-w-[150px] block truncate">
                          {attempt.new_browser_fingerprint.substring(0, 16)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        {new Date(attempt.attempted_at).toLocaleString(
                          language === 'ar' ? 'ar-EG' : 'en-US',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
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
