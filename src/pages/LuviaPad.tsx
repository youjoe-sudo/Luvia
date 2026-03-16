import React, { useState, useRef } from 'react';
import { Play, Trash2, Terminal, Code2, Cpu, ChevronRight } from 'lucide-react';

export default function LuviaPad() {
  const [code, setCode] = useState(`// 🧪 Luvia Static LTR Lab\n\nconst dev = "Mohamed";\nconsole.log("Welcome, " + dev);\n\nfunction checkSystem() {\n  return "All Systems Nominal";\n}\n\nconsole.log(checkSystem());`);
  const [output, setOutput] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const runCode = () => {
    setOutput([]);
    const logs: string[] = [];
    const customConsole = {
      log: (...args: any[]) => {
        logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
      },
      error: (...args: any[]) => logs.push(`❌ Error: ${args.join(' ')}`)
    };

    try {
      const execute = new Function('console', code);
      execute(customConsole);
      setOutput(logs.length > 0 ? logs : ["✔ Execution Finished"]);
    } catch (err: any) {
      setOutput([`❌ Runtime Error: ${err.message}`]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textareaRef.current!.selectionStart;
      const end = textareaRef.current!.selectionEnd;
      const newValue = code.substring(0, start) + "  " + code.substring(end);
      setCode(newValue);
      setTimeout(() => {
        textareaRef.current!.selectionStart = textareaRef.current!.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    // dir="ltr" هنا هي السر.. بتخلي كل حاجة تبدأ من الشمال لليمين غصب عن أي لغة
    <div className="min-h-screen bg-[#020617] p-2 md:p-6 flex items-center justify-center font-sans text-slate-200" dir="ltr">
      <div className="w-full max-w-6xl bg-[#0a0f1e] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[90vh] md:h-[750px]">
        
        {/* --- Header --- */}
        <div className="bg-[#0f172a] border-b border-white/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Code2 className="w-5 h-5 text-blue-400" />
            </div>
            <h1 className="text-white font-bold tracking-tight text-sm md:text-base uppercase">
              Luvia <span className="text-blue-500">IDE</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setOutput([])} 
              className="p-2 text-slate-500 hover:text-red-400 transition-colors"
              title="Clear Console"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button 
              onClick={runCode}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
            >
              <Play className="w-3 h-3 fill-current" /> RUN
            </button>
          </div>
        </div>

        {/* --- Workspace Layout --- */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* 1. Editor Side (Left) */}
          <div className="flex-[1.5] bg-[#020617] p-4 relative border-b md:border-b-0 md:border-r border-white/5">
            <div className="flex items-center gap-2 mb-2 opacity-40">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[10px] ml-2 font-mono">index.js</span>
            </div>
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className="w-full h-[calc(100%-25px)] bg-transparent text-blue-50 font-mono text-sm md:text-base outline-none resize-none leading-relaxed custom-scrollbar p-2"
              style={{ caretColor: '#3b82f6', textAlign: 'left', direction: 'ltr' }}
            />
          </div>

          {/* 2. Terminal Side (Right) */}
          <div className="flex-1 bg-[#050814] flex flex-col min-h-[150px] md:min-h-full">
            <div className="p-3 bg-black/40 flex items-center gap-2 border-b border-white/5 px-5">
              <Terminal className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Output / Console</span>
            </div>
            
            <div className="flex-1 p-5 font-mono text-xs md:text-sm overflow-y-auto space-y-2 bg-[#050814]/50">
              {output.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-800 font-bold uppercase tracking-tighter text-[10px]">
                  Ready to compile...
                </div>
              ) : (
                output.map((line, i) => (
                  <div key={i} className="flex gap-2 items-start border-l-2 border-blue-500/20 pl-3 py-1 bg-white/5 rounded-r-md">
                    <ChevronRight className="w-3 h-3 mt-1 text-blue-900 shrink-0" />
                    <span className={`break-all whitespace-pre-wrap ${line.startsWith('❌') ? 'text-red-400' : 'text-emerald-400'}`}>
                      {line}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* --- Footer Status Bar --- */}
        <div className="bg-[#0f172a] border-t border-white/5 px-6 py-2 flex justify-between items-center text-[10px] text-slate-600 font-mono">
           <div className="flex gap-4">
             <span className="flex items-center gap-1"><Cpu className="w-3 h-3"/> V8_CORE</span>
             <span>Ln 1, Col 1</span>
           </div>
           <span className="text-blue-900 font-black">LUVIA_SYSTEM_STABLE</span>
        </div>
      </div>
    </div>
  );
}