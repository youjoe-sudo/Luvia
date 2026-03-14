import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  Trophy, Target, Zap, RotateCcw, Home, CheckCircle2, 
  XCircle, ChevronRight, Star, Shield, Flame, Map as MapIcon,
  Crown, Ghost, Heart, FastForward
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

/** * TYPES & INTERFACES 
 */
interface Question {
  id: number;
  q: string;
  a: string[];
  correct: number;
  subject: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

/** * EXTENDED QUESTION BANK 
 */
const QUESTIONS: Question[] = [
  { id: 1, q: "ما هو الكوكب الملقب بالكوكب الأحمر؟", a: ["المريخ", "المشتري", "الزهرة", "عطارد"], correct: 0, subject: "Science", difficulty: "Easy" },
  { id: 2, q: "What is the past tense of 'Go'?", a: ["Goed", "Gone", "Went", "Going"], correct: 2, subject: "English", difficulty: "Easy" },
  { id: 3, q: "ما هو العلم الذي يدرس طبقات الأرض؟", a: ["البيولوجيا", "الجيولوجيا", "الفلك", "الفيزياء"], correct: 1, subject: "Science", difficulty: "Medium" },
  { id: 4, q: "أي لغة برمجية تستخدم بشكل أساسي في تطوير تطبيقات الأندرويد؟", a: ["Swift", "Kotlin", "PHP", "C#"], correct: 1, subject: "Tech", difficulty: "Medium" },
  { id: 5, q: "أين توجد أهرامات الجيزة؟", a: ["السودان", "المكسيك", "مصر", "العراق"], correct: 2, subject: "General", difficulty: "Easy" },
  { id: 6, q: "ما هو ناتج 12 × 12؟", a: ["122", "144", "148", "164"], correct: 1, subject: "Math", difficulty: "Medium" },
  { id: 7, q: "من هو مؤسس شركة مايكروسوفت؟", a: ["ستيف جوبز", "بيل جيتس", "إيلون ماسك", "مارك زوكربيرج"], correct: 1, subject: "Tech", difficulty: "Easy" },
  { id: 8, q: "ما هو العنصر الكيميائي الذي رمزه Au؟", a: ["الفضة", "النحاس", "الذهب", "الحديد"], correct: 2, subject: "Science", difficulty: "Hard" },
  { id: 9, q: "أي دولة فازت بكأس العالم 2022؟", a: ["فرنسا", "البرازيل", "الأرجنتين", "المغرب"], correct: 2, subject: "Sports", difficulty: "Easy" },
  { id: 10, q: "ما هي أسرع لغة برمجية من حيث وقت التنفيذ؟", a: ["Python", "JavaScript", "C++", "Java"], correct: 2, subject: "Tech", difficulty: "Hard" },
];

/**
 * COMPONENTS
 */
const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white/5 border border-white/10 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-4">
    <div className={`p-2 rounded-lg ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{label}</p>
      <p className="text-lg font-mono font-bold text-white">{value}</p>
    </div>
  </div>
);

export default function PlayLuvia() {
  const navigate = useNavigate();
  const controls = useAnimation();
  
  // Game States
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY'>('START');
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<'NONE' | 'CORRECT' | 'WRONG'>('NONE');
  const [timer, setTimer] = useState(20);

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (gameState === 'PLAYING' && feedback === 'NONE' && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0) {
      handleAnswer(-1); // Time's up is a wrong answer
    }
    return () => clearInterval(interval);
  }, [gameState, feedback, timer]);

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const handleAnswer = useCallback((index: number) => {
    if (feedback !== 'NONE') return;

    const isCorrect = index === QUESTIONS[currentQ].correct;

    if (isCorrect) {
      setFeedback('CORRECT');
      const bonus = timer * 2;
      setScore(prev => prev + 100 + bonus);
      setStreak(prev => prev + 1);
      
      confetti({ particleCount: 60, spread: 100, origin: { y: 0.8 }, colors: ['#3b82f6', '#00f2ff'] });

      setTimeout(() => {
        if (currentQ < QUESTIONS.length - 1) {
          setCurrentQ(prev => prev + 1);
          setFeedback('NONE');
          setTimer(20);
        } else {
          setGameState('VICTORY');
          triggerConfetti();
        }
      }, 1500);
    } else {
      setFeedback('WRONG');
      setLives(prev => prev - 1);
      setStreak(0);
      
      setTimeout(() => {
        if (lives <= 1) {
          setGameState('GAMEOVER');
        } else {
          setFeedback('NONE');
          setTimer(20);
        }
      }, 1500);
    }
  }, [currentQ, feedback, lives, timer]);

  const resetGame = () => {
    setCurrentQ(0);
    setScore(0);
    setLives(3);
    setStreak(0);
    setTimer(20);
    setGameState('PLAYING');
    setFeedback('NONE');
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans flex flex-col items-center justify-start relative overflow-hidden">
      
      {/* --- AMBIENT BACKGROUND --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-600/5 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-600/5 blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
      </div>

      <AnimatePresence mode="wait">
        
        {/* --- START SCREEN --- */}
        {gameState === 'START' && (
          <motion.div 
            key="start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.5 } }}
            className="z-10 flex flex-col items-center justify-center min-h-screen text-center space-y-12 p-10"
          >
            <div className="relative group">
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }} 
                className="absolute -inset-8 bg-gradient-to-tr from-blue-500 via-cyan-400 to-purple-600 blur-3xl opacity-30 group-hover:opacity-50 transition-opacity" 
              />
              <div className="relative bg-white/5 p-8 rounded-[3rem] border border-white/10 backdrop-blur-2xl">
                <Trophy className="w-24 h-24 mx-auto text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-8xl font-black tracking-tighter uppercase italic">
                Luvia<span className="text-blue-500 not-italic block text-4xl mt-2 tracking-[0.5em] text-center ml-4">Pursuit</span>
              </h1>
              <div className="h-1 w-24 bg-blue-500 mx-auto rounded-full" />
              <p className="text-gray-400 max-w-md mx-auto text-lg leading-relaxed">
                ادخل إلى عالم المعرفة الرقمي، تجاوز العقبات بشخصيتك، وكن القائد التقني الأول.
              </p>
            </div>

            <div className="flex flex-col gap-4 w-full max-w-xs">
              <button 
                onClick={() => setGameState('PLAYING')}
                className="group relative px-8 py-5 bg-blue-600 rounded-2xl font-black tracking-widest uppercase overflow-hidden transition-all hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative z-10 flex items-center justify-center gap-3 text-xl">
                  Initiate Sync <ChevronRight />
                </span>
              </button>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em]">Version 2.0 // Enhanced Edition</p>
            </div>
          </motion.div>
        )}

        {/* --- MAIN GAMEPLAY INTERFACE --- */}
        {gameState === 'PLAYING' && (
          <motion.div 
            key="playing" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="z-10 w-full max-w-6xl px-6 pt-12 flex flex-col items-center"
          >
            {/* Header Stats */}
            <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Target} label="Core Score" value={score.toLocaleString()} color="bg-blue-500" />
              <StatCard icon={Flame} label="Combo Streak" value={`x${streak}`} color="bg-orange-500" />
              <StatCard icon={Shield} label="Stability" value={`${lives} Units`} color="bg-red-500" />
              <div className="bg-white/5 border border-white/10 backdrop-blur-md px-6 py-3 rounded-2xl flex flex-col justify-center">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Sync Timer</span>
                  <span className={`text-[10px] font-bold ${timer < 5 ? 'text-red-500 animate-bounce' : 'text-blue-400'}`}>{timer}s</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: `${(timer/20)*100}%` }}
                    className={`h-full ${timer < 5 ? 'bg-red-500' : 'bg-blue-500'}`}
                  />
                </div>
              </div>
            </div>

            {/* THE INTERACTIVE MAP ENGINE */}
            <div className="relative h-80 w-full mb-12 overflow-hidden bg-white/[0.02] rounded-[4rem] border border-white/5 shadow-2xl">
              {/* Parallax Stars/Grid */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              
              {/* Moving Track */}
              <motion.div 
                className="absolute bottom-24 left-1/2 flex gap-48 items-center px-[30vw]"
                animate={{ x: -currentQ * 224 }} // 224 is gap(192) + marker width(32)
                transition={{ type: "spring", stiffness: 40, damping: 15 }}
              >
                {QUESTIONS.map((q, i) => (
                  <div key={i} className="relative flex flex-col items-center">
                    {/* Path Connection Line */}
                    {i < QUESTIONS.length - 1 && (
                      <div className={`absolute left-12 top-10 w-48 h-1 transition-all duration-1000 ${i < currentQ ? 'bg-blue-500 shadow-[0_0_15px_#3b82f6]' : 'bg-white/10'}`} />
                    )}

                    {/* Map Node */}
                    <motion.div
                      animate={{
                        scale: i === currentQ ? 1.3 : 1,
                        y: i === currentQ ? [0, -15, 0] : 0
                      }}
                      transition={i === currentQ ? { repeat: Infinity, duration: 2 } : {}}
                      className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center border-2 transition-colors duration-500 z-10
                        ${i < currentQ ? 'bg-blue-500/20 border-blue-400' : 
                          i === currentQ ? 'bg-blue-600 border-white shadow-[0_0_30px_rgba(59,130,246,0.6)]' : 'bg-white/5 border-white/10'}`}
                    >
                      {i < currentQ ? <CheckCircle2 className="text-white w-10 h-10" /> : 
                       i === QUESTIONS.length - 1 ? <Crown className="text-yellow-400 w-10 h-10" /> :
                       <Star className={`w-8 h-8 ${i === currentQ ? 'text-white' : 'text-white/20'}`} />}
                      
