import { AlertOctagon, ArrowRight } from "lucide-react";
import { formatCurrency } from "../lib/utils";

export default function BudgetWarning({ budget, estimatedMin, pmjayRate, govtCostMin, persona }) {
  // Only show if minimum estimated cost exceeds budget by more than 25%
  if (!budget || estimatedMin <= budget * 1.25) return null;

  const isOfficer = persona === 'loan_officer';

  return (
    <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertOctagon className="w-6 h-6 text-orange-600" />
        <h3 className="text-lg font-bold text-orange-800">
          {isOfficer ? "Flag: Claim Exceeds Average" : "Budget Exceeded"}
        </h3>
      </div>
      
      <p className="text-sm text-orange-800 font-medium mb-4">
        {isOfficer 
          ? `The claimed amount of ${formatCurrency(budget)} is significantly lower than the minimum expected cost of ${formatCurrency(estimatedMin)} in private tiers. Potential data error or under-reporting.`
          : `Your budget of ${formatCurrency(budget)} is below the minimum estimated cost of ${formatCurrency(estimatedMin)} for private hospitals.`
        }
      </p>

      <div className="space-y-2">
        <div className="bg-white rounded-lg p-3 border border-orange-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-900">
              {isOfficer ? "Check PMJAY Flag" : "Check PMJAY Eligibility"}
            </p>
            <p className="text-xs text-gray-500">
              {isOfficer ? `Government rate is ${formatCurrency(pmjayRate)}` : `Could be ${formatCurrency(pmjayRate)} if eligible`}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </div>
        
        {govtCostMin && (
          <div className="bg-white rounded-lg p-3 border border-orange-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">Government Hospital Baseline</p>
              <p className="text-xs text-gray-500">Estimates start from {formatCurrency(govtCostMin)}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </div>
        )}

        <div className="bg-white rounded-lg p-3 border border-orange-100">
          <p className="text-sm font-bold text-gray-900">
            {isOfficer ? "Underwriting Action" : "Healthcare Loans"}
          </p>
          <p className="text-xs text-gray-500">
            {isOfficer ? "Require further itemized documentation before approval" : "NBFCs provide no-cost EMIs up to 18 months"}
          </p>
        </div>
      </div>
    </div>
  );
}
