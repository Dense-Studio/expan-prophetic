import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { findByPhone, recordAttendance } from "../lib/attendance";
import { sendCheckInSms } from "../lib/sms";

const AttendanceLogin: React.FC = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [success, setSuccess] = useState<{
    name: string;
    photoUrl: string | null;
    alreadyCheckedIn: boolean;
  } | null>(null);

  const isSunday = new Date().getDay() === 0;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setPhone(rawValue);
    setNotFound(false);
  };

  const handleLogin = async () => {
    if (phone.length < 10 || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setNotFound(false);

    try {
      const registration = await findByPhone(phone);

      if (!registration) {
        setNotFound(true);
        return;
      }

      const result = await recordAttendance(registration.id, phone);

      if (!result.alreadyCheckedIn) {
        sendCheckInSms(phone, registration.first_name).catch(console.error);
      }

      setSuccess({
        name: `${registration.first_name} ${registration.last_name}`,
        photoUrl: registration.photo_url,
        alreadyCheckedIn: result.alreadyCheckedIn,
      });
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const mainContent = (
    <div className="flex-1 flex flex-col items-center justify-center px-6 lg:px-16 max-w-lg w-full mx-auto lg:mx-0">
      {/* Brand mark */}
      <div className="mb-6 animate-bounce-in" style={{ opacity: 0 }}>
        <div className="w-20 h-20 rounded-2xl bg-brand flex items-center justify-center shadow-md">
          <span className="material-symbols-outlined text-4xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
        </div>
      </div>

      <div className="text-center mb-8 opacity-0 animate-fade-up" style={{ animationDelay: "0.12s" }}>
        <p className="text-brand text-xs font-bold tracking-[0.2em] uppercase mb-2">Sunday Attendance</p>
        <h1 className="font-serif text-[32px] text-ink">
          Welcome <span className="text-brand italic">Back!</span>
        </h1>
      </div>

      {success ? (
        <div className="w-full animate-scale-in" style={{ opacity: 0 }}>
          <div className="card p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4 border-2 border-emerald-200">
              {success.photoUrl ? (
                <img src={success.photoUrl} alt="" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <svg className="w-10 h-10 text-emerald-500" viewBox="0 0 52 52" fill="none">
                  <circle cx="26" cy="26" r="25" stroke="currentColor" strokeWidth="2" className="check-circle" />
                  <path d="M14 27l8 8 16-16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="check-mark" />
                </svg>
              )}
            </div>
            <h2 className="text-ink text-xl font-bold mb-1">{success.name}</h2>
            <p className={success.alreadyCheckedIn ? "text-amber-600 text-sm font-medium" : "text-emerald-600 text-sm font-medium"}>
              {success.alreadyCheckedIn ? "Already checked in today" : "Attendance recorded!"}
            </p>
            <button
              onClick={() => { setSuccess(null); setPhone(""); }}
              className="mt-6 w-full h-12 card text-ink font-semibold hover:bg-cream-dark transition-colors active:scale-[0.98]"
            >
              Back
            </button>
          </div>
        </div>
      ) : !isSunday ? (
        <div className="w-full opacity-0 animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <div className="card p-6 text-center">
            <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-2xl text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
            </div>
            <h2 className="text-ink font-bold text-lg mb-2">See you on Sunday!</h2>
            <p className="text-ink-muted text-sm">Attendance login is only available on <span className="text-brand font-semibold">Sundays</span>.</p>
            <button onClick={() => navigate("/")} className="mt-6 btn-brand w-full h-12 text-sm">New here? Register</button>
          </div>
        </div>
      ) : (
        <div className="w-full space-y-5 opacity-0 animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <label className="flex flex-col text-left">
            <span className="text-ink-light text-xs font-bold uppercase tracking-[0.12em] mb-2">Phone Number</span>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <span className={`material-symbols-outlined text-xl transition-colors ${isSubmitting ? "text-brand animate-pulse" : "text-ink-faint group-focus-within:text-brand"}`}>call</span>
              </div>
              <input
                autoFocus
                className="clean-input w-full h-14 pl-12 pr-4 text-ink placeholder:text-ink-faint"
                placeholder="024 123 4567"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
              />
            </div>
          </label>

          {notFound && (
            <div className="card p-5 text-center border-2 border-amber-200 animate-slide-in-right">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="material-symbols-outlined text-amber-500">search_off</span>
                <h3 className="text-ink font-bold">Number not found</h3>
              </div>
              <button onClick={() => navigate("/")} className="mt-3 btn-brand w-full h-12 text-sm">Register Now</button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm animate-slide-in-right bg-red-50 px-4 py-3 rounded-xl border border-red-200">
              <span className="material-symbols-outlined text-lg">error</span>
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={phone.length < 10 || isSubmitting}
            className="btn-brand w-full h-14 flex items-center justify-center text-base"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-3">
                <span className="spinner"></span>
                Checking in...
              </span>
            ) : (
              "Check In"
            )}
          </button>
        </div>
      )}

      <footer className="mt-auto pt-8 pb-6 text-ink-faint text-xs flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm">groups</span> @expanprophetic
      </footer>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Desktop side panel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden">
        <img src="/assets/image-1.jpg" alt="Ministration" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/70 to-brand/40"></div>
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <p className="text-white/60 text-xs font-bold tracking-[0.2em] uppercase mb-3">Extreme Prophetic Encounter</p>
          <h2 className="font-serif text-white text-5xl xl:text-6xl leading-[0.95]">
            EXPAN<br /><span className="italic opacity-80">Prophetic</span>
          </h2>
          <p className="text-white/50 text-sm mt-4">Welcome back to the family.</p>
        </div>
      </div>

      {/* Content area */}
      {mainContent}
    </div>
  );
};

export default AttendanceLogin;
