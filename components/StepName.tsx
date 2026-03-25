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

  const formContent = (
    <section>
      {/* Progress bar */}
      <div className="flex gap-2 mb-6 opacity-0 animate-fade-up">
        <div className="h-1.5 flex-1 rounded-full bg-ink-faint/20 overflow-hidden">
          <div className="h-full w-full progress-active"></div>
        </div>
        <div className="h-1.5 flex-1 rounded-full bg-ink-faint/20 overflow-hidden">
          <div className="h-full w-full progress-active"></div>
        </div>
        <div className="h-1.5 flex-1 rounded-full bg-ink-faint/20"></div>
        <div className="h-1.5 flex-1 rounded-full bg-ink-faint/20"></div>
      </div>

      {/* Back button */}
      <div className="mb-4 opacity-0 animate-fade-up" style={{ animationDelay: "0.05s" }}>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-ink-muted hover:text-ink transition-colors duration-200 group"
        >
          <span className="material-symbols-outlined text-lg transition-transform group-hover:-translate-x-0.5">arrow_back</span>
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      {/* Heading */}
      <div className="mb-5 opacity-0 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <h1 className="font-serif text-[32px] md:text-[40px] text-ink leading-tight">
          Tell us<br />
          <span className="text-brand italic">your name.</span>
        </h1>
        <p className="text-sm text-ink-muted mt-2">
          Welcome! Let's get to know you.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-5">
        <label className="flex flex-col opacity-0 animate-stagger-2">
          <span className="text-ink-light text-xs font-bold uppercase tracking-[0.12em] mb-2 ml-0.5">First Name</span>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <span className="material-symbols-outlined text-xl text-ink-faint group-focus-within:text-brand transition-colors duration-200" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            </div>
            <input
              autoFocus
              className="clean-input w-full h-[52px] pl-12 pr-4 text-ink text-base font-medium placeholder:text-ink-faint"
              placeholder="Enter first name"
              type="text"
              value={formData.firstName}
              onChange={(e) => onUpdate({ firstName: e.target.value })}
            />
          </div>
        </label>

        <label className="flex flex-col opacity-0 animate-stagger-3">
          <span className="text-ink-light text-xs font-bold uppercase tracking-[0.12em] mb-2 ml-0.5">Last Name</span>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <span className="material-symbols-outlined text-xl text-ink-faint group-focus-within:text-brand transition-colors duration-200" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
            </div>
            <input
              className="clean-input w-full h-[52px] pl-12 pr-4 text-ink text-base font-medium placeholder:text-ink-faint"
              placeholder="Enter last name"
              type="text"
              value={formData.lastName}
              onChange={(e) => onUpdate({ lastName: e.target.value })}
            />
          </div>
        </label>
      </div>
    </section>
  );

  const footerContent = (
    <div className="mt-auto pt-4 space-y-3 opacity-0 animate-slide-up" style={{ animationDelay: "0.15s" }}>
      <button
        onClick={onContinue}
        disabled={!isValid}
        className="btn-brand w-full h-[52px] flex items-center justify-center gap-2 text-base"
      >
        Continue
        <span className="material-symbols-outlined text-lg">arrow_forward</span>
      </button>
      <p className="text-center text-xs text-ink-faint">Step 1 of 3</p>
    </div>
  );

  return (
    <div className="h-screen bg-cream flex overflow-hidden">
      {/* Desktop side panel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden">
        <img src="/assets/image-2.jpg" alt="Ministration" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/70 to-brand/40"></div>
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <p className="text-white/60 text-xs font-bold tracking-[0.2em] uppercase mb-3">Extreme Prophetic Encounter</p>
          <h2 className="font-serif text-white text-5xl xl:text-6xl leading-[0.95]">
            EXPAN<br /><span className="italic opacity-80">Prophetic</span>
          </h2>
          <p className="text-white/50 text-sm mt-4">Join us for a night of supernatural encounter.</p>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col px-6 py-5 lg:px-12 lg:py-6 max-w-[600px] w-full mx-auto lg:mx-0">
        {formContent}
        {footerContent}
      </div>
    </div>
  );
};

export default StepName;
