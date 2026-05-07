import { ArrowRight } from "lucide-react";

export default function MappingChain({ query, icd10, icd10Desc, hbpCode, treatment }) {
  const steps = [
    { label: "User Input", value: `"${query}"`, color: "bg-gray-100 text-gray-700 border-gray-200" },
    { label: "Gemini NLP", value: `ICD-10: ${icd10}`, sublabel: icd10Desc, color: "bg-blue-50 text-blue-800 border-blue-200" },
    { label: "PMJAY Lookup", value: `HBP: ${hbpCode}`, color: "bg-success-50 text-success-800 border-success-200" },
    { label: "Approved Treatment", value: treatment, color: "bg-primary-50 text-primary-800 border-primary-200" },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Clinical Mapping Chain</p>
      <div className="flex flex-wrap items-start gap-1">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-1 flex-wrap">
            <div className={`px-3 py-2 rounded-lg border text-xs font-semibold ${step.color}`}>
              <div className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-0.5">{step.label}</div>
              <div className="font-bold">{step.value}</div>
              {step.sublabel && (
                <div className="text-xs font-normal opacity-75 mt-0.5 max-w-[140px] leading-tight">{step.sublabel}</div>
              )}
            </div>
            {i < steps.length - 1 && (
              <ArrowRight className="w-4 h-4 text-gray-300 mt-3 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-3 font-medium">
        Mapping Source: Gemini AI (NLP) → PMJAY Health Benefit Package Schedule 2024 → NHA Operational Guidelines
      </p>
    </div>
  );
}
