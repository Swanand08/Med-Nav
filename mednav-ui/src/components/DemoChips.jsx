import { DEMO_CHIPS } from "../lib/constants";

export default function DemoChips({ setFormData, isLoading }) {
  return (
    <div className="max-w-2xl mx-auto px-4 mb-4">
      <p className="text-sm font-medium text-gray-500 mb-3 text-center">Quick Demos</p>
      <div className="flex flex-wrap justify-center gap-2">
        {DEMO_CHIPS.map((chip, index) => (
          <button
            key={index}
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                query: chip.query,
                city: chip.city,
                age: chip.age,
                budget: chip.budget,
                comorbidities: chip.comorbidities
              }));
            }}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full border border-gray-200 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
