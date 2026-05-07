import { cn } from "../lib/utils";

export default function ResultsHeader({ condition, icd10Code, icd10Desc, confidence, confidenceExplanation }) {
  let confidenceColor = "bg-orange-100 text-orange-800 border-orange-200";
  let confidenceText = "Low Confidence";

  if (confidence >= 0.85) {
    confidenceColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
    confidenceText = "High Confidence";
  } else if (confidence >= 0.60) {
    confidenceColor = "bg-amber-100 text-amber-800 border-amber-200";
    confidenceText = "Moderate Confidence";
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 py-4 mb-4 border-b border-slate-200">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 capitalize">{condition}</h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="px-2 py-1 bg-slate-100 text-slate-700 font-numbers text-sm font-bold rounded border border-slate-200">
            {icd10Code}
          </span>
          <span className="text-sm font-medium text-slate-500">{icd10Desc}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 text-right sm:w-1/3">
        <div className={cn("px-3 py-1 rounded-full text-sm font-bold border w-max", confidenceColor)}>
          {confidenceText} ({(confidence * 100).toFixed(0)}%)
        </div>
        {confidence < 0.85 && confidenceExplanation && (
          <p className="text-[11px] text-slate-500 font-medium leading-tight">
            {confidenceExplanation}
          </p>
        )}
      </div>
    </div>
  );
}
