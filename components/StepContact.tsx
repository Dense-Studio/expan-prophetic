import React, { useState } from "react";
import { FormData } from "../types";
import { saveRegistration } from "../lib/db";
import { sendWelcomeSms } from "../lib/sms";

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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    onUpdate({ phoneNumber: rawValue });
  };

  const displayPhone = (value: string) => {
    if (!value) return "";
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return cleaned;
  };

  const isValid = formData.phoneNumber.length >= 10;

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Save registration to Supabase
      await saveRegistration(formData);

      // Send welcome SMS via Arkesel
      try {
        await sendWelcomeSms(formData.phoneNumber, formData.firstName);
      } catch (smsErr) {
        // Don't block registration if SMS fails
        console.warn("SMS failed but registration saved:", smsErr);
      }

      onContinue();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <main className="flex w-full max-w-[480px] flex-col px-6 py-8 md:py-12 flex-grow justify-between mx-auto">
        <section>
          {/* Progress Bar */}
          <div className="flex w-full flex-row items-center justify-center gap-3 mb-12">
            <div className="h-1.5 flex-1 rounded-full bg-primary/20"></div>
            <div className="h-1.5 flex-1 rounded-full bg-primary"></div>
          </div>

          <div className="mb-8">
            <button
              onClick={onBack}
              className="flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity text-white"
            >
              <span className="material-symbols-outlined text-lg">
                arrow_back
              </span>
              <span className="text-sm">Back</span>
            </button>
          </div>

          <div className="mb-10">
            <h1 className="text-white tracking-tight text-[32px] md:text-[40px] font-extrabold leading-tight">
              And how can we <br />
              <span className="text-primary">reach you?</span>
            </h1>
            <p className="text-base font-medium mt-3 text-white/60">
              Join our community and stay connected.
            </p>
          </div>

          <div className="space-y-6">
            <label className="flex flex-col w-full group">
              <span className="text-white text-sm font-bold uppercase tracking-wider mb-2 ml-1 opacity-70">
                Phone Number
              </span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <span className="material-symbols-outlined text-xl text-white/50">
                    call
                  </span>
                </div>
                <input
                  autoFocus
                  className="flex w-full rounded-xl border border-white/10 bg-white/5 h-16 pl-12 pr-4 text-white placeholder:text-white/20 text-lg font-medium focus:border-primary focus:ring-0 transition-all outline-none"
                  placeholder="024 123 4567"
                  type="tel"
                  maxLength={14}
                  value={displayPhone(formData.phoneNumber)}
                  onChange={handlePhoneChange}
                  disabled={isSubmitting}
                />
              </div>
            </label>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-red-400 text-lg mt-0.5">
                  error
                </span>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div className="bg-white/5 rounded-xl p-6 flex items-start gap-4 border border-white/5">
              <div className="bg-primary/10 rounded-full p-2">
                <span className="material-symbols-outlined text-primary">
                  notifications_active
                </span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Stay Updated</h3>
                <p className="text-xs text-white/60 mt-1 leading-relaxed">
                  We'll only use your number for important updates, event
                  reminders, and community news.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-12 space-y-4">
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="flex w-full cursor-pointer items-center justify-center rounded-xl h-16 bg-primary text-white text-lg font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined animate-spin mr-2">
                  progress_activity
                </span>
                <span>Registering...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <span className="material-symbols-outlined ml-2">
                  check_circle
                </span>
              </>
            )}
          </button>
          <p className="text-center text-xs text-white/40 px-8">Step 2 of 2</p>
        </div>
      </main>

      <div className="fixed -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10"></div>
      <div className="fixed -bottom-24 -left-24 w-96 h-96 bg-slate-500/10 rounded-full blur-3xl -z-10"></div>
    </div>
  );
};

export default StepContact;