                      {/* Sub-label */}
                      <div className="absolute -bottom-8 whitespace-nowrap text-[10px] font-mono tracking-tighter opacity-40 uppercase">
                        Sector {i + 1}
                      </div>
                    </motion.div>
                  </div>
                ))}
              </motion.div>

              {/* FIXED CHARACTER (Hero) */}
              <div className="absolute left-1/2 bottom-20 -translate-x-1/2 z-30">
                <motion.div
                  animate={feedback === 'CORRECT' ? { 
                    y: [0, -60, 0], scale: [1, 1.4, 1], rotate: [0, 360] 
                  } : feedback === 'WRONG' ? {
                    x: [0, -20, 20, -20, 20, 0], opacity: [1, 0.5, 1]
                  } : { 
                    y: [0, -8, 0] 
                  }}
                  transition={{ duration: feedback !== 'NONE' ? 0.6 : 2, repeat: feedback === 'NONE' ? Infinity : 0 }}
                >
                  <div className="relative">
                    {/* Hero Aura */}
                    <div className="absolute -inset-4 bg-blue-500/30 blur-xl rounded-full animate-pulse" />
                    {/* The Player Avatar */}
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-[0_0_30px_#fff] overflow-hidden flex items-center justify-center border-4 border-blue-200">
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 flex items-center justify-center">
                         <Zap className="text-white fill-white w-8 h-8" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* QUESTION CARD (The Control Panel) */}
            <motion.div 
              layout
              className="w-full max-w-4xl bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-10 rounded-[3.5rem] relative overflow-hidden mb-20"
            >
              <AnimatePresence>
                {feedback !== 'NONE' && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className={`absolute inset-0 z-40 flex flex-col items-center justify-center backdrop-blur-xl ${feedback === 'CORRECT' ? 'bg-green-500/10' : 'bg-red-500/10'}`}
                  >
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`p-6 rounded-full ${feedback === 'CORRECT' ? 'bg-green-500' : 'bg-red-500'}`}>
                      {feedback === 'CORRECT' ? <CheckCircle2 className="w-24 h-24 text-white" /> : <XCircle className="w-24 h-24 text-white" />}
                    </motion.div>
                    <h3 className={`text-4xl font-black mt-6 uppercase tracking-widest ${feedback === 'CORRECT' ? 'text-green-400' : 'text-red-400'}`}>
                      {feedback === 'CORRECT' ? 'Data Validated' : 'Access Denied'}
                    </h3>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col items-center text-center space-y-6">
                <div className="flex items-center gap-3">
                  <span className="px-4 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                    {QUESTIONS[currentQ].subject} // {QUESTIONS[currentQ].difficulty}
                  </span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold leading-tight max-w-2xl">
                  {QUESTIONS[currentQ].q}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-8">
                  {QUESTIONS[currentQ].a.map((opt, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAnswer(i)}
                      className="group relative p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all text-right flex flex-row-reverse items-center justify-between overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom" />
                      <span className="text-xl font-semibold pr-4">{opt}</span>
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xs font-mono border border-white/10 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          0{i+1}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* --- END SCREENS (GAMEOVER & VICTORY) --- */}
        {(gameState === 'GAMEOVER' || gameState === 'VICTORY') && (
          <motion.div 
            key="over" 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="z-10 flex flex-col items-center justify-center min-h-screen text-center space-y-8"
          >
            <div className={`p-10 rounded-[4rem] border-2 backdrop-blur-3xl space-y-6 ${gameState === 'VICTORY' ? 'bg-green-500/5 border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.2)]' : 'bg-red-500/5 border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)]'}`}>
              <div className="relative inline-block">
                {gameState === 'VICTORY' ? (
                  <Crown className="w-32 h-32 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]" />
                ) : (
                  <Ghost className="w-32 h-32 text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]" />
                )}
              </div>
              
              <h2 className="text-6xl font-black uppercase tracking-tighter">
                {gameState === 'VICTORY' ? 'System Mastery' : 'Critical Failure'}
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                  <p className="text-gray-400 text-xs font-mono uppercase mb-2">Final Score</p>
                  <p className="text-4xl font-black text-blue-500">{score}</p>
                </div>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                  <p className="text-gray-400 text-xs font-mono uppercase mb-2">Completion</p>
                  <p className="text-4xl font-black text-blue-500">{Math.round((currentQ / QUESTIONS.length) * 100)}%</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={resetGame} 
                  className="flex items-center justify-center gap-3 px-10 py-5 bg-white text-black hover:bg-gray-200 rounded-[1.5rem] font-black transition-all shadow-xl active:scale-95"
                >
                  <RotateCcw className="w-6 h-6" /> Reboot Session
                </button>
                <button 
                  onClick={() => navigate('/')} 
                  className="flex items-center justify-center gap-3 px-10 py-5 bg-blue-600 hover:bg-blue-500 rounded-[1.5rem] font-black transition-all shadow-xl active:scale-95"
                >
                  <Home className="w-6 h-6" /> Exit to HQ
                </button>
              </div>
            </div>
            
            <p className="text-gray-500 font-mono text-[10px] tracking-[0.5em] uppercase animate-pulse">
              End of Transmission
            </p>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Footer Decoration */}
      <div className="mt-auto py-8 z-10 opacity-30 pointer-events-none">
        <div className="flex gap-12 items-center">
          <div className="h-[1px] w-32 bg-gradient-to-r from-transparent to-white" />
          <div className="flex gap-4">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <div className="w-2 h-2 rounded-full bg-cyan-500" />
          </div>
          <div className="h-[1px] w-32 bg-gradient-to-l from-transparent to-white" />
        </div>
      </div>
    </div>
  );
}