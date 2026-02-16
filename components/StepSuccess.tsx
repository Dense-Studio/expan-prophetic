
import React from 'react';
import { FormData } from '../types';

interface StepSuccessProps {
  formData: FormData;
}

const StepSuccess: React.FC<StepSuccessProps> = ({ formData }) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 text-center">
      <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/40">
          <span className="material-symbols-outlined text-5xl text-white">done_all</span>
        </div>
        
        <h1 className="text-4xl font-extrabold text-white mb-4">
          You're in, <span className="text-primary">{formData.firstName}</span>!
        </h1>
        
        <p className="text-slate-400 text-lg leading-relaxed mb-10">
          Welcome to the EXPAN community. We've sent a prophetic welcome message to your phone at <strong>{formData.phoneNumber}</strong>.
        </p>

        <button 
          onClick={() => window.location.reload()}
          className="w-full bg-slate-900 border border-white/10 hover:bg-slate-800 text-white font-bold py-5 rounded-xl transition-all"
        >
          Explore Community
        </button>
      </div>

      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-[120px]"></div>
      </div>
    </div>
  );
};

export default StepSuccess;
