import React from "react";
import { FormData } from "../types";

interface StepNameProps {
  formData: FormData;
  onUpdate: (data: Partial<FormData>) => void;
  onContinue: () => void;
  onBack: () => void;
}

const StepName: React.FC<StepNameProps> = ({
  formData,
  onUpdate,
  onContinue,
  onBack,
}) => {
  const isValid =
    formData.firstName.trim().length > 1 && formData.lastName.trim().length > 1;

  return (
    <div className="min-h-screen bg-bg-deep bg-gradient-radial flex flex-col">
      <main className="flex w-full max-w-[480px] flex-col px-6 py-6 flex-grow justify-between mx-auto">
        <section className="animate-fade-up">
          <div className="flex w-full flex-row items-center justify-center gap-2 mb-10">
            <div className="h-1 flex-1 rounded-full bg-white/20"></div>
            <div className="h-1 flex-1 rounded-full bg-accent"></div>
            <div className="h-1 flex-1 rounded-full bg-white/8"></div>
            <div className="h-1 flex-1 rounded-full bg-white/8"></div>
          </div>

          <div className="mb-6">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span className="text-sm font-medium">Back</span>
            </button>
          </div>

          <div className="mb-8">
            <h1 className="text-white tracking-tight text-[28px] md:text-[36px] font-extrabold leading-tight">
              Tell us
              <br />
              <span className="text-gradient">your name.</span>
            </h1>
            <p className="text-sm font-medium mt-2 text-white/40">
              Welcome! Let's get to know you.
            </p>
          </div>

          <div className="space-y-5">
            <label className="flex flex-col w-full">
              <span className="text-white/50 text-xs font-bold uppercase tracking-[0.15em] mb-2 ml-1">First Name</span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <span className="material-symbols-outlined text-xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                </div>
                <input
                  autoFocus
                  className="flex w-full rounded-xl border border-white/8 glass-input h-14 pl-11 pr-4 text-white placeholder:text-white/20 text-base font-medium focus:border-accent/50 focus:ring-0 transition-all outline-none"
                  placeholder="Enter first name"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => onUpdate({ firstName: e.target.value })}
                />
              </div>
            </label>

            <label className="flex flex-col w-full">
              <span className="text-white/50 text-xs font-bold uppercase tracking-[0.15em] mb-2 ml-1">Last Name</span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <span className="material-symbols-outlined text-xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
                </div>
                <input
                  className="flex w-full rounded-xl border border-white/8 glass-input h-14 pl-11 pr-4 text-white placeholder:text-white/20 text-base font-medium focus:border-accent/50 focus:ring-0 transition-all outline-none"
                  placeholder="Enter last name"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => onUpdate({ lastName: e.target.value })}
                />
              </div>
            </label>
          </div>
        </section>

        <div className="mt-10 space-y-3 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <button
            onClick={onContinue}
            disabled={!isValid}
            className="flex w-full cursor-pointer items-center justify-center rounded-xl h-14 bg-primary text-white text-base font-bold btn-glow active:scale-[0.98] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span>Continue</span>
            <span className="material-symbols-outlined ml-2 text-lg">arrow_forward</span>
          </button>
          <p className="text-center text-xs text-white/25">Step 1 of 3</p>
        </div>
      </main>
    </div>
  );
};

export default StepName;
