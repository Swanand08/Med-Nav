import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, CircleDashed } from 'lucide-react';
import { cn } from '../lib/utils';

const STEPS = [
  "Identifying medical condition and ICD-10 code...",
  "Searching verified hospital registry...",
  "Calculating personalised cost estimate...",
  "Checking government scheme eligibility..."
];

export default function LoadingState() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => {
        if (prev < STEPS.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 max-w-lg mx-auto w-full">
      
      {/* Spinner Animation */}
      <div className="relative mb-8">
        <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>

      {/* Foreground Pipeline Sequence overlay */}
      <div className="relative z-10 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm w-full max-w-lg mx-auto space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-6">Processing Data Pipeline</h3>
        <AnimatePresence>
          {STEPS.map((step, index) => {
            const isActive = index === activeStep;
            const isCompleted = index < activeStep;
            const isPending = index > activeStep;

            if (isPending) return null;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-colors border",
                  isActive ? "bg-blue-50 border-blue-100 text-blue-900 shadow-sm" : "",
                  isCompleted ? "bg-slate-50 border-transparent text-slate-400" : ""
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  >
                    <CircleDashed className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  </motion.div>
                )}
                
                <span className={cn(
                  "text-sm font-medium",
                  isActive ? "font-bold" : ""
                )}>
                  {step}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

    </div>
  );
}
