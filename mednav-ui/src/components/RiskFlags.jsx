import { AlertCircle } from "lucide-react";

export default function RiskFlags({ flags = [] }) {
  if (!flags || flags.length === 0) return null;

  return (
    <div className="space-y-3 mb-4">
      {flags.map((flag, index) => (
        <div 
          key={index}
          className="bg-warning-50 border-l-4 border-warning-400 rounded-r-xl p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-warning-800 font-bold text-sm mb-1">{flag.title}</h4>
              <p className="text-warning-700 text-xs font-medium leading-relaxed">
                {flag.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
