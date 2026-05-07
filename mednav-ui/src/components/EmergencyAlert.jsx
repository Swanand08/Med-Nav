import { Phone } from "lucide-react";

export default function EmergencyAlert({ isEmergency, onAcknowledge }) {
  if (!isEmergency) return null;

  return (
    <div className="fixed inset-0 bg-danger-600 z-[9999] flex flex-col items-center justify-center text-white p-6 text-center">
      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6">
        <Phone className="w-12 h-12 text-danger-600" />
      </div>
      <h1 className="text-7xl font-bold tracking-tight mb-4">108</h1>
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 max-w-2xl">
        This sounds like a medical emergency.
      </h2>
      <p className="text-lg sm:text-auto max-w-2xl mx-auto mb-10 text-danger-50">
        Please call 108 (Ambulance) immediately. Do not use this tool for emergency diagnostics.
      </p>
      <button 
        onClick={onAcknowledge} 
        className="px-8 py-4 bg-white text-danger-600 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
      >
        I have understood, return to search
      </button>
    </div>
  );
}
