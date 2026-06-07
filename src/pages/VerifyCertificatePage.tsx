import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, CheckCircle2, XCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { verifyCertificate } from '@/db/api';
import { useToast } from '@/hooks/use-toast';

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
  // Auto-verify if there's an ID in URL
  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    console.log('معرف من URL:', idFromUrl);
    if (idFromUrl && idFromUrl.trim()) {
      setCertificateId(idFromUrl);
      // استخدام setTimeout لضمان تحديث الحالة أولاً
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-12">
        {/* الرأس / Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Shield className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-3">التحقق من الشهادة</h1>
          <p className="text-muted-foreground text-lg">
            تحقق من صحة الشهادة باستخدام معرف الشهادة
          </p>
        </div>

        {/* نموذج البحث / Search form */}
        <Card className="max-w-2xl mx-auto mb-8">
          <CardHeader>
            <CardTitle>أدخل معرف الشهادة</CardTitle>
            <CardDescription>
              يمكنك العثور على معرف الشهادة في أسفل الشهادة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="أدخل معرف الشهادة هنا..."
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-lg"
                dir="ltr"
              />
              <Button 
                onClick={() => handleVerify()} 
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    جاري التحقق...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    تحقق
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* نتيجة التحقق - شهادة صحيحة / Verification result - Valid */}
        {verificationResult && (
          <Card className="max-w-3xl mx-auto border-2 border-green-500">
            <CardHeader className="bg-green-50 dark:bg-green-950">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <div>
                  <CardTitle className="text-green-700 dark:text-green-400">
                    شهادة صحيحة ✓
                  </CardTitle>
                  <CardDescription>
                    تم التحقق من صحة هذه الشهادة بنجاح
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* معلومات الشهادة / Certificate information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    اسم الطالب
                  </h3>
                  <p className="text-lg font-semibold">
                    {verificationResult.student_full_name}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    اسم الدورة
                  </h3>
                  <p className="text-lg font-semibold">
                    {verificationResult.courses?.title_ar || verificationResult.courses?.title_en}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    تاريخ الإصدار
                  </h3>
                  <p className="text-lg font-semibold">
                    {new Date(verificationResult.issued_at).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    المدرب
                  </h3>
                  <p className="text-lg font-semibold">
                    {verificationResult.instructor_signature_text || 
                     verificationResult.courses?.instructor_name_ar || 
                     verificationResult.courses?.instructor_name_en}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    معرف الشهادة
                  </h3>
                  <p className="text-sm font-mono bg-muted p-3 rounded-md break-all">
                    {verificationResult.id}
                  </p>
                </div>
              </div>

              {/* رسالة التأكيد / Confirmation message */}
              <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 dark:text-green-400">
                  هذه الشهادة صادرة من منصة Luvia وموثقة في نظامنا. يمكنك الوثوق بصحتها.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* نتيجة التحقق - شهادة غير موجودة / Verification result - Not found */}
        {notFound && (
          <Card className="max-w-3xl mx-auto border-2 border-red-500">
            <CardHeader className="bg-red-50 dark:bg-red-950">
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-600" />
                <div>
                  <CardTitle className="text-red-700 dark:text-red-400">
                    شهادة غير صحيحة ✗
                  </CardTitle>
                  <CardDescription>
                    لم يتم العثور على هذه الشهادة في نظامنا
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>تحذير:</strong> معرف الشهادة الذي أدخلته غير موجود في قاعدة بياناتنا. 
                  قد تكون الشهادة مزورة أو تم إدخال المعرف بشكل خاطئ. 
                  الرجاء التحقق من المعرف والمحاولة مرة أخرى.
                </AlertDescription>
              </Alert>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">نصائح للتحقق:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>تأكد من نسخ معرف الشهادة بالكامل</li>
                  <li>تحقق من عدم وجود مسافات إضافية في البداية أو النهاية</li>
                  <li>معرف الشهادة يكون عادة في أسفل الشهادة</li>
                  <li>إذا استمرت المشكلة، تواصل مع الدعم الفني</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* معلومات إضافية / Additional information */}
        {!verificationResult && !notFound && (
          <div className="max-w-3xl mx-auto mt-12">
            <Card>
              <CardHeader>
                <CardTitle>كيفية التحقق من الشهادة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">احصل على معرف الشهادة</h3>
                    <p className="text-sm text-muted-foreground">
                      ستجد معرف الشهادة في أسفل الشهادة، عادة بجانب التوقيع أو التاريخ
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">أدخل المعرف</h3>
                    <p className="text-sm text-muted-foreground">
                      انسخ المعرف بالكامل والصقه في حقل البحث أعلاه
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">اضغط على زر التحقق</h3>
                    <p className="text-sm text-muted-foreground">
                      سيتم التحقق من الشهادة فوراً وعرض النتيجة
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
