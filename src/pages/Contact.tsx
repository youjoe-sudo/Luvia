import { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';
import PageMeta from "@/components/common/PageMeta";

export default function ContactUs() {
  const form = useRef<HTMLFormElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

  const sendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    // استبدل القيم دي باللي أخدتها من موقع EmailJS
    const SERVICE_ID = 'service_jx1qzdy';
    const TEMPLATE_ID = 'template_ub8lmyw';
    const PUBLIC_KEY = 'nFeKBiVSIudhkXSib';

    if (form.current) {
      emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form.current, PUBLIC_KEY)
        .then(() => {
          setStatus('SUCCESS');
          form.current?.reset();
          setTimeout(() => setStatus('IDLE'), 5000);
        }, (error) => {
          console.log('FAILED...', error.text);
          setStatus('ERROR');
        })
        .finally(() => setIsSending(false));
    }
  };

  return (
    <>
      <PageMeta title="Contact Support | Luvia" description="Email Transmission Protocol" />
      <div className="min-h-screen bg-[#020617] text-white p-6 flex items-center justify-center relative overflow-hidden font-sans">
        
        {/* Glow Effects */}
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full"></div>
        
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
          
          <div className="flex flex-col justify-center space-y-8">
            <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent uppercase">
              Direct Mail<br/>Protocol<span className="text-blue-500 animate-pulse">_</span>
            </h1>
            <p className="text-gray-400 text-lg">Your payload will be delivered directly to our HQ inbox.</p>
          </div>

          <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/[0.05] p-8 rounded-[2.5rem] shadow-2xl">
            <form ref={form} onSubmit={sendEmail} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input name="first_name" required className="w-full bg-[#0f172a]/50 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:border-blue-500/50 outline-none" placeholder="First Name" />
                <input name="last_name" required className="w-full bg-[#0f172a]/50 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:border-blue-500/50 outline-none" placeholder="Last Name" />
              </div>

              <input name="email" type="email" required className="w-full bg-[#0f172a]/50 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:border-blue-500/50 outline-none" placeholder="Email Endpoint" />
              
              <textarea name="message" required rows={4} className="w-full bg-[#0f172a]/50 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:border-blue-500/50 outline-none resize-none" placeholder="Message Payload"></textarea>

              <button 
                disabled={isSending}
                type="submit"
                className={`w-full py-5 rounded-2xl font-black transition-all ${isSending ? 'bg-gray-800' : 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)]'}`}
              >
                {isSending ? 'TRANSMITTING...' : 'EXECUTE SEND'}
              </button>

              {status === 'SUCCESS' && <div className="text-green-400 text-xs text-center font-mono tracking-widest">[ OK ] MAIL DELIVERED</div>}
              {status === 'ERROR' && <div className="text-red-400 text-xs text-center font-mono tracking-widest">[ FAIL ] RETRY LATER</div>}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}