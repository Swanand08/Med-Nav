import { AlertTriangle, TrendingUp, Stethoscope } from "lucide-react";

export default function ResponsibleAIPanel({ confidence }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Responsible AI Disclosures</p>
      
      <div className="space-y-3">

        {/* Safeguard 1: Mapping Risk */}
        <div className="flex gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
          <Stethoscope className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-orange-900 mb-0.5">Symptom Mapping Uncertainty</h4>
            <p className="text-xs text-orange-800 leading-relaxed font-medium">
              Symptom-to-condition mapping carries uncertainty (confidence: {(confidence * 100).toFixed(0)}%). 
              Vague symptoms may map to incorrect ICD-10 codes. Always validate with a qualified physician before any financial or medical decisions.
            </p>
          </div>
        </div>

        {/* Safeguard 3: Decision Support Only */}
        <div className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <AlertTriangle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-gray-700 mb-0.5">Decision Support Positioning</h4>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              MedNav is a financial and logistical planning tool — NOT a diagnostic or treatment advice platform. 
              We do not replace a doctor's clinical judgment.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
