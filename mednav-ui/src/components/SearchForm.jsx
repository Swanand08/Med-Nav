import { Search, Info, MapPin, User, Wallet, Activity, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { COMORBIDITIES } from "../lib/constants";
import LocationAutocomplete from "./LocationAutocomplete";

export default function SearchForm({ 
  formData, 
  setFormData, 
  onSubmit, 
  isLoading 
}) {
  const toggleComorbidity = (condition) => {
    setFormData(prev => {
      const current = prev.comorbidities || [];
      const isSelected = current.includes(condition);
      
      return {
        ...prev,
        comorbidities: isSelected 
          ? current.filter(c => c !== condition)
          : [...current, condition]
      };
    });
  };

  const handleBudgetChange = (e) => {
    const numericValue = e.target.value.replace(/[^0-9]/g, '');
    setFormData(prev => ({...prev, budget: numericValue ? parseInt(numericValue, 10) : ''}));
  };

  const handleLocationChange = (locationData) => {
    if (!locationData) {
      setFormData(prev => ({...prev, city: '', userLat: null, userLng: null}));
      return;
    }
    setFormData(prev => ({
      ...prev,
      city: locationData.city,
      userLat: locationData.lat,
      userLng: locationData.lng,
    }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
      className="max-w-4xl mx-auto w-full px-4 mb-20 relative z-20 -mt-6"
    >
      
      <form 
        onSubmit={(e) => { e.preventDefault(); onSubmit(); }} 
        className="bg-white rounded-3xl p-5 sm:p-7 shadow-[0_15px_40px_rgba(15,23,42,0.06)] border border-slate-200 relative overflow-hidden"
      >
        {/* Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600"></div>

        {/* Main Search Input */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-blue-600" />
          </div>
          <input
            type="text"
            required
            className="block w-full pl-14 pr-5 py-4 text-lg font-bold text-slate-900 border-2 border-slate-100 bg-slate-50/50 hover:bg-slate-50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all placeholder:font-medium placeholder-slate-400"
            placeholder="Search illness, condition or procedure..."
            value={formData.query || ''}
            onChange={(e) => setFormData(prev => ({...prev, query: e.target.value}))}
            disabled={isLoading}
          />
        </div>

        {/* Location Autocomplete */}
        <div className="mb-6">
          <LocationAutocomplete
            value={formData.city || ""}
            onChange={handleLocationChange}
            disabled={isLoading}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {/* Age */}
          <div className="col-span-1 md:col-span-1">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <User className="w-4 h-4 text-slate-400" />
              Patient Age
            </label>
            <input 
              type="number"
              min="0"
              max="120"
              required
              className="block w-full px-4 py-3 text-base font-bold text-slate-800 border-2 border-slate-100 bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:bg-white rounded-xl transition-all"
              placeholder="e.g. 58"
              value={formData.age || ''}
              onChange={(e) => setFormData({...formData, age: e.target.value ? parseInt(e.target.value) : ''})}
              disabled={isLoading}
            />
          </div>

          {/* Budget */}
          <div className="col-span-1 md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <Wallet className="w-4 h-4 text-slate-400" />
              Max Budget
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-400 font-black text-base">₹</span>
              </div>
              <input 
                type="text"
                className="block w-full pl-10 pr-4 py-3 text-base font-black text-slate-900 border-2 border-slate-100 bg-slate-50/50 focus:border-blue-500 focus:bg-white rounded-xl transition-all font-numbers"
                placeholder="2,00,000"
                value={formData.budget ? new Intl.NumberFormat('en-IN').format(formData.budget) : ''}
                onChange={handleBudgetChange}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Comorbidities */}
        <div className="mb-6 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
          <label className="flex items-center justify-between text-sm font-bold text-slate-700 mb-3">
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              Risk Factors
            </span>
            <Info className="h-3.5 w-3.5 text-slate-400" />
          </label>
          <div className="flex flex-wrap gap-2">
            {COMORBIDITIES.map(condition => {
              const isSelected = (formData.comorbidities || []).includes(condition);
              return (
                <button
                  type="button"
                  key={condition}
                  onClick={() => toggleComorbidity(condition)}
                  disabled={isLoading}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all duration-200 border-2 active:scale-[0.98]",
                    isSelected 
                      ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm" 
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
                  )}
                >
                  {condition}
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-end">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isLoading || !formData.query || !formData.city || !formData.age}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-8 rounded-xl shadow-md font-bold text-base text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
                Processing...
              </span>
            ) : (
              <>
                Calculate Pathway <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>
      </form>
      
      {/* Emergency Notice */}
      <p className="mt-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
        If this is an emergency, call 108 immediately.
      </p>

    </motion.div>
  );
}
