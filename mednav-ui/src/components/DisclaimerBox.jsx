import { Info } from "lucide-react";

export default function DisclaimerBox() {
  return (
    <div className="flex items-center gap-2 mb-6 px-1 opacity-70">
      <Info className="text-slate-400 w-3.5 h-3.5 flex-shrink-0" />
      <p className="text-slate-500 font-medium text-xs">
        Decision Support Only. Cost estimates are mathematically indicative based on Government Floor Rates. Not medical advice.
      </p>
    </div>
  );
}
