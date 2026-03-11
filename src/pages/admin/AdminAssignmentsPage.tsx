import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllCourses, getLessonsByCourse, createAssignment, getAssignmentsByLesson, getAssignmentSubmissions } from '@/db/api';
import type { Course, Lesson, Assignment, AssignmentSubmission } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, ClipboardList, Trash2, Eye } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

export default function AdminAssignmentsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const { t, language } = useLanguage();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title_ar: '',
    title_en: '',
    description_ar: '',
    description_en: '',
    due_date: '',
    questions: [] as Array<{
      question_ar: string;
      question_en: string;
      type: 'single' | 'multiple';
      options: Array<{ text_ar: string; text_en: string }>;
      correct_answers: number[];
    }>,
  });

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadLessons();
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedLessonId) {
      loadAssignments();
    }
  }, [selectedLessonId]);

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
    try {
      const data = await getLessonsByCourse(selectedCourseId);
      setLessons(data);
    } catch (error) {
      console.error('Error loading lessons:', error);
    }
  };

  const loadAssignments = async () => {
    if (!selectedLessonId) return;
    try {
      const data = await getAssignmentsByLesson(selectedLessonId);
      setAssignments(data);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
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

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setFormData({ ...formData, questions: newQuestions });
  };

  const addOption = (questionIndex: number) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex].options.push({ text_ar: '', text_en: '' });
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateOption = (questionIndex: number, optionIndex: number, field: 'text_ar' | 'text_en', value: string) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex].options[optionIndex][field] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const toggleCorrectAnswer = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...formData.questions];
    const question = newQuestions[questionIndex];
    
    if (question.type === 'single') {
      question.correct_answers = [optionIndex];
    } else {
      const idx = question.correct_answers.indexOf(optionIndex);
      if (idx > -1) {
        question.correct_answers.splice(idx, 1);
      } else {
        question.correct_answers.push(optionIndex);
      }
    }
    
    setFormData({ ...formData, questions: newQuestions });
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

    if (!selectedLessonId) {
      toast({
        title: t('خطأ', 'Error'),
        description: t('يجب اختيار درس', 'Please select a lesson'),
        variant: 'destructive',
      });
      return;
    }

    try {
      await createAssignment({
        course_id: selectedCourseId,
        lesson_id: selectedLessonId,
        title_ar: formData.title_ar,
        title_en: formData.title_en,
        description_ar: formData.description_ar || null,
        description_en: formData.description_en || null,
        due_date: formData.due_date || null,
        questions: formData.questions,
      } as any);

      toast({
        title: t('تم الإنشاء', 'Created'),
        description: t('تم إنشاء الواجب بنجاح', 'Assignment created successfully'),
      });

      setDialogOpen(false);
      loadAssignments();
      resetForm();
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      console.error('Error message:', error?.message);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast({
        title: t('خطأ', 'Error'),
        description: error?.message || t('فشل إنشاء الواجب', 'Failed to create assignment'),
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title_ar: '',
      title_en: '',
      description_ar: '',
      description_en: '',
      due_date: '',
      questions: [],
    });
  };

  const handleViewResults = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    try {
      const data = await getAssignmentSubmissions(assignment.id);
      setSubmissions(data);
      setResultsDialogOpen(true);
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل تحميل النتائج', 'Failed to load results'),
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
              <CardTitle className="text-2xl">{t('إدارة الواجبات', 'Assignment Management')}</CardTitle>
              <CardDescription>
                {t('إنشاء ومتابعة الواجبات', 'Create and track assignments')}
              </CardDescription>
            </div>
            {selectedLessonId && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('إضافة واجب', 'Add Assignment')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t('إنشاء واجب جديد', 'Create New Assignment')}</DialogTitle>
                    <DialogDescription>
                      {t('أضف الأسئلة والإجابات الصحيحة', 'Add questions and correct answers')}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('عنوان الواجب (عربي)', 'Assignment Title (Arabic)')} *</Label>
                        <Input
                          value={formData.title_ar}
                          onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('عنوان الواجب (إنجليزي)', 'Assignment Title (English)')} *</Label>
                        <Input
                          value={formData.title_en}
                          onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('الوصف (عربي)', 'Description (Arabic)')}</Label>
                        <Textarea
                          value={formData.description_ar}
                          onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('الوصف (إنجليزي)', 'Description (English)')}</Label>
                        <Textarea
                          value={formData.description_en}
                          onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('تاريخ التسليم', 'Due Date')}</Label>
                      <Input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-lg">{t('الأسئلة', 'Questions')}</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                          <Plus className="h-4 w-4 mr-2" />
                          {t('إضافة سؤال', 'Add Question')}
                        </Button>
                      </div>

                      {formData.questions.map((question, qIndex) => (
                        <Card key={qIndex}>
                          <CardHeader>
                            <CardTitle className="text-sm">
                              {t('السؤال', 'Question')} {qIndex + 1}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>{t('نص السؤال (عربي)', 'Question Text (Arabic)')}</Label>
                                <Input
                                  value={question.question_ar}
                                  onChange={(e) => updateQuestion(qIndex, 'question_ar', e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>{t('نص السؤال (إنجليزي)', 'Question Text (English)')}</Label>
                                <Input
                                  value={question.question_en}
                                  onChange={(e) => updateQuestion(qIndex, 'question_en', e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>{t('نوع السؤال', 'Question Type')}</Label>
                              <Select
                                value={question.type}
                                onValueChange={(value) => updateQuestion(qIndex, 'type', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="single">
                                    {t('اختيار واحد', 'Single Choice')}
                                  </SelectItem>
                                  <SelectItem value="multiple">
                                    {t('اختيارات متعددة', 'Multiple Choice')}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label>{t('الخيارات', 'Options')}</Label>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addOption(qIndex)}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  {t('خيار', 'Option')}
                                </Button>
                              </div>

                              {question.options.map((option, oIndex) => (
                                <div key={oIndex} className="flex items-center gap-2">
                                  {question.type === 'single' ? (
                                    <RadioGroup
                                      value={question.correct_answers[0]?.toString()}
                                      onValueChange={() => toggleCorrectAnswer(qIndex, oIndex)}
                                    >
                                      <RadioGroupItem value={oIndex.toString()} />
                                    </RadioGroup>
                                  ) : (
                                    <Checkbox
                                      checked={question.correct_answers.includes(oIndex)}
                                      onCheckedChange={() => toggleCorrectAnswer(qIndex, oIndex)}
                                    />
                                  )}
                                  <Input
                                    placeholder={t('النص بالعربية', 'Text in Arabic')}
                                    value={option.text_ar}
                                    onChange={(e) => updateOption(qIndex, oIndex, 'text_ar', e.target.value)}
                                    className="flex-1"
                                  />
                                  <Input
                                    placeholder={t('النص بالإنجليزية', 'Text in English')}
                                    value={option.text_en}
                                    onChange={(e) => updateOption(qIndex, oIndex, 'text_en', e.target.value)}
                                    className="flex-1"
                                  />
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        {t('إلغاء', 'Cancel')}
                      </Button>
                      <Button type="submit">{t('إنشاء', 'Create')}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label>{t('اختر الدرس', 'Select Lesson')}</Label>
              <Select value={selectedLessonId} onValueChange={setSelectedLessonId} disabled={!selectedCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('اختر درس', 'Select a lesson')} />
                </SelectTrigger>
                <SelectContent>
                  {lessons.map((lesson) => (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {language === 'ar' ? lesson.title_ar : lesson.title_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedLessonId && (
            <>
              {assignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>{t('لا توجد واجبات لهذا الدرس', 'No assignments for this lesson')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('العنوان', 'Title')}</TableHead>
                      <TableHead>{t('عدد الأسئلة', 'Questions')}</TableHead>
                      <TableHead>{t('تاريخ التسليم', 'Due Date')}</TableHead>
                      <TableHead>{t('عدد المحاولات', 'Submissions')}</TableHead>
                      <TableHead className="text-right">{t('الإجراءات', 'Actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">
                          {language === 'ar' ? assignment.title_ar : assignment.title_en}
                        </TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>
                          {assignment.due_date
                            ? new Date(assignment.due_date).toLocaleDateString(
                                language === 'ar' ? 'ar-SA' : 'en-US'
                              )
                            : '-'}
                        </TableCell>
                        <TableCell>0</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewResults(assignment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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

      {/* Results Dialog */}
      <Dialog open={resultsDialogOpen} onOpenChange={setResultsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('نتائج الطلاب', 'Student Results')}</DialogTitle>
            <DialogDescription>
              {selectedAssignment &&
                (language === 'ar' ? selectedAssignment.title_ar : selectedAssignment.title_en)}
            </DialogDescription>
          </DialogHeader>
          <div>
            {submissions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {t('لا توجد محاولات بعد', 'No submissions yet')}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('الطالب', 'Student')}</TableHead>
                    <TableHead>{t('الدرجة', 'Score')}</TableHead>
                    <TableHead>{t('التاريخ', 'Date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>{submission.profiles?.name || '-'}</TableCell>
                      <TableCell>
                        {submission.score} / {submission.total_score}
                      </TableCell>
                      <TableCell>
                        {new Date(submission.submitted_at).toLocaleDateString(
                          language === 'ar' ? 'ar-SA' : 'en-US'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
