import { useState } from 'react'
import NavBar from './components/NavBar'
import DisclaimerBanner from './components/DisclaimerBanner'
import HeroSection from './components/HeroSection'
import SearchForm from './components/SearchForm'
import DemoChips from './components/DemoChips'
import LoadingState from './components/LoadingState'
import { EMERGENCY_KEYWORDS } from './lib/constants'

// Placeholder components that will be built in later phases
const EmergencyAlert = ({ onAcknowledge }) => (
  <div className="fixed inset-0 bg-danger-600 z-[9999] flex flex-col items-center justify-center text-white p-6 text-center">
    <h1 className="text-6xl font-bold mb-4">108</h1>
    <h2 className="text-3xl font-bold mb-6">MEDICAL EMERGENCY DETECTED</h2>
    <p className="text-xl max-w-2xl mx-auto mb-10">This sounds like a medical emergency. Please call 108 (Ambulance) immediately. Do not use this tool for emergencies.</p>
    <button onClick={onAcknowledge} className="px-8 py-4 bg-white text-danger-600 font-bold rounded-xl hover:bg-gray-100">I understand, return to search</button>
  </div>
)
import ResultsPage from './components/ResultsPage'
import { analyzeQuery } from './api/navigator'

function App() {
  const [appState, setAppState] = useState('search') // 'search' | 'loading' | 'results' | 'emergency'
  const [formData, setFormData] = useState({
    query: '',
    city: '',
    age: '',
    budget: '',
    comorbidities: []
  })
  
  const [persona, setPersona] = useState('patient') // 'patient' | 'loan_officer'
  const [resultsData, setResultsData] = useState(null)

  const handleSearchSubmit = async () => {
    // Check for emergency keywords client-side first (instant response)
    const lowerQuery = formData.query.toLowerCase()
    const isEmergency = EMERGENCY_KEYWORDS.some(keyword => lowerQuery.includes(keyword))
    
    if (isEmergency) {
      setAppState('emergency')
      return;
    }

    setAppState('loading')

    try {
      // Single call to real FastAPI backend (replaces 3-step mock)
      const result = await analyzeQuery({
        query: formData.query,
        city: formData.city,
        age: formData.age,
        budget: formData.budget,
        comorbidities: formData.comorbidities,
        persona,
        userLat: formData.userLat,
        userLng: formData.userLng,
      });

      // Backend detected emergency (e.g. via Claude reading the query)
      if (result.emergency) {
        setAppState('emergency');
        return;
      }

      setResultsData(result.data);
      setAppState('results');
    } catch (error) {
      console.error("Pipeline Error:", error);
      alert(`Something went wrong: ${error.message}`);
      setAppState('search');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <DisclaimerBanner />
      
      {appState === 'emergency' && (
        <EmergencyAlert onAcknowledge={() => setAppState('search')} />
      )}

      <main className="flex-1 mt-24">
        {appState === 'search' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <HeroSection />
            <SearchForm 
              formData={formData} 
              setFormData={setFormData}
              onSubmit={handleSearchSubmit}
              isLoading={false}
              persona={persona}
              setPersona={setPersona}
            />
            <DemoChips  
              setFormData={setFormData}
              isLoading={false}
            />
          </div>
        )}

        {appState === 'loading' && <LoadingState />}
        
        {appState === 'results' && resultsData && (
          <ResultsPage 
            data={resultsData} 
            budget={formData.budget} 
            persona={persona}
            onBack={() => setAppState('search')}
          />
        )}
      </main>
    </div>
  )
}

export default App
