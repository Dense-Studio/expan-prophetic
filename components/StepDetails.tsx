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
  return (
    <div className="min-h-screen bg-bg-deep bg-gradient-radial flex flex-col">
      <main className="flex w-full max-w-[480px] flex-col px-6 py-6 flex-grow justify-between mx-auto">
        <section className="animate-fade-up">
          <div className="flex w-full flex-row items-center justify-center gap-2 mb-10">
            <div className="h-1 flex-1 rounded-full bg-accent/30"></div>
            <div className="h-1 flex-1 rounded-full bg-accent/30"></div>
            <div className="h-1 flex-1 rounded-full bg-accent"></div>
            <div className="h-1 flex-1 rounded-full bg-white/8"></div>
          </div>

          <div className="mb-6">
            <button onClick={onBack} className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span className="text-sm font-medium">Back</span>
            </button>
          </div>

          <div className="mb-8">
            <h1 className="text-white tracking-tight text-[28px] md:text-[36px] font-extrabold leading-tight">
              Tell us more
              <br />
              <span className="text-gradient">about you.</span>
            </h1>
          </div>

          <div className="space-y-5">

            <label className="flex flex-col w-full">
              <span className="text-white/50 text-xs font-bold uppercase tracking-[0.15em] mb-2 ml-1">Your Location</span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <span className="material-symbols-outlined text-xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                </div>
                <input
                  className="flex w-full rounded-xl border border-white/8 glass-input h-14 pl-11 pr-4 text-white placeholder:text-white/20 text-base font-medium focus:border-accent/50 outline-none"
                  placeholder="Where do you stay? (e.g. Accra, Kumasi)"
                  type="text"
                  value={formData.locationName}
                  onChange={(e) => onUpdate({ locationName: e.target.value })}
                />
              </div>
            </label>

            <label className="flex flex-col w-full">
              <span className="text-white/50 text-xs font-bold uppercase tracking-[0.15em] mb-2 ml-1">How did you hear about us?</span>
              <select
                className="flex w-full rounded-xl border border-white/8 glass-input h-14 px-4 text-white text-base font-medium outline-none"
                value={formData.referralSource}
                onChange={(e) => onUpdate({ referralSource: e.target.value })}
                style={{ colorScheme: "dark" }}
              >
                <option value="">Select an option</option>
                <option value="Posters & Flyers">Posters & Flyers</option>
                <option value="Invited by someone">Invited by someone</option>
                <option value="Social Media">Social Media</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <div className="flex flex-col w-full p-4 rounded-xl bg-white/5 border border-white/8">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-semibold tracking-wide">Are you a student?</span>
                <button
                  onClick={() => onUpdate({ isStudent: !formData.isStudent })}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${formData.isStudent ? "bg-accent" : "bg-white/10"}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${formData.isStudent ? "translate-x-6" : ""}`}></div>
                </button>
              </div>

              {formData.isStudent && (
                <div className="mt-4 animate-fade-in">
                  <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2 block">Name of School</span>
                  <input
                    className="flex w-full rounded-lg border border-white/10 glass-input h-12 px-4 text-white placeholder:text-white/20 text-sm outline-none"
                    placeholder="Which school do you attend?"
                    type="text"
                    value={formData.school}
                    onChange={(e) => onUpdate({ school: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="mt-10 space-y-3 animate-slide-up">
          <button
            onClick={onContinue}
            disabled={!formData.locationName || !formData.referralSource || (formData.isStudent && !formData.school)}
            className="flex w-full items-center justify-center rounded-xl h-14 bg-primary text-white text-base font-bold btn-glow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Continue</span>
            <span className="material-symbols-outlined ml-2 text-lg">arrow_forward</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default StepDetails;
