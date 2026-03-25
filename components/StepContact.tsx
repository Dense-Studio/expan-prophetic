import React, { useState } from "react";
import { saveRegistration } from "../lib/db";
import { sendWelcomeSms } from "../lib/sms";
import { FormData } from "../types";

interface StepContactProps {
  formData: FormData;
  onUpdate: (data: Partial<FormData>) => void;
  onContinue: () => void;
  onBack: () => void;
}

const StepContact: React.FC<StepContactProps> = ({
  formData,
  onUpdate,
  onContinue,
  onBack,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const isValidPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length === 10 && cleaned.startsWith("0");
  };

  const isValid = isValidPhone(formData.phoneNumber);

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await saveRegistration(formData);

      try {
        await sendWelcomeSms(formData.phoneNumber, formData.firstName);
      } catch (smsErr) {
        console.warn("SMS failed:", smsErr);
      }

      setShowSuccess(true);
      setTimeout(() => onContinue(), 800);
    } catch (err: any) {
      setError(err.message || "Failed to register.");
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <section>
      <div className="flex gap-2 mb-6 opacity-0 animate-fade-up">
        <div className="h-1.5 flex-1 rounded-full bg-ink-faint/20 overflow-hidden"><div className="h-full w-full progress-active"></div></div>
        <div className="h-1.5 flex-1 rounded-full bg-ink-faint/20 overflow-hidden"><div className="h-full w-full progress-active"></div></div>
        <div className="h-1.5 flex-1 rounded-full bg-ink-faint/20 overflow-hidden"><div className="h-full w-full progress-active"></div></div>
        <div className="h-1.5 flex-1 rounded-full bg-ink-faint/20 overflow-hidden"><div className="h-full w-full progress-active"></div></div>
      </div>

      <div className="mb-4 opacity-0 animate-fade-up" style={{ animationDelay: "0.05s" }}>
        <button onClick={onBack} className="flex items-center gap-1.5 text-ink-muted hover:text-ink transition-colors group">
          <span className="material-symbols-outlined text-lg transition-transform group-hover:-translate-x-0.5">arrow_back</span>
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      <div className="mb-5 opacity-0 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <h1 className="font-serif text-[32px] md:text-[40px] text-ink leading-tight">
          Almost done!<br />
          <span className="text-brand italic">Your phone.</span>
        </h1>
        <p className="text-ink-muted text-sm mt-2">We'll send you a welcome message shortly.</p>
      </div>

      <div className="space-y-5">
        <label className="flex flex-col opacity-0 animate-stagger-2">
          <span className="text-ink-light text-xs font-bold uppercase tracking-[0.12em] mb-2 ml-0.5">Phone Number</span>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <span className={`material-symbols-outlined text-xl transition-colors duration-200 ${isSubmitting ? "text-brand animate-pulse" : "text-ink-faint group-focus-within:text-brand"}`}>call</span>
            </div>
            <input
              autoFocus
              className="clean-input w-full h-14 pl-12 pr-4 text-ink text-base font-medium placeholder:text-ink-faint"
              placeholder="024 123 4567"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => onUpdate({ phoneNumber: e.target.value.replace(/\D/g, "") })}
              disabled={isSubmitting || showSuccess}
            />
          </div>
        </label>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm animate-slide-in-right bg-red-50 px-4 py-3 rounded-xl border border-red-200">
            <span className="material-symbols-outlined text-lg">error</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    </section>
  );

  const footerContent = (
    <div className="mt-auto pt-4 opacity-0 animate-slide-up" style={{ animationDelay: "0.12s" }}>
      <button
        onClick={handleSubmit}
        disabled={!isValid || isSubmitting || showSuccess}
        className="btn-brand w-full h-14 flex items-center justify-center gap-2 text-base"
      >
        {showSuccess ? (
          <span className="flex items-center gap-2 animate-scale-in">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" className="check-mark" />
            </svg>
            Done!
          </span>
        ) : isSubmitting ? (
          <span className="flex items-center gap-3">
            <span className="spinner"></span>
            Registering...
          </span>
        ) : (
          "Complete Registration"
        )}
      </button>
      <p className="text-center text-xs text-ink-faint mt-3">Step 3 of 3</p>
    </div>
  );

  return (
    <div className="h-screen bg-cream flex overflow-hidden">
      {/* Desktop side panel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden">
        <img src="/assets/image-4.jpg" alt="Ministration" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/70 to-brand/40"></div>
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <p className="text-white/60 text-xs font-bold tracking-[0.2em] uppercase mb-3">Extreme Prophetic Encounter</p>
          <h2 className="font-serif text-white text-5xl xl:text-6xl leading-[0.95]">
            EXPAN<br /><span className="italic opacity-80">Prophetic</span>
          </h2>
          <p className="text-white/50 text-sm mt-4">One more step to complete your registration.</p>
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

export default StepContact;
