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

      onContinue();
    } catch (err: any) {
      setError(err.message || "Failed to register.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep bg-gradient-radial flex flex-col">
      <main className="flex w-full max-w-[480px] flex-col px-6 py-6 flex-grow justify-between mx-auto">
        <section className="animate-fade-up">
          <div className="flex w-full flex-row items-center justify-center gap-2 mb-10">
            <div className="h-1 flex-1 rounded-full bg-accent/30"></div>
            <div className="h-1 flex-1 rounded-full bg-accent/30"></div>
            <div className="h-1 flex-1 rounded-full bg-accent/30"></div>
            <div className="h-1 flex-1 rounded-full bg-accent"></div>
          </div>

          <div className="mb-6">
            <button onClick={onBack} className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span className="text-sm font-medium">Back</span>
            </button>
          </div>

          <div className="mb-8">
            <h1 className="text-white tracking-tight text-[28px] md:text-[36px] font-extrabold leading-tight">
              Almost done!
              <br />
              <span className="text-gradient">Your phone.</span>
            </h1>
            <p className="text-white/40 text-sm mt-2">We'll send you a welcome message shortly.</p>
          </div>

          <div className="space-y-5">
            <label className="flex flex-col w-full">
              <span className="text-white/50 text-xs font-bold uppercase tracking-[0.15em] mb-2 ml-1">Phone Number</span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <span className="material-symbols-outlined text-xl text-white">call</span>
                </div>
                <input
                  autoFocus
                  className="flex w-full rounded-xl border border-white/8 glass-input h-14 pl-11 pr-4 text-white placeholder:text-white/20 text-base font-medium outline-none"
                  placeholder="024 123 4567"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => onUpdate({ phoneNumber: e.target.value.replace(/\D/g, "") })}
                  disabled={isSubmitting}
                />
              </div>
            </label>

            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>
        </section>

        <div className="mt-10 animate-slide-up">
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="flex w-full items-center justify-center rounded-xl h-14 bg-primary text-white text-base font-bold btn-glow"
          >
            {isSubmitting ? "Registering..." : "Complete Registration"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default StepContact;
