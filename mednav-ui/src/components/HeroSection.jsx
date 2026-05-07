import { motion } from 'framer-motion';
import { ShieldCheck, Activity, BrainCircuit } from 'lucide-react';

export default function HeroSection() {
  return (
    <div className="relative pt-28 pb-16 px-4 md:pt-36 md:pb-24 overflow-hidden max-w-[1400px] mx-auto">
      
      {/* Background Subtle Clinical Grid & Glows */}
      <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60"></div>
        <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-50/50 rounded-full blur-3xl"></div>
      </div>

      {/* Floating Decorative Badges (Micro-Animations) */}
      <motion.div 
        animate={{ y: [0, -15, 0], rotate: [0, 2, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="hidden lg:flex absolute top-24 left-16 bg-white border border-slate-200 shadow-sm rounded-xl p-3 items-center gap-3 z-0"
      >
        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verified Data</p>
          <p className="text-sm font-bold text-slate-800">PMJAY Live Auth</p>
        </div>
      </motion.div>

      <motion.div 
        animate={{ y: [0, -20, 0], rotate: [0, -3, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="hidden lg:flex absolute bottom-32 right-12 bg-white border border-slate-200 shadow-sm rounded-xl p-3 items-center gap-3 z-0"
      >
        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
          <Activity className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clinical Accuracy</p>
          <p className="text-sm font-bold text-slate-800">Deterministic Engine</p>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center justify-center">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-8 shadow-sm"
        >
          <BrainCircuit className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-blue-800 tracking-wide uppercase">AI-Powered Patient Navigator</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.10] mb-6"
        >
          Make definitive <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600">
            healthcare choices.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="text-lg sm:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed mb-4"
        >
          Stop guessing your medical costs. We fuse real-time Google hospital infrastructure data with verified PMJAY government pricing to calculate your exact clinical pathway.
        </motion.p>

      </div>
    </div>
  );
}
