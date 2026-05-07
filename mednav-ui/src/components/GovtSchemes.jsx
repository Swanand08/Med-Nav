export default function GovtSchemes({ pmjay, stateScheme }) {
  if (!pmjay && !stateScheme) return null;

  return (
    <div className="mt-8 border-t border-gray-200 pt-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Government Health Schemes Available</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PMJAY Card */}
        {pmjay && (
          <div className="bg-white rounded-xl border border-success-200 overflow-hidden shadow-sm flex flex-col h-full">
            <div className="bg-success-600 px-5 py-3 border-b border-success-700 text-white">
              <h4 className="font-bold text-lg">Ayushman Bharat PMJAY</h4>
              <p className="text-success-100 text-sm">Central Government Scheme</p>
            </div>
            <div className="p-5 flex flex-col flex-grow">
              <div className="mb-4">
                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Max Coverage</span>
                <span className="text-2xl font-black text-gray-900">₹5,00,000 <span className="text-sm font-medium text-gray-500">/ year</span></span>
              </div>
              <div className="mb-6 flex-grow">
                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Eligibility</span>
                <p className="text-sm text-gray-700 font-medium">BPL families and low-income categories as per SECC 2011.</p>
              </div>
              {pmjay.covered && pmjay.rate && (
                <div className="mb-6 bg-success-50 p-3 rounded-lg border border-success-100">
                  <span className="block text-xs font-bold text-success-800 mb-1">Approved Rate for Procedure</span>
                  <span className="text-xl font-bold text-success-700 font-mono">₹{pmjay.rate.toLocaleString('en-IN')}</span>
                </div>
              )}
              <a 
                href="https://beneficiary.nha.gov.in" 
                target="_blank" 
                rel="noreferrer"
                className="block w-full py-3 text-center bg-success-50 hover:bg-success-100 text-success-700 font-bold rounded-lg transition-colors border border-success-200 mt-auto"
              >
                Check Eligibility →
              </a>
            </div>
          </div>
        )}

        {/* State Scheme Card */}
        {stateScheme && (
          <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden shadow-sm flex flex-col h-full">
            <div className="bg-secondary-600 px-5 py-3 border-b border-secondary-700 text-white">
              <h4 className="font-bold text-lg truncate" title={stateScheme.name}>{stateScheme.name}</h4>
              <p className="text-secondary-100 text-sm">State Government Scheme</p>
            </div>
            <div className="p-5 flex flex-col flex-grow">
              <div className="mb-4">
                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Max Coverage</span>
                <span className="text-2xl font-black text-gray-900">₹{stateScheme.coverage}</span>
              </div>
              <div className="mb-4">
                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Eligibility</span>
                <p className="text-sm text-gray-700 font-medium">{stateScheme.eligibility}</p>
              </div>
              <div className="mb-6 flex-grow">
                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Helpline</span>
                <p className="text-sm font-bold text-gray-900">{stateScheme.helpline}</p>
              </div>
              <a 
                href={stateScheme.url} 
                target="_blank" 
                rel="noreferrer"
                className="block w-full py-3 text-center bg-secondary-50 hover:bg-secondary-100 text-secondary-700 font-bold rounded-lg transition-colors border border-secondary-200 mt-auto"
              >
                Check Eligibility →
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
