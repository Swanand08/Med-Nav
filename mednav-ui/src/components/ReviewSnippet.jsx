import { MessageSquare, ThumbsUp, ThumbsDown, Star, User, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "../lib/utils";

export default function ReviewSnippet({ analysis, googleReviews = [] }) {
  const [showReviews, setShowReviews] = useState(false);
  const hasAnalysis = analysis && analysis.analysis_review && !analysis.analysis_review.includes("pending");
  const hasGoogleReviews = googleReviews && googleReviews.length > 0;

  if (!hasAnalysis && !hasGoogleReviews) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 flex items-center gap-3">
        <MessageSquare className="w-5 h-5 text-slate-300" />
        <p className="text-xs text-slate-400 font-medium italic">Community feedback for this facility is still pending.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
      {/* AI Analysis Section */}
      {hasAnalysis && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">AI Patient Sentiment Analysis</h4>
          </div>
          
          <p className="text-sm text-slate-800 font-semibold leading-relaxed mb-4 border-l-2 border-blue-200 pl-3 italic">
            "{analysis.analysis_review}"
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Strengths */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <ThumbsUp className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-wider">Strengths</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.strengths && analysis.strengths.map((str, i) => (
                  <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-100">
                    {str}
                  </span>
                ))}
              </div>
            </div>

            {/* Weaknesses */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-amber-600">
                <ThumbsDown className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-wider">Weaknesses</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.weaknesses && analysis.weaknesses.map((wk, i) => (
                  <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md border border-amber-100">
                    {wk}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Live Google Reviews Section */}
      {hasGoogleReviews && (
        <div className={cn(hasAnalysis && "pt-4 border-t border-slate-100")}>
          <button
            onClick={() => setShowReviews(!showReviews)}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors w-full"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Live Google Reviews ({googleReviews.length})</span>
            <span className={cn("ml-auto text-[10px] text-blue-500 font-bold transition-transform", showReviews && "rotate-180")}>
              {showReviews ? "Hide" : "Show"}
            </span>
          </button>

          {showReviews && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mt-3 space-y-3 overflow-hidden"
            >
              {googleReviews.map((review, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-3.5 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">{review.author}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, si) => (
                          <Star
                            key={si}
                            className={cn(
                              "w-3 h-3",
                              si < review.rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-200"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{review.relativeTime}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{review.text}</p>
                </div>
              ))}
              <p className="text-[9px] text-slate-400 italic text-center">Reviews sourced live from Google Maps</p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
