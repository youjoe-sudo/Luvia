import { Link } from "react-router-dom";
import PageMeta from "@/components/common/PageMeta";

export default function NotFound() {
  return (
    <>
      <PageMeta title="404 - Connection Lost" description="System connection failure" />
      <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#020617] p-6 overflow-hidden">
        
        {/* تأثير الإضاءة الخلفية الخافتة (Ambient Glow) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 text-center">
          
          {/* أيقونة الفيشة المفصولة مع أنيميشن الرعشة */}
          <div className="relative mb-8 inline-block">
            <svg 
              className="w-32 h-32 text-gray-700 animate-[flicker_2s_infinite]" 
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M18 12V2a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v10" />
              <path d="M6 12h12" />
              <path d="M12 12v5" />
              <path d="M10 20h4" />
              <path d="M10 17v6" />
              <path d="M14 17v6" />
            </svg>
            {/* شرارة كهرباء وهمية (Spark) */}
            <div className="absolute -right-2 top-1/2 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-75"></div>
          </div>

          {/* نص الخطأ بتأثير الـ Glitch */}
          <h1 className="relative text-8xl font-black text-white/90 tracking-tighter sm:text-9xl">
            <span className="relative inline-block animate-[glitch_3s_infinite] before:content-['404'] before:absolute before:top-0 before:left-0 before:text-red-500 before:opacity-70 before:-z-10 before:animate-[glitch_2s_infinite_reverse] after:content-['404'] after:absolute after:top-0 after:left-0 after:text-blue-500 after:opacity-70 after:-z-10 after:animate-[glitch_4s_infinite]">
              404
            </span>
          </h1>

          <h2 className="mt-4 text-2xl font-bold text-blue-400 uppercase tracking-[0.2em] animate-pulse">
            System Power Failure
          </h2>

          <p className="mt-6 mb-10 max-w-md mx-auto text-gray-500 text-lg leading-relaxed">
            The connection to this sector has been <span className="text-gray-400 font-mono">terminated</span>. 
            It seems like someone pulled the plug or the circuit is broken.
          </p>

          <Link
            to="/"
            className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-transparent border-2 border-blue-500/30 rounded-full hover:bg-blue-500 hover:text-white hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Reconnect System
            </span>
          </Link>
        </div>

        {/* Footer */}
        <p className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-xs text-gray-700 tracking-widest uppercase">
          [ Error_Code: 0x000404 ] // {new Date().getFullYear()} Luvia_OS
        </p>

        {/* إضافة الأنماط اللازمة للأنيميشن */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes flicker {
            0%, 18%, 22%, 25%, 53%, 57%, 100% { opacity: 1; }
            20%, 24%, 55% { opacity: 0.3; }
          }
          @keyframes glitch {
            0% { transform: translate(0); }
            20% { transform: translate(-3px, 3px); }
            40% { transform: translate(-3px, -3px); }
            60% { transform: translate(3px, 3px); }
            80% { transform: translate(3px, -3px); }
            100% { transform: translate(0); }
          }
        `}} />
      </div>
    </>
  );
}