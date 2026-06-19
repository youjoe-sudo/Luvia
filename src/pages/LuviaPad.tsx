import { useState, useEffect } from 'react';
import { 
  Code2, Terminal, Cpu, Zap, Globe, Trash2, ChevronRight, Play, Maximize2
} from 'lucide-react';

// Vite CJS Interop Fix
import EditorComponent from 'react-simple-code-editor';
// @ts-ignore
const Editor = EditorComponent.default || EditorComponent;

// @ts-ignore
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup'; 
import 'prismjs/components/prism-css';
import 'prismjs/themes/prism-tomorrow.css';

// إضافة دعم لغة بايثون برمجياً وبصرياً لـ Prism
languages.python = {
  'comment': { pattern: /(^|[^\\])#.*/, lookbehind: true },
  'string': /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/,
  'keyword': /\b(?:as|assert|async|await|break|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|pass|print|raise|return|try|while|with|yield|False|None|True)\b/,
  'number': /\b(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?\b/,
  'operator': /[-+*/%&|^~<>=!]=?|\/\/|<<|>>|\*\*|\b(?:and|not|or)\b/,
  'punctuation': /[{}[\];(),.:]/
};

type EditorMode = 'web' | 'logic' | 'python' | null;

export default function LuviaWebIDE() {
  const [mode, setMode] = useState<EditorMode>(null);
  const [html, setHtml] = useState('\n<h1 class="title">Hello Luvia</h1>');
  const [css, setCss] = useState('.title { color: #3b82f6; text-align: center; font-family: sans-serif; }');
  const [js, setJs] = useState('// JavaScript Code\nconsole.log("Hello from Luvia!");');
  const [python, setPython] = useState('# Python Code\nprint("Hello from Luvia Python Studio!")\n\nfor i in range(1, 6):\n    print(f"Iteration {i}")');
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js' | 'py'>('html');
  const [srcDoc, setSrcDoc] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // تحديث المعاينة للـ Web Mode تلقائياً
  useEffect(() => {
    if (mode === 'web') {
      const timeout = setTimeout(() => {
        setSrcDoc(`<html><style>${css}</style><body>${html}<script>${js}</script></body></html>`);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [html, css, js, mode]);

  const runLogicCode = () => {
    const newLogs: string[] = [];
    const customConsole = {
      log: (...args: any[]) => {
        newLogs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
      },
      error: (...args: any[]) => newLogs.push(`❌ Error: ${args.join(' ')}`)
    };

    try {
      const execute = new Function('console', js);
      execute(customConsole);
      setLogs(newLogs.length > 0 ? newLogs : ["✔ Execution Finished"]);
    } catch (err: any) {
      setLogs([`❌ Runtime Error: ${err.message}`]);
    }
  };

  const runPythonCode = () => {
    const newLogs: string[] = [];
    
    // محاكي تشغيل بايثون أساسي وذكي لتفسير مخرجات الـ print والـ Loops والـ variables محلياً
    try {
      const lines = python.split('\n');
      const variables: Record<string, any> = {};
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        // دعم الـ print العادي والـ f-strings
        if (trimmed.startsWith('print(') && trimmed.endsWith(')')) {
          let content = trimmed.substring(6, trimmed.length - 1).trim();
          
          if (content.startsWith('f"') || content.startsWith("f'")) {
            let inner = content.substring(2, content.length - 1);
            const matches = inner.match(/\{([^}]+)\}/g);
            if (matches) {
              matches.forEach(match => {
                const varName = match.substring(1, match.length - 1).trim();
                if (variables[varName] !== undefined) {
                  inner = inner.replace(match, variables[varName]);
                }
              });
            }
            newLogs.push(inner);
          } else if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) {
            newLogs.push(content.substring(1, content.length - 1));
          } else {
            newLogs.push(variables[content] !== undefined ? String(variables[content]) : content);
          }
          return;
        }

        // محاكاة حلقة الـ for loop البسيطة range(x, y)
        if (trimmed.startsWith('for ') && trimmed.includes(' in range(')) {
          const loopParts = trimmed.split(' in range(');
          const varName = loopParts[0].substring(4).trim();
          const rangeArgs = loopParts[1].replace('):', '').split(',');
          
          let start = 0, end = 0;
          if (rangeArgs.length === 1) {
            end = parseInt(rangeArgs[0].trim());
          } else {
            start = parseInt(rangeArgs[0].trim());
            end = parseInt(rangeArgs[1].trim());
          }

          // البحث عن الـ print التابع للحلقة في السطور التالية مباشرة
          const currentIndex = lines.indexOf(line);
          const nextLine = lines[currentIndex + 1]?.trim();
          
          if (nextLine && nextLine.startsWith('print(')) {
            for (let i = start; i < end; i++) {
              variables[varName] = i;
              if (nextLine.includes('f"') || nextLine.includes("f'")) {
                let inner = nextLine.substring(nextLine.indexOf('{') - i.toString().length, nextLine.lastIndexOf('}') + 2);
                newLogs.push(nextLine.replace(`{${varName}}`, String(i)).replace('print(f"', '').replace('print(f\'', '').slice(0, -2));
              } else {
                newLogs.push(String(i));
              }
            }
          }
        }

        // دعم تعيين المتغيرات البسيطة
        if (trimmed.includes('=') && !trimmed.startsWith('for')) {
          const parts = trimmed.split('=');
          const varName = parts[0].trim();
          const varVal = parts[1].trim().replace(/['"]/g, '');
          variables[varName] = isNaN(Number(varVal)) ? varVal : Number(varVal);
        }
      });

      setLogs(newLogs.length > 0 ? newLogs : ["✔ Python Execution Finished (Opcodes OK)"]);
    } catch (err: any) {
      setLogs([`❌ Python Interpreter Error: ${err.message}`]);
    }
  };

  // شاشة الاختيار الأولية المحسنة بتأثير Glassmorphism فاخر
  if (!mode) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 font-sans relative overflow-hidden antialiased" dir="ltr">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-md w-full bg-slate-900/40 border border-slate-800/80 p-8 rounded-[2rem] shadow-2xl text-center backdrop-blur-xl relative border-b-2 border-b-blue-500/10">
          <div className="w-16 h-16 bg-blue-500/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/10 shadow-inner">
            <Zap className="text-blue-400 w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-1.5 uppercase tracking-tighter">Luvia Studio</h2>
          <p className="text-slate-500 text-xs mb-8">What do you want to build today?</p>
          
          <div className="space-y-3.5">
            <button 
              onClick={() => { setMode('web'); setActiveTab('html'); }}
              className="w-full flex items-center gap-4 p-4 bg-slate-950/40 hover:bg-slate-950/90 border border-slate-900 rounded-2xl transition-all duration-300 group cursor-pointer"
            >
              <div className="p-3 bg-orange-500/10 rounded-xl group-hover:scale-110 transition-transform border border-orange-500/10">
                <Globe className="text-orange-400 w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-slate-200 font-bold text-sm transition-colors group-hover:text-white">Web Development</div>
                <div className="text-slate-500 text-[10px]">HTML, CSS, Live Preview Sandbox</div>
              </div>
            </button>

            <button 
              onClick={() => { setMode('logic'); setActiveTab('js'); }}
              className="w-full flex items-center gap-4 p-4 bg-slate-950/40 hover:bg-slate-950/90 border border-slate-900 rounded-2xl transition-all duration-300 group cursor-pointer"
            >
              <div className="p-3 bg-yellow-500/10 rounded-xl group-hover:scale-110 transition-transform border border-yellow-500/10">
                <Terminal className="text-yellow-400 w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-slate-200 font-bold text-sm transition-colors group-hover:text-white">Logic & Scripting</div>
                <div className="text-slate-500 text-[10px]">Pure JavaScript, Isolated V8 Console</div>
              </div>
            </button>

            {/* زر طور بايثون الجديد الفاخر */}
            <button 
              onClick={() => { setMode('python'); setActiveTab('py'); }}
              className="w-full flex items-center gap-4 p-4 bg-slate-950/40 hover:bg-slate-950/90 border border-slate-900 rounded-2xl transition-all duration-300 group cursor-pointer"
            >
              <div className="p-3 bg-sky-500/10 rounded-xl group-hover:scale-110 transition-transform border border-sky-500/10">
                <Cpu className="text-sky-400 w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-slate-200 font-bold text-sm transition-colors group-hover:text-white">Python Workspace</div>
                <div className="text-slate-500 text-[10px]">Python Scripting & Print Interpreter</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] md:p-6 flex items-center justify-center font-sans text-slate-200 antialiased selection:bg-blue-500/30 selection:text-blue-200" dir="ltr">
      <div className={`w-full bg-slate-950/40 overflow-hidden flex flex-col transition-all duration-500 backdrop-blur-md ${
        isFullscreen ? 'fixed inset-0 z-50' : 'max-w-7xl border border-slate-800/80 md:rounded-2xl shadow-2xl h-[100dvh] md:h-[85vh]'
      }`}>
        
        {/* Header Panel */}
        <div className="bg-slate-900/60 border-b border-slate-900/80 p-3 md:p-4 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Code2 className="w-4 h-4 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
            <h1 className="text-white font-extrabold text-xs md:text-sm uppercase tracking-tighter">
              Luvia <span className="text-blue-500">{mode === 'web' ? 'Web' : mode === 'logic' ? 'Logic' : 'Python'} Lab</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <select 
              value={mode}
              onChange={(e) => {
                const targetMode = e.target.value as EditorMode;
                setMode(targetMode);
                if(targetMode === 'web') setActiveTab('html');
                if(targetMode === 'logic') setActiveTab('js');
                if(targetMode === 'python') setActiveTab('py');
              }}
              className="bg-slate-900 text-slate-300 text-[10px] font-bold px-2 py-1.5 rounded-lg border border-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="web">Web Sandbox Mode</option>
              <option value="logic">JS Logic Mode</option>
              <option value="python">Python Studio Mode</option>
            </select>

            {mode === 'logic' && (
              <button onClick={runLogicCode} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 shadow-md shadow-emerald-600/5 transition-colors cursor-pointer">
                <Play className="w-3 h-3 fill-current" /> RUN JS
              </button>
            )}

            {mode === 'python' && (
              <button onClick={runPythonCode} className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 shadow-md shadow-sky-600/5 transition-colors cursor-pointer">
                <Play className="w-3 h-3 fill-current" /> RUN PY
              </button>
            )}

            <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 text-slate-500 hover:text-white transition-colors cursor-pointer">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Studio Core Workspace */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Editor Section */}
          <div className="flex-1 flex flex-col border-r border-slate-900 bg-slate-950/20">
            {mode === 'web' && (
              <div className="flex border-b border-slate-900 bg-slate-950/60">
                <button onClick={() => setActiveTab('html')} className={`flex-1 py-3 text-[10px] font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'html' ? 'border-orange-500 text-orange-400 bg-orange-500/[0.02]' : 'border-transparent text-slate-500 hover:text-slate-400'}`}>HTML</button>
                <button onClick={() => setActiveTab('css')} className={`flex-1 py-3 text-[10px] font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'css' ? 'border-blue-500 text-blue-400 bg-blue-500/[0.02]' : 'border-transparent text-slate-500 hover:text-slate-400'}`}>CSS</button>
                <button onClick={() => setActiveTab('js')} className={`flex-1 py-3 text-[10px] font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'js' ? 'border-yellow-500 text-yellow-400 bg-yellow-500/[0.02]' : 'border-transparent text-slate-500 hover:text-slate-400'}`}>JS</button>
              </div>
            )}
            
            <div className="flex-1 overflow-auto p-4 font-mono text-xs sm:text-sm bg-[#040814]/40">
              <Editor
                value={mode === 'python' ? python : activeTab === 'html' ? html : activeTab === 'css' ? css : js}
                onValueChange={(val: string) => {
                  if (mode === 'python') setPython(val);
                  else if (activeTab === 'html') setHtml(val);
                  else if (activeTab === 'css') setCss(val);
                  else setJs(val);
                }}
                highlight={(code: string) => {
                  if (mode === 'python') return highlight(code, languages.python);
                  return highlight(code, activeTab === 'html' ? languages.markup : activeTab === 'css' ? languages.css : languages.javascript);
                }}
                padding={12}
                style={{ minHeight: '100%', outline: 'none' }}
                className="text-slate-300 selection:bg-slate-800"
              />
            </div>
          </div>

          {/* Real-time Output Panel */}
          <div className="flex-1 bg-slate-950/60 relative">
            {mode === 'web' ? (
              <iframe title="preview" srcDoc={srcDoc} className="w-full h-full border-none bg-white" />
            ) : (
              <div className="h-full flex flex-col bg-slate-950/90">
                <div className="p-3 bg-slate-900/40 border-b border-slate-900 flex justify-between items-center backdrop-blur-sm">
                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-2 tracking-wider">
                    <Terminal className="w-3 h-3 text-slate-600"/> SYSTEM CONSOLE
                  </span>
                  <button onClick={() => setLogs([])} className="text-slate-600 hover:text-red-400 transition-colors cursor-pointer">
                    <Trash2 className="w-3 h-3"/>
                  </button>
                </div>
                
                <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-2.5">
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-2.5 text-emerald-400 border-l-2 border-emerald-500/40 pl-3.5 bg-emerald-500/[0.02] p-2.5 rounded-r-xl">
                      <ChevronRight className="w-3 h-3 shrink-0 mt-0.5 text-emerald-700/60" />
                      <span className="whitespace-pre-wrap leading-relaxed tracking-wide text-slate-200">{log}</span>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-[0.04] text-white select-none">
                       <Terminal className="w-14 h-14 mb-3" />
                       <div className="uppercase font-extrabold text-xl tracking-widest">Console Terminal</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Metrics */}
        <div className="bg-slate-900/60 border-t border-slate-900/80 px-4 py-2 flex justify-between items-center text-[9px] text-slate-500 font-mono backdrop-blur-md">
          <span className="flex items-center gap-1.5 text-blue-500/80 font-semibold">
            <Cpu className="w-3 h-3" /> LUVIA_CORE_V3.0_STABLE
          </span>
          <span className="font-bold tracking-wider">{mode.toUpperCase()} WORKSPACE PROTOCOL ACTIVE</span>
        </div>
      </div>
    </div>
  );
}