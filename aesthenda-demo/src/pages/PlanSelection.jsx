import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PlanCard = ({ 
  title, 
  price, 
  description, 
  features, 
  recommended = false, 
  onSelect,
  selected = false
}) => {
  return (
    <div 
      className={`bg-white border rounded-sm p-6 flex flex-col h-full transform transition-all duration-200 ${
        selected 
          ? 'border-[#C0A371] border-2 shadow-lg scale-105' 
          : recommended 
            ? 'border-gray-300 hover:border-[#C0A371] hover:shadow-md' 
            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      {recommended && (
        <div className="bg-[#C0A371] text-white text-xs uppercase tracking-wider py-1 px-3 absolute top-0 right-0 transform translate-x-1 -translate-y-1/2">
          Recommended
        </div>
      )}
      
      <h3 className="font-serif text-xl uppercase tracking-wide mb-2">{title}</h3>
      
      <div className="mb-4">
        <span className="text-2xl font-bold">${price}</span>
        <span className="text-gray-500 text-sm">/month</span>
      </div>
      
      <p className="text-gray-600 mb-6 flex-grow">{description}</p>
      
      <ul className="space-y-2 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg className="h-5 w-5 text-[#A9A29A] mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      
      <button
        onClick={onSelect}
        className={`w-full py-2 px-4 text-sm uppercase tracking-widest transition-colors ${
          selected 
            ? 'bg-[#C0A371] text-white' 
            : 'bg-[#A9A29A] text-black hover:bg-[#918b84]'
        }`}
      >
        {selected ? 'Selected' : 'Select Plan'}
      </button>
    </div>
  );
};

const PlanSelection = () => {
  const { currentUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const navigate = useNavigate();
  
  const plans = [
    {
      id: 'independent',
      title: 'Independent Stylist',
      price: 29,
      description: 'Perfect for solo stylists who rent a chair or work from home.',
      features: [
        'Client booking system',
        'Calendar management',
        'Up to 100 clients',
        'Basic reporting',
        'Email notifications',
        'Mobile-friendly access'
      ]
    },
    {
      id: 'studio',
      title: 'Hair Studio',
      price: 79,
      description: 'Ideal for small studios with 2-5 stylists sharing space.',
      features: [
        'Everything in Independent plan',
        'Up to 5 stylist accounts',
        'Resource scheduling',
        'Staff management',
        'Expanded reporting',
        'Custom branding',
        'Client messaging'
      ],
      recommended: true
    },
    {
      id: 'salon',
      title: 'Full Salon',
      price: 149,
      description: 'Complete solution for established salons with multiple staff members.',
      features: [
        'Everything in Studio plan',
        'Unlimited stylist accounts',
        'Inventory management',
        'Multiple locations',
        'Advanced analytics',
        'Staff performance tracking',
        'Customer loyalty program',
        'Priority support'
      ]
    }
  ];
  
  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
  };
  
  const handleContinue = () => {
    if (selectedPlan) {
      // In a real app, we would store the selected plan
      localStorage.setItem('selected_plan', selectedPlan);
      navigate('/payment');
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-serif text-3xl uppercase tracking-wider mb-4">Choose Your Plan</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Select the perfect plan for your business. All plans include our core booking system, 
            calendar management, and client profiles. You can upgrade or downgrade at any time.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map(plan => (
            <PlanCard
              key={plan.id}
              title={plan.title}
              price={plan.price}
              description={plan.description}
              features={plan.features}
              recommended={plan.recommended}
              selected={selectedPlan === plan.id}
              onSelect={() => handleSelectPlan(plan.id)}
            />
          ))}
        </div>
        
        <div className="text-center">
          <button
            onClick={handleContinue}
            disabled={!selectedPlan}
            className={`py-3 px-8 text-black uppercase tracking-widest ${
              selectedPlan 
                ? 'bg-[#C0A371] hover:bg-[#b0946a] cursor-pointer' 
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Continue to Payment
          </button>
          
          <p className="mt-4 text-sm text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlanSelection; 