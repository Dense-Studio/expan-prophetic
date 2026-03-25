import React from "react";
import { FormData } from "../types";

interface StepDetailsProps {
  formData: FormData;
  onUpdate: (data: Partial<FormData>) => void;
  onContinue: () => void;
  onBack: () => void;
}

const StepDetails: React.FC<StepDetailsProps> = ({
  formData,
  onUpdate,
  onContinue,
  onBack,
}) => {
  const formContent = (
    <section>
      {/* Progress bar */}
      <div className="flex gap-2 mb-6 opacity-0 animate-fade-up">
        <div className="h-1.5 flex-1 rounded-full bg-ink-faint/20 overflow-hidden"><div className="h-full w-full progress-active"></div></div>
        <div className="h-1.5 flex-1 rounded-full bg-ink-faint/20 overflow-hidden"><div className="h-full w-full progress-active"></div></div>
        <div className="h-1.5 flex-1 rounded-full bg-ink-faint/20 overflow-hidden"><div className="h-full w-full progress-active"></div></div>
        <div className="h-1.5 flex-1 rounded-full bg-ink-faint/20"></div>
      </div>

      <div className="mb-4 opacity-0 animate-fade-up" style={{ animationDelay: "0.05s" }}>
        <button onClick={onBack} className="flex items-center gap-1.5 text-ink-muted hover:text-ink transition-colors group">
          <span className="material-symbols-outlined text-lg transition-transform group-hover:-translate-x-0.5">arrow_back</span>
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      <div className="mb-5 opacity-0 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <h1 className="font-serif text-[32px] md:text-[40px] text-ink leading-tight">
          Tell us more<br />
          <span className="text-brand italic">about you.</span>
        </h1>
      </div>

      <div className="space-y-5">
        {/* Location */}
        <label className="flex flex-col opacity-0 animate-stagger-1">
          <span className="text-ink-light text-xs font-bold uppercase tracking-[0.12em] mb-2 ml-0.5">Your Location</span>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <span className="material-symbols-outlined text-xl text-ink-faint group-focus-within:text-brand transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
            </div>
            <input
              className="clean-input w-full h-14 pl-12 pr-4 text-ink text-base font-medium placeholder:text-ink-faint"
              placeholder="Where do you stay?"
              type="text"
              value={formData.locationName}
              onChange={(e) => onUpdate({ locationName: e.target.value })}
            />
          </div>
        </label>

        {/* Referral */}
        <label className="flex flex-col opacity-0 animate-stagger-2">
          <span className="text-ink-light text-xs font-bold uppercase tracking-[0.12em] mb-2 ml-0.5">How did you hear about us?</span>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
              <span className="material-symbols-outlined text-xl text-ink-faint group-focus-within:text-brand transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
            </div>
            <select
              className="clean-input w-full h-14 pl-12 pr-10 text-ink text-base font-medium appearance-none cursor-pointer"
              value={formData.referralSource}
              onChange={(e) => onUpdate({ referralSource: e.target.value })}
            >
              <option value="">Select an option</option>
              <option value="Posters & Flyers">Posters & Flyers</option>
              <option value="Invited by someone">Invited by someone</option>
              <option value="Social Media">Social Media</option>
              <option value="Other">Other</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <span className="material-symbols-outlined text-lg text-ink-faint">expand_more</span>
            </div>
          </div>
        </label>

        {/* Student toggle */}
        <div className="card p-4 opacity-0 animate-stagger-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-lg text-brand" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
              </div>
              <span className="text-ink text-sm font-semibold">Are you a student?</span>
            </div>
            <button
              onClick={() => onUpdate({ isStudent: !formData.isStudent })}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 ${formData.isStudent ? "bg-brand shadow-sm" : "bg-ink-faint/30"}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${formData.isStudent ? "translate-x-6" : ""}`}></div>
            </button>
          </div>

          {formData.isStudent && (
            <div className="mt-4 opacity-0 animate-scale-in">
              <span className="text-ink-muted text-[11px] font-bold uppercase tracking-wider mb-2 block">Name of School</span>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="material-symbols-outlined text-lg text-ink-faint group-focus-within:text-brand transition-colors">apartment</span>
                </div>
                <input
                  className="clean-input w-full h-12 pl-10 pr-4 text-ink text-sm placeholder:text-ink-faint"
                  placeholder="Which school do you attend?"
                  type="text"
                  value={formData.school}
                  onChange={(e) => onUpdate({ school: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );

  const footerContent = (
    <div className="mt-auto pt-4 space-y-3 opacity-0 animate-slide-up" style={{ animationDelay: "0.12s" }}>
      <button
        onClick={onContinue}
        disabled={!formData.locationName || !formData.referralSource || (formData.isStudent && !formData.school)}
        className="btn-brand w-full h-14 flex items-center justify-center gap-2 text-base"
      >
        Continue
        <span className="material-symbols-outlined text-lg">arrow_forward</span>
      </button>
      <p className="text-center text-xs text-ink-faint">Step 2 of 3</p>
    </div>
  );

  return (
    <div className="h-screen bg-cream flex overflow-hidden">
      {/* Desktop side panel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden">
        <img src="/assets/image-3.jpg" alt="Ministration" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/70 to-brand/40"></div>
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <p className="text-white/60 text-xs font-bold tracking-[0.2em] uppercase mb-3">Extreme Prophetic Encounter</p>
          <h2 className="font-serif text-white text-5xl xl:text-6xl leading-[0.95]">
            EXPAN<br /><span className="italic opacity-80">Prophetic</span>
          </h2>
          <p className="text-white/50 text-sm mt-4">Tell us a bit more about yourself.</p>
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

export default StepDetails;
