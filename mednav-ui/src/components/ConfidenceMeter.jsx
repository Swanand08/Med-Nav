import { motion } from "framer-motion";
import { cn } from "../lib/utils";

export default function ConfidenceMeter({ score, explanation }) {
  let colorClass = "bg-orange-500";
  if (score >= 0.85) colorClass = "bg-success-500";
  else if (score >= 0.60) colorClass = "bg-warning-500";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-bold text-gray-900">AI Confidence</span>
        <span className="text-sm font-bold text-gray-900">{(score * 100).toFixed(0)} / 100</span>
      </div>
      
      <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-3 relative">
        <motion.div 
          className={cn("h-full rounded-full", colorClass)}
          initial={{ width: 0 }}
          animate={{ width: `${score * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      <p className="text-xs text-gray-500 font-medium">{explanation}</p>
    </div>
  );
}
