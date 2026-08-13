import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { findByPhone, recordEventCheckIn } from "../lib/attendance";
import { EVENT } from "../lib/event";
import { sendCheckInSms } from "../lib/sms";
import type { ExpanAttendanceCount, PreferredLanguage } from "../types";
import { useEventAccess } from "../lib/useEventAccess";

const LANGUAGES: PreferredLanguage[] = ["English", "Twi", "Fante", "Ga", "Ewe"];

interface CheckInSuccess {
  name: string;
  alreadyCheckedIn: boolean;
  smsSent: boolean;
}

const AttendanceLogin: React.FC = () => {
  const navigate = useNavigate();
  const isCheckInOpen = useEventAccess("check-in");
  const [phone, setPhone] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage | "">("");
  const [attendanceCount, setAttendanceCount] = useState<ExpanAttendanceCount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [success, setSuccess] = useState<CheckInSuccess | null>(null);

  const digits = phone.replace(/\D/g, "");
  const isValidPhone =
    (digits.length === 10 && digits.startsWith("0")) ||
    (digits.length === 12 && digits.startsWith("233"));

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value.replace(/\D/g, "").slice(0, 12));
    setNotFound(false);
    setError(null);
  };

  const handleCheckIn = async () => {
    if (!isValidPhone || !preferredLanguage || !attendanceCount || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setNotFound(false);

    try {
      const registration = await findByPhone(phone);
      if (!registration) {
        setNotFound(true);
        return;
      }

      const result = await recordEventCheckIn(
        registration.id,
        registration.phone_number,
        attendanceCount,
        preferredLanguage,
      );

      let smsSent = result.alreadyCheckedIn;
      if (!result.alreadyCheckedIn) {
        try {
          await sendCheckInSms(registration.phone_number, registration.first_name);
          smsSent = true;
        } catch (smsError) {
          console.warn("Check-in recorded, but SMS failed:", smsError);
        }
      }

      setSuccess({
        name: `${registration.first_name} ${registration.last_name}`,
        alreadyCheckedIn: result.alreadyCheckedIn,
        smsSent,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[minmax(420px,1fr)_minmax(430px,1fr)]">
      <section className="hidden lg:flex bg-[#24002f] items-center justify-center min-h-screen">
        <img src={EVENT.flyer} alt={`${EVENT.name} flyer`} className="w-full h-screen object-contain" />
      </section>

      <main className="flex min-h-screen flex-col px-6 py-6 sm:px-10 lg:px-16 max-w-xl w-full mx-auto">
        <button
          onClick={() => navigate("/")}
          className="self-start flex items-center gap-1.5 text-ink-muted hover:text-ink transition-colors"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="flex-1 flex flex-col justify-center py-10">
          <div className="mb-7 opacity-0 animate-fade-up">
            <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center shadow-md mb-5">
              <span className="material-symbols-outlined text-3xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>how_to_reg</span>
            </div>
            <p className="text-brand text-xs font-bold tracking-[0.2em] uppercase mb-2">{EVENT.name}</p>
            <h1 className="font-serif text-[36px] sm:text-[42px] text-ink leading-tight">
              Welcome <span className="text-brand italic">back!</span>
            </h1>
            <p className="text-ink-muted text-sm mt-3">
              Enter the phone number you used for a previous EXPAN registration.
            </p>
          </div>

          {!isCheckInOpen ? (
            <div className="card p-6 text-center opacity-0 animate-fade-up" style={{ animationDelay: "0.12s" }}>
              <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-brand" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
              </div>
              <h2 className="font-serif text-2xl text-ink">Check-in opens at 7 PM</h2>
              <p className="text-ink-muted text-sm mt-2">
                Check-in will open automatically on {EVENT.checkInOpensLabel}.
              </p>
              <button onClick={() => navigate("/")} className="mt-6 w-full h-12 rounded-xl border-2 border-brand text-brand font-bold hover:bg-brand-50 transition-colors">
                Back to Event Page
              </button>
            </div>
          ) : success ? (
            <div className="card p-6 text-center animate-scale-in" style={{ opacity: 0 }}>
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4 border-2 border-emerald-200">
                <svg className="w-10 h-10 text-emerald-500" viewBox="0 0 52 52" fill="none">
                  <circle cx="26" cy="26" r="25" stroke="currentColor" strokeWidth="2" className="check-circle" />
                  <path d="M14 27l8 8 16-16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="check-mark" />
                </svg>
              </div>
              <h2 className="text-ink text-xl font-bold mb-1">{success.name}</h2>
              <p className={success.alreadyCheckedIn ? "text-amber-600 text-sm font-medium" : "text-emerald-600 text-sm font-medium"}>
                {success.alreadyCheckedIn ? "You are already checked in for this program." : "Your check-in is confirmed!"}
              </p>
              {!success.alreadyCheckedIn && (
                <p className={`text-xs mt-2 ${success.smsSent ? "text-ink-muted" : "text-amber-600"}`}>
                  {success.smsSent ? "A confirmation SMS has been sent to you." : "Your check-in was saved, but the confirmation SMS could not be sent."}
                </p>
              )}
              <button
                onClick={() => { setSuccess(null); setPhone(""); setPreferredLanguage(""); setAttendanceCount(null); }}
                className="mt-6 w-full h-12 card text-ink font-semibold hover:bg-cream-dark active:scale-[0.98]"
              >
                Check In Another Person
              </button>
            </div>
          ) : (
            <div className="space-y-5 opacity-0 animate-fade-up" style={{ animationDelay: "0.12s" }}>
              <label className="flex flex-col text-left">
                <span className="text-ink-light text-xs font-bold uppercase tracking-[0.12em] mb-2">Phone Number</span>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <span className={`material-symbols-outlined text-xl ${isSubmitting ? "text-brand animate-pulse" : "text-ink-faint group-focus-within:text-brand"}`}>call</span>
                  </div>
                  <input
                    autoFocus
                    className="clean-input w-full h-14 pl-12 pr-4 text-ink placeholder:text-ink-faint"
                    placeholder="024 123 4567"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    onKeyDown={(event) => { if (event.key === "Enter") void handleCheckIn(); }}
                    disabled={isSubmitting}
                  />
                </div>
              </label>

              <label className="flex flex-col text-left">
                <span className="text-ink-light text-xs font-bold uppercase tracking-[0.12em] mb-2">Preferred Language</span>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
                    <span className="material-symbols-outlined text-xl text-ink-faint group-focus-within:text-brand">translate</span>
                  </div>
                  <select
                    className="clean-input w-full h-14 pl-12 pr-10 text-ink text-base font-medium appearance-none cursor-pointer"
                    value={preferredLanguage}
                    onChange={(event) => setPreferredLanguage(event.target.value as PreferredLanguage | "")}
                    disabled={isSubmitting}
                  >
                    <option value="">Select your preferred language</option>
                    {LANGUAGES.map((language) => <option key={language} value={language}>{language}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <span className="material-symbols-outlined text-lg text-ink-faint">expand_more</span>
                  </div>
                </div>
              </label>

              <fieldset>
                <legend className="text-ink-light text-xs font-bold uppercase tracking-[0.12em] mb-2">
                  Including today, which EXPAN is this for you?
                </legend>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { value: 1 as const, label: "1" },
                    { value: 2 as const, label: "2" },
                    { value: 3 as const, label: "3" },
                    { value: 4 as const, label: "4" },
                  ]).map((option) => {
                    const selected = attendanceCount === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setAttendanceCount(option.value)}
                        disabled={isSubmitting}
                        className={`h-12 rounded-xl border-2 text-sm font-bold transition-all active:scale-[0.98] ${selected ? "border-brand bg-brand text-white" : "border-ink-faint/30 bg-white text-ink hover:border-brand/40"}`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {notFound && (
                <div className="card p-5 text-center border-2 border-amber-200 animate-slide-in-right">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-amber-500">search_off</span>
                    <h3 className="text-ink font-bold">Number not found</h3>
                  </div>
                  <p className="text-ink-muted text-xs">If you have not registered before, please register.</p>
                  <button onClick={() => navigate("/")} className="mt-4 w-full h-12 rounded-[0.875rem] border-2 border-brand text-brand font-bold hover:bg-brand-50 transition-colors">Register</button>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-200">
                  <span className="material-symbols-outlined text-lg">error</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={() => void handleCheckIn()}
                disabled={!isValidPhone || !preferredLanguage || !attendanceCount || isSubmitting}
                className="btn-brand w-full h-14 flex items-center justify-center text-base"
              >
                {isSubmitting ? <span className="flex items-center gap-3"><span className="spinner" />Checking in...</span> : "Check In"}
              </button>
            </div>
          )}
        </div>

        <footer className="pt-4 text-ink-faint text-xs flex justify-center items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">groups</span> @expanprophetic
        </footer>
      </main>
    </div>
  );
};

export default AttendanceLogin;
