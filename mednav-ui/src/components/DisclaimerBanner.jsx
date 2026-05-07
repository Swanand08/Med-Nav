import { ShieldAlert } from "lucide-react";

export default function DisclaimerBanner() {
  return (
    <div className="fixed bottom-4 right-4 z-40 bg-white/80 backdrop-blur-md border border-slate-200 py-1.5 px-3 rounded-full shadow-lg flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
      <p className="text-[10px] font-bold text-slate-500 tracking-wider">
        PROTOTYPE • NOT MEDICAL ADVICE
      </p>
    </div>
  );
}
