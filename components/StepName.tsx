
import React from 'react';
import { FormData } from '../types';

interface StepNameProps {
  formData: FormData;
  onUpdate: (data: Partial<FormData>) => void;
  onContinue: () => void;
  onBack: () => void;
}

const StepName: React.FC<StepNameProps> = ({ formData, onUpdate, onContinue, onBack }) => {
  const isValid = formData.firstName.trim().length > 1 && formData.lastName.trim().length > 1;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <main className="flex w-full max-w-[480px] flex-col px-6 py-8 md:py-12 flex-grow justify-between mx-auto">
        <section>
          {/* Progress Bar */}
          <div className="flex w-full flex-row items-center justify-center gap-3 mb-12">
            <div className="h-1.5 flex-1 rounded-full bg-primary"></div>
            <div className="h-1.5 flex-1 rounded-full bg-white/10"></div>
          </div>

          <div className="mb-8">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity text-white"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span className="text-sm">Back</span>
            </button>
          </div>

          <div className="mb-10">
            <h1 className="text-white tracking-tight text-[32px] md:text-[40px] font-extrabold leading-tight">
              Let's start with <br/><span className="text-primary">your name.</span>
            </h1>
            <p className="text-base font-medium mt-3 text-white/60">
              Tell us what we should call you.
            </p>
          </div>

          <div className="space-y-6">
            <label className="flex flex-col w-full group">
              <span className="text-white text-sm font-bold uppercase tracking-wider mb-2 ml-1 opacity-70">First Name</span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <span className="material-symbols-outlined text-xl text-white/50">person</span>
                </div>
                <input 
                  autoFocus
                  className="flex w-full rounded-xl border border-white/10 bg-white/5 h-16 pl-12 pr-4 text-white placeholder:text-white/20 text-lg font-medium focus:border-primary focus:ring-0 transition-all outline-none" 
                  placeholder="Enter first name" 
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => onUpdate({ firstName: e.target.value })}
                />
              </div>
            </label>

            <label className="flex flex-col w-full group">
              <span className="text-white text-sm font-bold uppercase tracking-wider mb-2 ml-1 opacity-70">Last Name</span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <span className="material-symbols-outlined text-xl text-white/50">badge</span>
                </div>
                <input 
                  className="flex w-full rounded-xl border border-white/10 bg-white/5 h-16 pl-12 pr-4 text-white placeholder:text-white/20 text-lg font-medium focus:border-primary focus:ring-0 transition-all outline-none" 
                  placeholder="Enter last name" 
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => onUpdate({ lastName: e.target.value })}
                />
              </div>
            </label>
          </div>
        </section>

        <div className="mt-12 space-y-4">
          <button 
            onClick={onContinue}
            disabled={!isValid}
            className="flex w-full cursor-pointer items-center justify-center rounded-xl h-16 bg-primary text-white text-lg font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span>Continue</span>
            <span className="material-symbols-outlined ml-2">arrow_forward</span>
          </button>
          <p className="text-center text-xs text-white/40 px-8">
            Step 1 of 2
          </p>
        </div>
      </main>

      <div className="fixed -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10"></div>
    </div>
  );
};

export default StepName;
