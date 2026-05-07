import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { formatCurrency, cn } from '../lib/utils';
import { ShieldCheck, Info, Building2, Landmark } from 'lucide-react';
import { useState } from 'react';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CostBreakdown({ breakdown, privateBreakdown, pmjayRate, isPmjayCovered }) {
  const [activeTab, setActiveTab] = useState('private'); // 'gov' | 'private'
  
  // Fallback to whichever is available
  if (!breakdown && !privateBreakdown) return null;
  const currentData = activeTab === 'gov' ? breakdown : (privateBreakdown || breakdown);

  const data = {
    labels: [
      'Procedure / Implant',
      'Hospital Stay',
      'Doctor Fee',
      'Medication',
      'Diagnostics',
      'Contingency'
    ],
    datasets: [
      {
        data: [
          (currentData.procedure.min + currentData.procedure.max) / 2,
          (currentData.room_stay.min + currentData.room_stay.max) / 2,
          (currentData.doctor_fee.min + currentData.doctor_fee.max) / 2,
          (currentData.medication.min + currentData.medication.max) / 2,
          (currentData.diagnostics.min + currentData.diagnostics.max) / 2,
          (currentData.contingency.min + currentData.contingency.max) / 2,
        ],
        backgroundColor: activeTab === 'gov' ? [
          '#059669', // emerald
          '#10b981',
          '#34d399',
          '#6ee7b7',
          '#a7f3d0',
          '#ecfdf5',
        ] : [
          '#1d4ed8', // blue
          '#3b82f6',
          '#93c5fd',
          '#1e293b', // slate
          '#64748b',
          '#cbd5e1',
        ],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { size: 10, family: 'Inter' }, usePointStyle: true, padding: 10 }
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${formatCurrency(context.raw)}`
        }
      }
    },
    maintainAspectRatio: false,
    animation: { duration: 700 }
  };

  const rows = [
    { label: 'Procedure & Implant', data: currentData.procedure, tip: 'Core surgical procedure, theater costs, and prosthetic implants' },
    { label: 'Hospital Stay', data: currentData.room_stay, tip: 'Room rent, nursing charges, and dietary services' },
    { label: 'Doctor Fee', data: currentData.doctor_fee, tip: 'Primary surgeon, assistant, and anesthetist consultation fees' },
    { label: 'Medication', data: currentData.medication, tip: 'Pharmacy and consummables during the entire admission period' },
    { label: 'Diagnostics', data: currentData.diagnostics, tip: 'Pre-surgery imaging, bloodwork, and post-op monitoring' },
    { label: 'Contingency', data: currentData.contingency, tip: 'A calculated buffer for unexpected extended ICU stay or complications' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl mb-4 shadow-sm relative z-10 overflow-hidden">
      {/* Header Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50">
        {privateBreakdown && (
          <button
            onClick={() => setActiveTab('private')}
            className={cn(
              "flex-1 py-3 px-2 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors",
              activeTab === 'private' ? "bg-white text-blue-700 border-t-2 border-t-blue-600 border-r border-slate-200 shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 border-t-2 border-t-transparent border-r border-slate-200"
            )}
          >
            <Building2 className="w-3.5 h-3.5" />
            Private Avg
          </button>
        )}
        <button
          onClick={() => setActiveTab('gov')}
          className={cn(
            "flex-1 py-3 px-2 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors",
            activeTab === 'gov' ? "bg-white text-emerald-700 border-t-2 border-t-emerald-600 shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 border-t-2 border-t-transparent"
          )}
        >
          <Landmark className="w-3.5 h-3.5" />
          Govt Baseline
        </button>
      </div>

      <div className="p-5">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
          {activeTab === 'private' ? 'Estimated Regional Market Cost' : 'PMJAY Official Baseline'}
        </h3>
        
        <div className={cn("text-4xl font-extrabold mb-6 font-numbers tracking-tight cursor-default", activeTab === 'gov' ? "text-emerald-700" : "text-blue-700")}>
          {formatCurrency(currentData.total.min)} <span className="text-2xl text-slate-300 font-medium font-sans">to</span> {formatCurrency(currentData.total.max)}
        </div>

        <div className="space-y-1 mb-6">
          {rows.map((row, i) => (
            <div key={i} className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0 group hover:bg-slate-50 transition-colors px-1 rounded-sm">
              <div className="flex items-center gap-1.5 relative cursor-default">
                <span className="text-sm text-slate-700 font-bold">{row.label}</span>
                <Info className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 font-sans font-medium leading-relaxed">
                  {row.tip}
                  <div className="absolute -bottom-1 left-4 w-2 h-2 bg-slate-800 transform rotate-45"></div>
                </div>
              </div>
              <span className="text-sm font-black text-slate-900 font-numbers bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                {formatCurrency(row.data.min)} - {formatCurrency(row.data.max)}
              </span>
            </div>
          ))}
          
          {activeTab === 'gov' && isPmjayCovered && (
            <div className="flex justify-between items-center py-3 px-3 -mx-2 bg-emerald-50 rounded-lg mt-4 border border-emerald-100 shadow-sm">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-emerald-900 font-extrabold">PMJAY Rate (if eligible)</span>
              </div>
              <span className="text-sm font-black text-emerald-700 font-numbers bg-white px-2 py-0.5 rounded border border-emerald-100 shadow-sm">
                {formatCurrency(pmjayRate)}
              </span>
            </div>
          )}
        </div>

        <div className="h-64 mt-6 relative border-t border-slate-100 pt-6">
          <Pie data={data} options={options} />
        </div>

        {/* Source Attribution */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
            <span className="font-extrabold text-slate-500 uppercase">Source: </span> 
            {activeTab === 'gov' 
              ? 'PMJAY Health Benefit Package Schedule 2024 (NHA). Itemized split based on operational guidelines.'
              : 'Derived market estimate based on Practo, Credihealth, and historical hospital billing data for this city class.'}
          </p>
        </div>
      </div>
    </div>
  );
}
