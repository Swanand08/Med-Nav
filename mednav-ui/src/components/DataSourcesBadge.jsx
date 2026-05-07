import { Sparkles } from "lucide-react";

export default function DataSourcesBadge() {
  const sources = [
    { icon: "🏛", label: "PMJAY HBP 2024", sublabel: "Govt. Rates", color: "text-slate-700 bg-slate-50 border-slate-200" },
    { icon: "📍", label: "Google Places API", sublabel: "Live Ratings", color: "text-blue-700 bg-blue-50 border-blue-100" },
    { icon: "🧠", label: "Gemini AI", sublabel: "NLP Core", color: "text-slate-700 bg-slate-50 border-slate-200" },
    { icon: "📋", label: "NHA Guidelines", sublabel: "Cost Methodology", color: "text-slate-700 bg-slate-50 border-slate-200" },
  ];

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 sm:p-5 mb-8">
      <div className="flex items-center gap-2 mb-4 px-1">
        <Sparkles className="w-4 h-4 text-slate-400" />
        <h4 className="text-[11px] font-black tracking-[0.2em] text-slate-500 uppercase">Trusted Intelligence Sources</h4>
      </div>
      <div className="flex flex-wrap sm:flex-nowrap gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {sources.map((source, i) => (
          <div key={i} className={`flex-1 min-w-[170px] flex items-center gap-3 px-4 py-3 rounded-xl border ${source.color} transition-all duration-300 hover:shadow-sm`}>
            <div className="text-xl bg-white p-2 rounded-lg shadow-sm">{source.icon}</div>
            <div>
              <div className="text-sm font-extrabold tracking-tight">{source.label}</div>
              <div className="text-[11px] font-bold opacity-80 uppercase tracking-wider mt-0.5">{source.sublabel}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
