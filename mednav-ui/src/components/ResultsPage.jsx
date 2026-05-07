import { useState } from "react";
import ResultsHeader from "./ResultsHeader";
import DisclaimerBox from "./DisclaimerBox";
import HospitalCard from "./HospitalCard";
import CostBreakdown from "./CostBreakdown";
import ConfidenceMeter from "./ConfidenceMeter";
import RiskFlags from "./RiskFlags";
import BudgetWarning from "./BudgetWarning";
import GovtSchemes from "./GovtSchemes";
import UHIInfoBlock from "./UHIInfoBlock";
import MappingChain from "./MappingChain";
import DataSourcesBadge from "./DataSourcesBadge";
import ResponsibleAIPanel from "./ResponsibleAIPanel";
import { ArrowLeft, Sparkles, ChevronDown } from "lucide-react";

export default function ResultsPage({ data, budget, persona, onBack }) {
  const [visibleCount, setVisibleCount] = useState(5);

  if (!data) return null;

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 5, data.ranked_hospitals?.length || 0));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-6 mt-4 bg-white/50 w-max px-3 py-1.5 rounded-full border border-slate-200 backdrop-blur-md shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Search
      </button>

      {/* Data Sources Badge — Multi-source intelligence (15%) */}
      <DataSourcesBadge />

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-2">
        
        {/* Left Column Component (65%) */}
        <div className="lg:col-span-8">
          <ResultsHeader 
            condition={data.condition}
            icd10Code={data.icd10}
            icd10Desc={data.icd10Desc}
            confidence={data.confidence}
            confidenceExplanation={data.confidence_explanation}
          />

          {/* AI Clinical Assessment Block */}
          {data.clinical_assessment && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 shadow-sm flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-200">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">MedNav Initial AI Assessment</h3>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">
                  {data.clinical_assessment}
                </p>
              </div>
            </div>
          )}

          {/* Mapping Chain — Clinical mapping accuracy (20%) */}
          <MappingChain
            query={data.condition}
            icd10={data.icd10}
            icd10Desc={data.icd10Desc}
            hbpCode={data.hbp_code || "HBP-REF"}
            treatment={data.procedure || data.condition}
          />

          <DisclaimerBox />
          
          <div className="space-y-6 mt-8">
            <div className="flex items-center justify-between mb-2 px-1">
               <div className="flex items-center gap-2">
                 <Sparkles className="w-4 h-4 text-blue-600" />
                 <p className="text-sm font-bold text-slate-700">
                   Top {data.ranked_hospitals?.length} Matches Found
                 </p>
               </div>
            </div>
            
            {data.ranked_hospitals?.slice(0, visibleCount).map((hospital, index) => (
              <HospitalCard key={index} hospital={hospital} />
            ))}

            {visibleCount < (data.ranked_hospitals?.length || 0) && (
              <button 
                onClick={loadMore}
                className="w-full mt-4 py-3 sm:py-4 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Show More Hospitals
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Column Component (35%) - Sticky on Desktop */}
        <div className="lg:col-span-4 relative">
          <div className="lg:sticky lg:top-24 max-h-[calc(100vh-6rem)] overflow-y-auto pb-8 scrollbar-hide space-y-6">
            
            <ConfidenceMeter 
              score={data.confidence} 
              explanation={data.confidence_explanation} 
            />

            {/* Responsible AI Panel — Responsible AI (10%) */}
            <ResponsibleAIPanel confidence={data.confidence} />

            <BudgetWarning 
              budget={budget}
              estimatedMin={data.cost_breakdown?.total?.min}
              pmjayRate={data.govt_schemes?.pmjay?.rate}
              govtCostMin={data.ranked_hospitals?.find(h => h.tier === 'government')?.costMin}
              persona={persona}
            />

            <RiskFlags flags={data.risk_flags} />
            
            <CostBreakdown 
              breakdown={data.cost_breakdown}
              privateBreakdown={data.private_cost_breakdown}
              pmjayRate={data.govt_schemes?.pmjay?.rate}
              isPmjayCovered={data.govt_schemes?.pmjay?.covered}
            />

          </div>
        </div>
      </div>

      {/* Full Width Footer Region */}
      <div className="mt-8">
        <GovtSchemes 
          pmjay={data.govt_schemes?.pmjay} 
          stateScheme={data.govt_schemes?.state_scheme} 
        />
        
        <UHIInfoBlock />
      </div>
      
    </div>
  );
}
