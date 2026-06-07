import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, Ticket, Users, FileText, ClipboardList, 
  Clock, Award, Shield, LayoutDashboard, Sparkles 
} from 'lucide-react';

// استيراد الصفحات (تأكد من صحة المسارات عندك)
import AdminCoursesPage from './admin/AdminCoursesPage';
import AdminLessonsPage from './admin/AdminLessonsPage';
import AdminVouchersPage from './admin/AdminVouchersPage';
import AdminUsersPage from './admin/AdminUsersPage';
import AdminAssignmentsPage from './admin/AdminAssignmentsPage';
import AdminLessonProgressPage from './admin/AdminLessonProgressPage';
import AdminCertificatesPage from './admin/AdminCertificatesPage';
import AdminDeviceAttemptsPage from './admin/AdminDeviceAttemptsPage';

export default function AdminPanel() {
  const { t } = useLanguage();

  return (
    /** * dir="ltr" بتضمن إن الترتيب يفضل من الشمال لليمين مهما كانت اللغة
     * bg-[#020617] هو اللون الكحلي الغامق اللي بيليق عليه النيون
     */
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-blue-500/30" dir="ltr">
      <div className="container mx-auto px-4 py-8 md:py-12">
        
        {/* --- Header Section --- */}
        <div className="relative mb-12 border-b border-white/5 pb-8 overflow-hidden">
          {/* لمسة إضاءة خلفية نيون */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-600/10 blur-[120px] pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
               <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
               <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Luvia Core Engine</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter flex items-center gap-4 italic uppercase">
              <LayoutDashboard className="w-10 h-10 text-blue-600" />
              {t('لوحة الإدارة', 'Admin Panel')}
            </h1>
            <p className="text-slate-500 text-sm md:text-base mt-2 font-medium max-w-2xl">
              {t('إدارة المنصة والكورسات والمستخدمين', 'Central command for platform architecture, users, and educational flow.')}
            </p>
          </div>
        </div>

        <Tabs defaultValue="courses" className="space-y-10">
          
          {/* --- Navigation Tabs (Scrollable for Mobile) --- */}
          <div className="relative">
            {/* Fade effect على اليمين للموبايل عشان اليوزر يعرف إن فيه سكرول */}
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#020617] to-transparent z-10 pointer-events-none md:hidden" />
            
            <TabsList className="flex w-full h-auto bg-transparent justify-start overflow-x-auto overflow-y-hidden gap-3 pb-4 custom-scrollbar">
              <TabItem value="courses" icon={<BookOpen />} label={t('الكورسات', 'Courses')} />
              <TabItem value="lessons" icon={<FileText />} label={t('الدروس', 'Lessons')} />
              <TabItem value="assignments" icon={<ClipboardList />} label={t('الواجبات', 'Tasks')} />
              <TabItem value="progress" icon={<Clock />} label={t('التقدم', 'Progress')} />
              <TabItem value="certificates" icon={<Award />} label={t('الشهادات', 'Certs')} />
              <TabItem value="vouchers" icon={<Ticket />} label={t('الأكواد', 'Codes')} />
              <TabItem value="users" icon={<Users />} label={t('المستخدمون', 'Users')} />
              <TabItem value="devices" icon={<Shield />} label={t('الأجهزة', 'Security')} />
            </TabsList>
          </div>

          {/* --- Content Area --- */}
          <div className="bg-[#0a0f1e]/40 border border-white/5 rounded-[2.5rem] p-4 md:p-10 backdrop-blur-md shadow-2xl relative overflow-hidden">
            {/* تأثير جريد خفيف في الخلفية */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
            
            <div className="relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <TabsContent value="courses" className="mt-0 outline-none focus:ring-0"><AdminCoursesPage /></TabsContent>
              <TabsContent value="lessons" className="mt-0 outline-none focus:ring-0"><AdminLessonsPage /></TabsContent>
              <TabsContent value="assignments" className="mt-0 outline-none focus:ring-0"><AdminAssignmentsPage /></TabsContent>
              <TabsContent value="progress" className="mt-0 outline-none focus:ring-0"><AdminLessonProgressPage /></TabsContent>
              <TabsContent value="certificates" className="mt-0 outline-none focus:ring-0"><AdminCertificatesPage /></TabsContent>
              <TabsContent value="vouchers" className="mt-0 outline-none focus:ring-0"><AdminVouchersPage /></TabsContent>
              <TabsContent value="users" className="mt-0 outline-none focus:ring-0"><AdminUsersPage /></TabsContent>
              <TabsContent value="devices" className="mt-0 outline-none focus:ring-0"><AdminDeviceAttemptsPage /></TabsContent>
            </div>
          </div>
        </Tabs>

        {/* --- Footer Status Bar --- */}
        <div className="mt-12 flex justify-between items-center px-6 py-4 bg-[#0f172a]/50 border border-white/5 rounded-2xl text-[10px] font-mono text-slate-600 uppercase tracking-widest">
           <div className="flex gap-6">
             <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/> Root_Access: Granted</span>
             <span className="hidden md:block">Region: MEA_EGYPT</span>
           </div>
           <span className="text-blue-900 font-black">Luvia Universe OS v4.2.0</span>
        </div>
      </div>

      {/* CSS Styles لإخفاء السكرول بار */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

/**
 * مكون التاب الفرعي - متظبط عشان يكون Responsive وشكله "Premium"
 */
interface TabItemProps {
  value: string;
  icon: React.ReactNode;
  label: string;
}

function TabItem({ value, icon, label }: TabItemProps) {
  return (
    <TabsTrigger 
      value={value} 
      className="flex items-center gap-3 px-6 py-4 rounded-[1.2rem] transition-all duration-300 group
                 data-[state=active]:bg-blue-600 data-[state=active]:text-white 
                 data-[state=active]:shadow-[0_10px_30px_-10px_rgba(37,99,235,0.6)]
                 data-[state=active]:border-blue-400/40
                 data-[state=inactive]:bg-[#0f172a]/80 data-[state=inactive]:text-slate-500
                 data-[state=inactive]:hover:bg-blue-500/10 data-[state=inactive]:hover:text-blue-400
                 whitespace-nowrap shrink-0 border border-white/5"
    >
      <span className="w-4 h-4 transition-transform duration-300 group-data-[state=active]:scale-125">
        {icon}
      </span>
      <span className="text-[11px] font-black uppercase tracking-wider">
        {label}
      </span>
    </TabsTrigger>
  );
}