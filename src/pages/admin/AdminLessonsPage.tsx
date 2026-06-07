import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllCourses, getLessonsByCourse, createLesson, updateLesson, deleteLesson, getLessonAttachments, createLessonAttachment, deleteLessonAttachment } from '@/db/api';
import { supabase } from '@/db/supabase';
import type { Course, Lesson, LessonAttachment } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, FileText, Upload, Download, Award } from 'lucide-react';

export default function AdminLessonsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [attachments, setAttachments] = useState<LessonAttachment[]>([]);
  const { t, language } = useLanguage();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title_ar: '',
    title_en: '',
    google_drive_video_id: '',
    order_index: '',
  });

  // Exam form state
  const [examFormData, setExamFormData] = useState({
    title_ar: '',
    title_en: '',
    exam_duration: '',
    passing_score: '',
    order_index: '',
    questions: [] as Array<{
      question_ar: string;
      question_en: string;
      type: 'single' | 'multiple';
      options: Array<{ text_ar: string; text_en: string }>;
      correct_answers: number[];
    }>,
  });

  // Attachment form state
  const [attachmentForm, setAttachmentForm] = useState({
    name_ar: '',
    name_en: '',
    file: null as File | null,
  });

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadLessons();
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

  const loadLessons = async () => {
    if (!selectedCourseId) return;
    setLoading(true);
    try {
      const data = await getLessonsByCourse(selectedCourseId);
      setLessons(data);
    } catch (error) {
      console.error('Error loading lessons:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل تحميل الدروس', 'Failed to load lessons'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson);
      setFormData({
        title_ar: lesson.title_ar,
        title_en: lesson.title_en,
        google_drive_video_id: lesson.google_drive_video_id || '',
        order_index: lesson.order_index.toString(),
      });
    } else {
      setEditingLesson(null);
      setFormData({
        title_ar: '',
        title_en: '',
        google_drive_video_id: '',
        order_index: (lessons.length + 1).toString(),
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCourseId) {
      toast({
        title: t('خطأ', 'Error'),
        description: t('يجب اختيار كورس', 'Please select a course'),
        variant: 'destructive',
      });
      return;
    }

    if (!formData.title_ar || !formData.title_en) {
      toast({
        title: t('خطأ', 'Error'),
        description: t('يجب إدخال عنوان الدرس بالعربية والإنجليزية', 'Lesson title in both languages is required'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const lessonData = {
        course_id: selectedCourseId,
        title_ar: formData.title_ar,
        title_en: formData.title_en,
        google_drive_video_id: formData.google_drive_video_id || null,
        order_index: parseInt(formData.order_index) || lessons.length + 1,
      };

      if (editingLesson) {
        await updateLesson(editingLesson.id, lessonData);
        toast({
          title: t('تم التحديث', 'Updated'),
          description: t('تم تحديث الدرس بنجاح', 'Lesson updated successfully'),
        });
      } else {
        await createLesson(lessonData as any);
        toast({
          title: t('تم الإنشاء', 'Created'),
          description: t('تم إنشاء الدرس بنجاح', 'Lesson created successfully'),
        });
      }

      setDialogOpen(false);
      loadLessons();
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل حفظ الدرس', 'Failed to save lesson'),
        variant: 'destructive',
      });
    }
  };

  const handleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCourseId) {
      toast({
        title: t('خطأ', 'Error'),
        description: t('يجب اختيار كورس', 'Please select a course'),
        variant: 'destructive',
      });
      return;
    }

    if (!examFormData.title_ar || !examFormData.title_en) {
      toast({
        title: t('خطأ', 'Error'),
        description: t('يجب إدخال عنوان الامتحان بالعربية والإنجليزية', 'Exam title in both languages is required'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const examLessonData = {
        course_id: selectedCourseId,
        title_ar: examFormData.title_ar,
        title_en: examFormData.title_en,
        lesson_type: 'exam',
        google_drive_video_id: null,
        exam_duration: parseInt(examFormData.exam_duration) || 60,
        passing_score: parseInt(examFormData.passing_score) || 70,
        exam_questions: examFormData.questions,
        order_index: parseInt(examFormData.order_index) || lessons.length + 1,
      };

      await createLesson(examLessonData as any);
      toast({
        title: t('تم الإنشاء', 'Created'),
        description: t('تم إنشاء الامتحان الشامل بنجاح', 'Comprehensive exam created successfully'),
      });

      setExamDialogOpen(false);
      resetExamForm();
      loadLessons();
    } catch (error) {
      console.error('Error creating exam:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل إنشاء الامتحان', 'Failed to create exam'),
        variant: 'destructive',
      });
    }
  };

  const resetExamForm = () => {
    setExamFormData({
      title_ar: '',
      title_en: '',
      exam_duration: '',
      passing_score: '',
      order_index: '',
      questions: [],
    });
  };

  const addExamQuestion = () => {
    setExamFormData({
      ...examFormData,
      questions: [
        ...examFormData.questions,
        {
          question_ar: '',
          question_en: '',
          type: 'single',
          options: [
            { text_ar: '', text_en: '' },
            { text_ar: '', text_en: '' },
          ],
          correct_answers: [],
        },
      ],
    });
  };

  const removeExamQuestion = (index: number) => {
    const newQuestions = [...examFormData.questions];
    newQuestions.splice(index, 1);
    setExamFormData({ ...examFormData, questions: newQuestions });
  };

  const updateExamQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...examFormData.questions];
    (newQuestions[index] as any)[field] = value;
    setExamFormData({ ...examFormData, questions: newQuestions });
  };

  const addExamOption = (questionIndex: number) => {
    const newQuestions = [...examFormData.questions];
    newQuestions[questionIndex].options.push({ text_ar: '', text_en: '' });
    setExamFormData({ ...examFormData, questions: newQuestions });
  };

  const removeExamOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...examFormData.questions];
    newQuestions[questionIndex].options.splice(optionIndex, 1);
    setExamFormData({ ...examFormData, questions: newQuestions });
  };

  const updateExamOption = (questionIndex: number, optionIndex: number, field: 'text_ar' | 'text_en', value: string) => {
    const newQuestions = [...examFormData.questions];
    newQuestions[questionIndex].options[optionIndex][field] = value;
    setExamFormData({ ...examFormData, questions: newQuestions });
  };

  const toggleCorrectAnswer = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...examFormData.questions];
    const question = newQuestions[questionIndex];
    const correctAnswers = [...question.correct_answers];
    
    if (question.type === 'single') {
      question.correct_answers = [optionIndex];
    } else {
      const index = correctAnswers.indexOf(optionIndex);
      if (index > -1) {
        correctAnswers.splice(index, 1);
      } else {
        correctAnswers.push(optionIndex);
      }
      question.correct_answers = correctAnswers;
    }
    
    setExamFormData({ ...examFormData, questions: newQuestions });
  };

  const handleDelete = async (lessonId: string) => {
    try {
      await deleteLesson(lessonId);
      toast({
        title: t('تم الحذف', 'Deleted'),
        description: t('تم حذف الدرس بنجاح', 'Lesson deleted successfully'),
      });
      loadLessons();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل حذف الدرس', 'Failed to delete lesson'),
        variant: 'destructive',
      });
    }
  };

  const handleOpenAttachmentDialog = async (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setAttachmentForm({ name_ar: '', name_en: '', file: null });
    try {
      const data = await getLessonAttachments(lesson.id);
      setAttachments(data);
    } catch (error) {
      console.error('Error loading attachments:', error);
    }
    setAttachmentDialogOpen(true);
  };

  const handleUploadAttachment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLesson || !attachmentForm.file) {
      toast({
        title: t('خطأ', 'Error'),
        description: t('يجب اختيار ملف', 'Please select a file'),
        variant: 'destructive',
      });
      return;
    }

    try {
      // Upload file to Supabase Storage
      const fileExt = attachmentForm.file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${selectedLesson.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('lesson-attachments')
        .upload(filePath, attachmentForm.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('lesson-attachments')
        .getPublicUrl(filePath);

      // Create attachment record
      await createLessonAttachment({
        lesson_id: selectedLesson.id,
        name_ar: attachmentForm.name_ar || attachmentForm.file.name,
        name_en: attachmentForm.name_en || attachmentForm.file.name,
        file_url: urlData.publicUrl,
        file_type: fileExt || null,
      });

      toast({
        title: t('تم الرفع', 'Uploaded'),
        description: t('تم رفع الملف بنجاح', 'File uploaded successfully'),
      });

      // Reload attachments
      const data = await getLessonAttachments(selectedLesson.id);
      setAttachments(data);
      setAttachmentForm({ name_ar: '', name_en: '', file: null });
    } catch (error) {
      console.error('Error uploading attachment:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل رفع الملف', 'Failed to upload file'),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await deleteLessonAttachment(attachmentId);
      toast({
        title: t('تم الحذف', 'Deleted'),
        description: t('تم حذف الملف بنجاح', 'File deleted successfully'),
      });
      if (selectedLesson) {
        const data = await getLessonAttachments(selectedLesson.id);
        setAttachments(data);
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل حذف الملف', 'Failed to delete file'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{t('إدارة الدروس', 'Lesson Management')}</CardTitle>
              <CardDescription>
                {t('إضافة وتعديل وحذف الدروس داخل الكورسات', 'Add, edit, and delete lessons within courses')}
              </CardDescription>
            </div>
            {selectedCourseId && (
              <div className="flex gap-2">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleOpenDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('إضافة درس', 'Add Lesson')}
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingLesson ? t('تعديل الدرس', 'Edit Lesson') : t('إضافة درس جديد', 'Add New Lesson')}
                    </DialogTitle>
                    <DialogDescription>
                      {t('أدخل بيانات الدرس بالعربية والإنجليزية', 'Enter lesson details in Arabic and English')}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title_ar">{t('عنوان الدرس (عربي)', 'Lesson Title (Arabic)')} *</Label>
                        <Input
                          id="title_ar"
                          value={formData.title_ar}
                          onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title_en">{t('عنوان الدرس (إنجليزي)', 'Lesson Title (English)')} *</Label>
                        <Input
                          id="title_en"
                          value={formData.title_en}
                          onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="video_id">{t('Google Drive Video ID', 'Google Drive Video ID')}</Label>
                      <Input
                        id="video_id"
                        value={formData.google_drive_video_id}
                        onChange={(e) => setFormData({ ...formData, google_drive_video_id: e.target.value })}
                        placeholder="1a2b3c4d5e6f7g8h9i0j"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="order">{t('الترتيب', 'Order')}</Label>
                      <Input
                        id="order"
                        type="number"
                        value={formData.order_index}
                        onChange={(e) => setFormData({ ...formData, order_index: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        {t('إلغاء', 'Cancel')}
                      </Button>
                      <Button type="submit">
                        {editingLesson ? t('تحديث', 'Update') : t('إنشاء', 'Create')}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={examDialogOpen} onOpenChange={setExamDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" onClick={() => setExamDialogOpen(true)}>
                    <Award className="h-4 w-4 mr-2" />
                    {t('إضافة امتحان شامل', 'Add Comprehensive Exam')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t('إضافة امتحان شامل', 'Add Comprehensive Exam')}</DialogTitle>
                    <DialogDescription>
                      {t('أدخل بيانات الامتحان الشامل والأسئلة', 'Enter comprehensive exam details and questions')}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleExamSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('عنوان الامتحان (عربي)', 'Exam Title (Arabic)')} *</Label>
                        <Input
                          value={examFormData.title_ar}
                          onChange={(e) => setExamFormData({ ...examFormData, title_ar: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('عنوان الامتحان (إنجليزي)', 'Exam Title (English)')} *</Label>
                        <Input
                          value={examFormData.title_en}
                          onChange={(e) => setExamFormData({ ...examFormData, title_en: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>{t('مدة الامتحان (دقيقة)', 'Duration (minutes)')}</Label>
                        <Input
                          type="number"
                          value={examFormData.exam_duration}
                          onChange={(e) => setExamFormData({ ...examFormData, exam_duration: e.target.value })}
                          placeholder="60"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('درجة النجاح (%)', 'Passing Score (%)')}</Label>
                        <Input
                          type="number"
                          value={examFormData.passing_score}
                          onChange={(e) => setExamFormData({ ...examFormData, passing_score: e.target.value })}
                          placeholder="70"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('الترتيب', 'Order')}</Label>
                        <Input
                          type="number"
                          value={examFormData.order_index}
                          onChange={(e) => setExamFormData({ ...examFormData, order_index: e.target.value })}
                          placeholder={String(lessons.length + 1)}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-lg">{t('الأسئلة', 'Questions')}</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addExamQuestion}>
                          <Plus className="h-4 w-4 mr-2" />
                          {t('إضافة سؤال', 'Add Question')}
                        </Button>
                      </div>

                      {examFormData.questions.map((question, qIndex) => (
                        <Card key={qIndex} className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label>{t('سؤال', 'Question')} {qIndex + 1}</Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeExamQuestion(qIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <Input
                                placeholder={t('نص السؤال (عربي)', 'Question text (Arabic)')}
                                value={question.question_ar}
                                onChange={(e) => updateExamQuestion(qIndex, 'question_ar', e.target.value)}
                              />
                              <Input
                                placeholder={t('نص السؤال (إنجليزي)', 'Question text (English)')}
                                value={question.question_en}
                                onChange={(e) => updateExamQuestion(qIndex, 'question_en', e.target.value)}
                              />
                            </div>

                            <Select
                              value={question.type}
                              onValueChange={(value) => updateExamQuestion(qIndex, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="single">{t('اختيار واحد', 'Single Choice')}</SelectItem>
                                <SelectItem value="multiple">{t('اختيارات متعددة', 'Multiple Choice')}</SelectItem>
                              </SelectContent>
                            </Select>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm">{t('الخيارات', 'Options')}</Label>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addExamOption(qIndex)}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  {t('خيار', 'Option')}
                                </Button>
                              </div>

                              {question.options.map((option, oIndex) => (
                                <div key={oIndex} className="flex items-center gap-2">
                                  <input
                                    type={question.type === 'single' ? 'radio' : 'checkbox'}
                                    checked={question.correct_answers.includes(oIndex)}
                                    onChange={() => toggleCorrectAnswer(qIndex, oIndex)}
                                    className="mt-2"
                                  />
                                  <Input
                                    placeholder={t('خيار (عربي)', 'Option (Arabic)')}
                                    value={option.text_ar}
                                    onChange={(e) => updateExamOption(qIndex, oIndex, 'text_ar', e.target.value)}
                                    className="flex-1"
                                  />
                                  <Input
                                    placeholder={t('خيار (إنجليزي)', 'Option (English)')}
                                    value={option.text_en}
                                    onChange={(e) => updateExamOption(qIndex, oIndex, 'text_en', e.target.value)}
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeExamOption(qIndex, oIndex)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setExamDialogOpen(false)}>
                        {t('إلغاء', 'Cancel')}
                      </Button>
                      <Button type="submit">
                        {t('إنشاء الامتحان', 'Create Exam')}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('اختر الكورس', 'Select Course')}</Label>
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
              ) : lessons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>{t('لا توجد دروس في هذا الكورس', 'No lessons in this course yet')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('الترتيب', 'Order')}</TableHead>
                      <TableHead>{t('العنوان', 'Title')}</TableHead>
                      <TableHead>{t('الفيديو', 'Video')}</TableHead>
                      <TableHead className="text-right">{t('الإجراءات', 'Actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lessons.map((lesson) => (
                      <TableRow key={lesson.id}>
                        <TableCell>{lesson.order_index}</TableCell>
                        <TableCell className="font-medium">
                          {language === 'ar' ? lesson.title_ar : lesson.title_en}
                        </TableCell>
                        <TableCell>
                          {lesson.google_drive_video_id ? (
                            <span className="text-xs text-green-600">{t('متوفر', 'Available')}</span>
                          ) : (
                            <span className="text-xs text-gray-400">{t('غير متوفر', 'Not available')}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenAttachmentDialog(lesson)}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDialog(lesson)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('تأكيد الحذف', 'Confirm Deletion')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('هل أنت متأكد من حذف هذا الدرس؟', 'Are you sure you want to delete this lesson?')}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('إلغاء', 'Cancel')}</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(lesson.id)}>
                                    {t('حذف', 'Delete')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Attachment Dialog */}
      <Dialog open={attachmentDialogOpen} onOpenChange={setAttachmentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('إدارة مرفقات الدرس', 'Manage Lesson Attachments')}</DialogTitle>
            <DialogDescription>
              {selectedLesson && (language === 'ar' ? selectedLesson.title_ar : selectedLesson.title_en)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <form onSubmit={handleUploadAttachment} className="space-y-4 border-b pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('اسم الملف (عربي)', 'File Name (Arabic)')}</Label>
                  <Input
                    value={attachmentForm.name_ar}
                    onChange={(e) => setAttachmentForm({ ...attachmentForm, name_ar: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('اسم الملف (إنجليزي)', 'File Name (English)')}</Label>
                  <Input
                    value={attachmentForm.name_en}
                    onChange={(e) => setAttachmentForm({ ...attachmentForm, name_en: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('الملف', 'File')}</Label>
                <Input
                  type="file"
                  onChange={(e) => setAttachmentForm({ ...attachmentForm, file: e.target.files?.[0] || null })}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                />
              </div>
              <Button type="submit" className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                {t('رفع الملف', 'Upload File')}
              </Button>
            </form>

            <div className="space-y-2">
              <h4 className="font-semibold">{t('المرفقات الحالية', 'Current Attachments')}</h4>
              {attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('لا توجد مرفقات', 'No attachments')}</p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">
                          {language === 'ar' ? attachment.name_ar : attachment.name_en}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(attachment.file_url, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('تأكيد الحذف', 'Confirm Deletion')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('هل أنت متأكد من حذف هذا الملف؟', 'Are you sure you want to delete this file?')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('إلغاء', 'Cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteAttachment(attachment.id)}>
                                {t('حذف', 'Delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
