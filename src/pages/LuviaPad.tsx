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

type EditorMode = 'web' | 'logic' | null;

export default function LuviaWebIDE() {
  const [mode, setMode] = useState<EditorMode>(null);
  const [html, setHtml] = useState('\n<h1 class="title">Hello Luvia</h1>');
  const [css, setCss] = useState('.title { color: #3b82f6; text-align: center; font-family: sans-serif; }');
  const [js, setJs] = useState('// JavaScript Code\nconsole.log("Hello from Luvia!");');
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [srcDoc, setSrcDoc] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // تحديث المعاينة للـ Web Mode
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

  // شاشة الاختيار الأولية
  if (!mode) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans" dir="ltr">
        <div className="max-w-md w-full bg-[#0a0f1e] border border-white/10 p-8 rounded-[2rem] shadow-2xl text-center">
          <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap className="text-blue-500 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Luvia Studio</h2>
          <p className="text-slate-500 text-sm mb-8">What do you want to build today?</p>
          
          <div className="space-y-4">
            <button 
              onClick={() => { setMode('web'); setActiveTab('html'); }}
              className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group"
            >
              <div className="p-3 bg-orange-500/20 rounded-xl group-hover:scale-110 transition-transform">
                <Globe className="text-orange-400 w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-sm">Web Development</div>
                <div className="text-slate-500 text-[10px]">HTML, CSS, Live Preview</div>
              </div>
            </button>

            <button 
              onClick={() => { setMode('logic'); setActiveTab('js'); }}
              className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group"
            >
              <div className="p-3 bg-yellow-500/20 rounded-xl group-hover:scale-110 transition-transform">
                <Terminal className="text-yellow-400 w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-sm">Logic & Scripting</div>
                <div className="text-slate-500 text-[10px]">Pure JavaScript, Console Output</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] md:p-6 flex items-center justify-center font-sans text-slate-200" dir="ltr">
      <div className={`w-full bg-[#0a0f1e] overflow-hidden flex flex-col transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50' : 'max-w-7xl border border-white/10 md:rounded-3xl shadow-2xl h-[100dvh] md:h-[85vh]'
      }`}>
        
        {/* Header */}
        <div className="bg-[#0f172a] border-b border-white/5 p-3 md:p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Code2 className="w-5 h-5 text-blue-500" />
            <h1 className="text-white font-bold text-xs md:text-sm uppercase tracking-tighter">
              Luvia <span className="text-blue-500">{mode === 'web' ? 'Web' : 'Logic'} Lab</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setMode(mode === 'web' ? 'logic' : 'web')}
              className="text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 font-bold transition-all"
            >
              Switch to {mode === 'web' ? 'Logic' : 'Web'}
            </button>
            {mode === 'logic' && (
              <button onClick={runLogicCode} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1">
                <Play className="w-3 h-3 fill-current" /> RUN
              </button>
            )}
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 text-slate-400 hover:text-white transition-colors">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Editor Section */}
          <div className="flex-1 flex flex-col border-r border-white/5 bg-[#050814]">
            {mode === 'web' && (
              <div className="flex border-b border-white/5 bg-[#0a0f1e]">
                <button onClick={() => setActiveTab('html')} className={`flex-1 py-3 text-[10px] font-bold border-b-2 transition-all ${activeTab === 'html' ? 'border-orange-500 text-orange-400 bg-orange-500/5' : 'border-transparent text-slate-500'}`}>HTML</button>
                <button onClick={() => setActiveTab('css')} className={`flex-1 py-3 text-[10px] font-bold border-b-2 transition-all ${activeTab === 'css' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-500'}`}>CSS</button>
                <button onClick={() => setActiveTab('js')} className={`flex-1 py-3 text-[10px] font-bold border-b-2 transition-all ${activeTab === 'js' ? 'border-yellow-500 text-yellow-400 bg-yellow-500/5' : 'border-transparent text-slate-500'}`}>JS</button>
              </div>
            )}
            
            <div className="flex-1 overflow-auto p-4 font-mono text-sm">
              <Editor
                value={activeTab === 'html' ? html : activeTab === 'css' ? css : js}
                onValueChange={(val: string) => {
                  if (activeTab === 'html') setHtml(val);
                  else if (activeTab === 'css') setCss(val);
                  else setJs(val);
                }}
                highlight={(code: string) => highlight(code, activeTab === 'html' ? languages.markup : activeTab === 'css' ? languages.css : languages.javascript)}
                padding={10}
                style={{ minHeight: '100%', outline: 'none' }}
              />
            </div>
          </div>

          {/* Output Section */}
          <div className="flex-1 bg-[#020617] relative">
            {mode === 'web' ? (
              <iframe title="preview" srcDoc={srcDoc} className="w-full h-full border-none bg-white" />
            ) : (
              <div className="h-full flex flex-col bg-black/50">
                <div className="p-3 bg-white/5 border-b border-white/5 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-2"><Terminal className="w-3 h-3"/> CONSOLE</span>
                  <button onClick={() => setLogs([])} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3"/></button>
                </div>
                <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-2">
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-2 text-emerald-400 border-l border-emerald-500/30 pl-3 bg-white/5 p-2 rounded-r-lg">
                      <ChevronRight className="w-3 h-3 shrink-0 mt-0.5 text-emerald-900" />
                      <span className="whitespace-pre-wrap">{log}</span>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-10">
                       <Terminal className="w-12 h-12 mb-2" />
                       <div className="uppercase font-black text-xl">Output Ready</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#0f172a] border-t border-white/5 px-4 py-2 flex justify-between items-center text-[10px] text-slate-500 font-mono">
          <span className="flex items-center gap-1 text-blue-500"><Cpu className="w-3 h-3" /> LUVIA_CORE_V2.1</span>
          <span>{mode.toUpperCase()} MODE ACTIVE</span>
        </div>
      </div>
    </div>
  );
}