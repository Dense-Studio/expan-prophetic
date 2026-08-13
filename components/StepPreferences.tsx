import React from "react";
import { ExpanAttendanceCount, FormData, PreferredLanguage } from "../types";

const LANGUAGES: PreferredLanguage[] = ["English", "Twi", "Fante", "Ga", "Ewe"];

const ATTENDANCE_OPTIONS: Array<{
  value: ExpanAttendanceCount;
  label: string;
  helper: string;
}> = [
  { value: 1, label: "First", helper: "My first EXPAN" },
  { value: 2, label: "Second", helper: "My second EXPAN" },
  { value: 3, label: "Third+", helper: "Three or more" },
];

interface StepPreferencesProps {
  formData: FormData;
  onUpdate: (data: Partial<FormData>) => void;
  onContinue: () => void;
  onBack: () => void;
}

const StepPreferences: React.FC<StepPreferencesProps> = ({
  formData,
  onUpdate,
  onContinue,
  onBack,
}) => {
  const isValid = Boolean(
    formData.preferredLanguage && formData.expanAttendanceCount,
  );

  return (
    <div className="h-screen bg-cream flex overflow-hidden">
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden">
        <img src="/assets/image-4.jpg" alt="EXPAN ministration" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/75 to-brand/45" />
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <p className="text-white/60 text-xs font-bold tracking-[0.2em] uppercase mb-3">Extreme Prophetic Encounter</p>
          <h2 className="font-serif text-white text-5xl xl:text-6xl leading-[0.95]">EXPAN<br /><span className="italic opacity-80">Prophetic</span></h2>
          <p className="text-white/55 text-sm mt-4">Help us serve and welcome you better.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-6 py-5 lg:px-12 lg:py-6 max-w-[600px] w-full mx-auto lg:mx-0">
        <section>
          <div className="flex gap-2 mb-6 opacity-0 animate-fade-up">
            {[0, 1, 2, 3].map((step) => (
              <div key={step} className="h-1.5 flex-1 rounded-full bg-ink-faint/20 overflow-hidden">
                {step <= 2 && <div className="h-full w-full progress-active" />}
              </div>
            ))}
          </div>

          <div className="mb-4 opacity-0 animate-fade-up" style={{ animationDelay: "0.05s" }}>
            <button onClick={onBack} className="flex items-center gap-1.5 text-ink-muted hover:text-ink transition-colors group">
              <span className="material-symbols-outlined text-lg transition-transform group-hover:-translate-x-0.5">arrow_back</span>
              <span className="text-sm font-medium">Back</span>
            </button>
          </div>

          <div className="mb-6 opacity-0 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <h1 className="font-serif text-[32px] md:text-[40px] text-ink leading-tight">Your EXPAN<br /><span className="text-brand italic">experience.</span></h1>
            <p className="text-ink-muted text-sm mt-2">These details help us serve you better.</p>
          </div>

          <div className="space-y-6">
            <label className="flex flex-col opacity-0 animate-stagger-2">
              <span className="text-ink-light text-xs font-bold uppercase tracking-[0.12em] mb-2 ml-0.5">Preferred Language</span>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
                  <span className="material-symbols-outlined text-xl text-ink-faint group-focus-within:text-brand">translate</span>
                </div>
                <select
                  className="clean-input w-full h-14 pl-12 pr-10 text-ink text-base font-medium appearance-none cursor-pointer"
                  value={formData.preferredLanguage}
                  onChange={(event) => onUpdate({ preferredLanguage: event.target.value as PreferredLanguage | "" })}
                >
                  <option value="">Select your preferred language</option>
                  {LANGUAGES.map((language) => <option key={language} value={language}>{language}</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <span className="material-symbols-outlined text-lg text-ink-faint">expand_more</span>
                </div>
              </div>
            </label>

            <fieldset className="opacity-0 animate-stagger-3">
              <legend className="text-ink-light text-xs font-bold uppercase tracking-[0.12em] mb-2 ml-0.5">How many EXPAN editions have you attended, including this one?</legend>
              <div className="grid grid-cols-3 gap-2.5">
                {ATTENDANCE_OPTIONS.map((option) => {
                  const selected = formData.expanAttendanceCount === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onUpdate({ expanAttendanceCount: option.value })}
                      className={`min-h-[82px] rounded-2xl border-2 px-2 py-3 text-center transition-all active:scale-[0.98] ${selected ? "border-brand bg-brand text-white shadow-md" : "border-ink-faint/30 bg-white text-ink hover:border-brand/40"}`}
                    >
                      <span className="block text-sm font-bold">{option.label}</span>
                      <span className={`block text-[10px] mt-1 leading-tight ${selected ? "text-white/70" : "text-ink-muted"}`}>{option.helper}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        </section>

        <div className="mt-auto pt-4 space-y-3 opacity-0 animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <button onClick={onContinue} disabled={!isValid} className="btn-brand w-full h-14 flex items-center justify-center gap-2 text-base">
            Continue <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
          <p className="text-center text-xs text-ink-faint">Step 3 of 4</p>
        </div>
      </div>
    </div>
  );
};

export default StepPreferences;
