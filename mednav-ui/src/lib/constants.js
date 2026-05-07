export const TIER_COLORS = {
  premium: 'bg-primary-100 text-primary-800 border-primary-200',
  mid: 'bg-secondary-100 text-secondary-800 border-secondary-200',
  budget: 'bg-gray-100 text-gray-800 border-gray-200',
  government: 'bg-success-100 text-success-800 border-success-200'
};

export const RANK_BORDERS = {
  1: 'border-l-primary-500',
  2: 'border-l-secondary-500',
  3: 'border-l-gray-400'
};

export const CITIES = ['Nagpur', 'Pune', 'Mumbai'];

export const COMORBIDITIES = [
  'Diabetes',
  'Hypertension',
  'Heart Disease',
  'Kidney Disease',
  'Obesity',
  'Lung Disease'
];

export const EMERGENCY_KEYWORDS = [
  'heart attack',
  'stroke',
  'not breathing',
  'unconscious',
  'severe chest pain right now',
  'accident',
  'bleeding heavily'
];

export const DEMO_CHIPS = [
  {
    label: 'Angioplasty, Nagpur, 58yr, Diabetic, ₹3L',
    query: 'angioplasty',
    city: 'Nagpur',
    age: 58,
    budget: 300000,
    comorbidities: ['Diabetes']
  },
  {
    label: 'Knee Replacement, Pune, 62yr, Diabetic, ₹3L',
    query: 'knee replacement',
    city: 'Pune',
    age: 62,
    budget: 300000,
    comorbidities: ['Diabetes']
  },
  {
    label: 'Cataract Surgery, Mumbai, 70yr, Hypertension, ₹1L',
    query: 'cataract surgery',
    city: 'Mumbai',
    age: 70,
    budget: 100000,
    comorbidities: ['Hypertension']
  },
  {
    label: 'Appendectomy, Nagpur, 35yr, No comorbidities, ₹2L',
    query: 'appendectomy',
    city: 'Nagpur',
    age: 35,
    budget: 200000,
    comorbidities: []
  },
  {
    label: 'Bypass Surgery, Pune, 55yr, Heart Disease, ₹5L',
    query: 'bypass surgery',
    city: 'Pune',
    age: 55,
    budget: 500000,
    comorbidities: ['Heart Disease']
  }
];
