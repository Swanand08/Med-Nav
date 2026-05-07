import { Info } from "lucide-react";

export default function UHIInfoBlock() {
  return (
    <div className="bg-white border text-center border-gray-200 rounded-xl p-6 mt-8">
      <div className="flex justify-center mb-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-50">
          <Info className="w-6 h-6 text-blue-600" />
        </div>
      </div>
      <h4 className="text-lg font-bold text-gray-900 mb-2">Ayushman Bharat Digital Mission (ABDM) Integration</h4>
      <p className="text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed">
        Is the patient linked to an ABHA ID? Health records, prescriptions, and lab reports can be stored digitally through the 
        Ayushman Bharat Health Account. Hospitals connected to the UHI (Unified Health Interface) network can access these records 
        directly—reducing paperwork and improving care continuity. Register for free at abha.abdm.gov.in.
      </p>
    </div>
  );
}
