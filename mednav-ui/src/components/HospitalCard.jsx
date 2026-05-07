import { useState } from "react";
import { ChevronDown, Star, Verified, ShieldCheck, Info, MapPin, Building2, Landmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatCurrency } from "../lib/utils";
import { TIER_COLORS, RANK_BORDERS } from "../lib/constants";
import ReviewSnippet from "./ReviewSnippet";

export default function HospitalCard({ hospital }) {
  const [expandedTab, setExpandedTab] = useState(null); // 'score' | 'cost' | null
  const { rank, name, address, tier, rating, reviewCount, costMin, costMax, totalScore, scoreBreakdown, costBreakdown, whyRecommended, isPmjay, isPrivate, costSource, costMethodology, googleReviews } = hospital;

  // Extract a shorter version of the address (e.g., Locality, City)
  const shortAddress = address?.split(',').slice(0, 2).join(',').trim() || "";

  const toggleTab = (tab) => {
    setExpandedTab(expandedTab === tab ? null : tab);
  };

  const getTierDisplayInfo = () => {
    switch(tier) {
      case 'premium': return { label: 'Private · Premium', colorClass: TIER_COLORS.premium, icon: Building2 };
      case 'mid': return { label: 'Private · Mid', colorClass: TIER_COLORS.mid, icon: Building2 };
      case 'budget': return { label: 'Private · Budget', colorClass: TIER_COLORS.budget, icon: Building2 };
      case 'government': return { label: 'Government', colorClass: TIER_COLORS.government, icon: Landmark };
      default: return { label: tier, colorClass: TIER_COLORS.mid, icon: Building2 };
    }
  };
  
  const tierInfo = getTierDisplayInfo();
  const rankBorder = RANK_BORDERS[rank] || 'border-l-slate-300';

  return (
    <div className={cn("bg-white border rounded-2xl shadow-sm overflow-hidden mb-6 border-l-[6px]", rankBorder, "hover:border-slate-300 transition-colors duration-200")}>
      <div className="p-6 sm:p-8">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-700 text-sm font-black border border-blue-100 font-numbers">
                #{rank}
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 leading-tight tracking-tight">{name}</h3>
              {shortAddress && (
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {shortAddress}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 ml-11 mt-1">
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold text-slate-800 font-numbers">{rating.toFixed(1)}</span>
                <span className="text-xs text-slate-500 font-medium font-numbers">({reviewCount.toLocaleString()})</span>
              </div>
              {hospital.distance && (
                <div className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 font-numbers">
                  {hospital.distance} away
                </div>
              )}
              <span className={cn("px-3 py-1 rounded-md text-xs font-bold border flex items-center gap-1.5", tierInfo.colorClass)}>
                {tierInfo.icon && <tierInfo.icon className="w-3.5 h-3.5" />}
                {tierInfo.label}
              </span>
            </div>
          </div>
          <div className="text-right bg-slate-50 p-3 rounded-xl border border-slate-100 relative group">
            <div className="flex items-center justify-end gap-1 mb-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fit Score</p>
              <div className="relative group/info">
                <Info className="w-3.5 h-3.5 text-slate-400 cursor-help hover:text-blue-500 transition-colors" />
                <div className="absolute right-0 top-6 w-64 bg-slate-900 text-white text-[10px] p-3 rounded-lg opacity-0 pointer-events-none group-hover/info:opacity-100 transition-opacity z-50 shadow-xl border border-slate-700">
                  <p className="font-black mb-2 uppercase border-b border-slate-700 pb-1">Scoring Methodology</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between"><span>Affordability (Budget vs Govt)</span><span className="text-emerald-400">40 pts</span></div>
                    <div className="flex justify-between"><span>Clinical Regulation (NHA Bonus)</span><span className="text-blue-400">30 pts</span></div>
                    <div className="flex justify-between"><span>Reputation (Google Rating)</span><span className="text-amber-400">30 pts</span></div>
                    <div className="flex justify-between"><span>Accessibility (Region Tier)</span><span className="text-teal-400">20 pts</span></div>
                  </div>
                  <p className="mt-2 text-[9px] text-slate-500 italic">Total 120 potential points. 100+ is a perfect fit.</p>
                </div>
              </div>
            </div>
            <div className="text-3xl font-black text-blue-900 font-numbers">{totalScore.toFixed(1)}</div>
          </div>
        </div>

        {/* AI Patient Review Summary */}
        <div className="mb-6">
          <ReviewSnippet analysis={hospital.review_analysis} googleReviews={googleReviews} />
        </div>

        {/* Cost & PMJAY Row */}
        <div className="mt-8 mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Est. Cost Range</p>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-numbers tracking-tight leading-none">
                {formatCurrency(costMin)} <span className="text-xl text-slate-400 font-medium px-2">-</span> {formatCurrency(costMax)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isPmjay && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-800 tracking-tight">PMJAY Empanelled</span>
                </div>
              )}
              {isPrivate && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-bold text-amber-800 tracking-tight">Private Hospital</span>
                </div>
              )}
            </div>
          </div>
          {/* Cost Source Disclaimer */}
          <div className="mt-3 pt-3 border-t border-slate-200">
            {isPrivate ? (
              <p className="text-[10px] text-slate-500 leading-relaxed">
                <span className="font-bold text-amber-700">Estimated Market Rate</span> — Derived by applying hospital tier, city index, and patient-specific adjustments to PMJAY baseline. Based on Practo, Credihealth & hospital-published data. Actual costs may vary — confirm with hospital before admission.
              </p>
            ) : (
              <p className="text-[10px] text-slate-500 leading-relaxed">
                <span className="font-bold text-emerald-700">PMJAY Government Rate</span> — Official NHA HBP 2024 Schedule. Zero out-of-pocket cost if PMJAY eligible.
              </p>
            )}
          </div>
        </div>

        {/* Why Recommended */}
        <div className="bg-blue-50/50 rounded-xl p-4 flex gap-3 border border-blue-100 mb-6 relative">
          <Verified className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-800 font-medium leading-relaxed z-10 relative">
            {whyRecommended}
          </p>
        </div>

        {/* Expandable Action Bar */}
        <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-4">
          <button 
            onClick={() => toggleTab('score')}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 py-2.5 rounded-lg transition-all duration-200 text-sm font-bold",
              expandedTab === 'score' ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            )}
          >
            <span>Breakdown Score</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", expandedTab === 'score' ? "rotate-180 text-white" : "text-slate-400")} />
          </button>
          
          <button 
            onClick={() => toggleTab('cost')}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 py-2.5 rounded-lg transition-all duration-200 text-sm font-bold",
              expandedTab === 'cost' ? "bg-blue-600 text-white" : "bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
            )}
          >
            <span>Detailed Cost Itemization</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", expandedTab === 'cost' ? "rotate-180 text-white" : "text-blue-400")} />
          </button>
        </div>
          
        <AnimatePresence mode="wait">
          {expandedTab === 'score' && (
            <motion.div
              key="score"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-5 space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-100"
            >
              <ScoreBar label="Clinical Match" value={scoreBreakdown.clinical} max={30} colorBg="bg-blue-500" />
              <ScoreBar label="Reputation & Quality" value={scoreBreakdown.reputation} max={30} colorBg="bg-slate-500" />
              <ScoreBar label="Accessibility" value={scoreBreakdown.accessibility} max={20} colorBg="bg-teal-500" />
              <ScoreBar label="Affordability" value={scoreBreakdown.affordability} max={40} colorBg="bg-emerald-500" />
            </motion.div>
          )}

          {expandedTab === 'cost' && (
            <motion.div
              key="cost"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-5 pt-3 border-t border-slate-100"
            >
              {costBreakdown ? (
                <CostTable breakdown={costBreakdown} pmjayRate={isPmjay ? 80000 : null} />
              ) : (
                <p className="text-sm text-slate-500 py-3 text-center bg-slate-50 rounded-lg">Detailed itemization not available for this facility.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

function ScoreBar({ label, value, max, colorBg }) {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5 align-baseline">
        <span className="font-bold text-slate-700 uppercase tracking-wider">{label}</span>
        <span className="font-extrabold text-slate-900 font-numbers">{value.toFixed(1)} <span className="text-slate-400 font-medium">/ {max}</span></span>
      </div>
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <motion.div 
          className={cn("h-full rounded-full", colorBg)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function CostTable({ breakdown, pmjayRate }) {
  const rows = [
    { label: 'Procedure & Implant', data: breakdown.procedure },
    { label: 'Hospital Stay (ICU/Ward)', data: breakdown.room_stay },
    { label: 'Doctor & Surgeon Fee', data: breakdown.doctor_fee },
    { label: 'Pharmacy & Meds', data: breakdown.medication },
    { label: 'Diagnostics & Labs', data: breakdown.diagnostics },
    { label: 'Contingency', data: breakdown.contingency },
  ];

  return (
    <div className="space-y-1">
      {rows.map((row, i) => (
        <div key={i} className="flex justify-between items-center py-2 px-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 rounded-lg transition-colors">
          <span className="text-xs text-slate-700 font-bold">{row.label}</span>
          <span className="text-sm font-extrabold text-slate-900 font-numbers bg-white px-2 py-0.5 rounded border border-slate-200">
            {formatCurrency(row.data.min)} - {formatCurrency(row.data.max)}
          </span>
        </div>
      ))}
      
      {pmjayRate && (
        <div className="flex justify-between items-center py-3 px-4 mt-4 bg-emerald-50 rounded-xl border border-emerald-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="text-sm text-emerald-900 font-extrabold tracking-tight">PMJAY Standard Package Rate</span>
          </div>
          <span className="text-sm font-black text-emerald-700 font-numbers bg-white px-2.5 py-1 rounded-md border border-emerald-100">
            {formatCurrency(pmjayRate)}
          </span>
        </div>
      )}
    </div>
  );
}
