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

  return (
    <div className="relative min-h-screen flex flex-col items-center overflow-hidden bg-gradient-church">
      <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg w-full z-10">
        <div className="mb-6 animate-fade-up">
          <div className="w-24 h-24 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center shadow-lg ring-2 ring-white/10">
            <span className="material-symbols-outlined text-5xl text-primary">auto_awesome</span>
          </div>
        </div>

        <div className="text-center mb-8 animate-fade-up">
          <p className="text-accent text-xs font-bold tracking-[0.2em] uppercase mb-2">Sunday Attendance</p>
          <h1 className="text-white text-[28px] md:text-[36px] font-extrabold tracking-tight">
            Welcome <span className="text-gradient">Back!</span>
          </h1>
        </div>

        {success ? (
          <div className="w-full animate-fade-up">
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                {success.photoUrl ? (
                  <img src={success.photoUrl} alt="" className="w-20 h-20 rounded-full object-cover ring-4 ring-emerald-500/30" />
                ) : (
                  <span className="material-symbols-outlined text-4xl text-emerald-400">check_circle</span>
                )}
              </div>
              <h2 className="text-white text-xl font-bold mb-1">{success.name}</h2>
              <p className={success.alreadyCheckedIn ? "text-amber-400 text-sm" : "text-emerald-400 text-sm"}>
                {success.alreadyCheckedIn ? "Already checked in today" : "Attendance recorded!"}
              </p>
              <button onClick={() => { setSuccess(null); setPhone(""); }} className="mt-6 w-full h-12 bg-white/5 rounded-xl text-white/70 font-semibold">Back</button>
            </div>
          </div>
        ) : !isSunday ? (
          <div className="w-full animate-fade-up">
            <div className="glass-card rounded-2xl p-6 text-center">
              <span className="material-symbols-outlined text-4xl text-amber-400 mb-4">event</span>
              <h2 className="text-white font-bold text-lg mb-2">See you on Sunday!</h2>
              <p className="text-white/50 text-sm">Attendance login is only available on <span className="text-accent">Sundays</span>.</p>
              <button onClick={() => navigate("/")} className="mt-6 w-full h-12 bg-white/5 rounded-xl text-white/60 font-semibold">New here? Register</button>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-5 animate-fade-up">
            <label className="flex flex-col w-full text-left">
              <span className="text-white/50 text-xs font-bold uppercase tracking-[0.15em] mb-2">Phone Number</span>
              <input
                autoFocus
                className="w-full rounded-xl border border-white/8 glass-input h-14 px-4 text-white outline-none focus:border-accent/50"
                placeholder="024 123 4567"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
              />
            </label>

            {notFound && (
              <div className="glass-card rounded-2xl p-5 text-center border border-amber-500/20">
                <h3 className="text-white font-bold mb-1">Number not found</h3>
                <button onClick={() => navigate("/")} className="mt-3 w-full h-12 bg-primary rounded-xl text-white font-bold btn-glow">Register Now</button>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={phone.length < 10 || isSubmitting}
              className="w-full h-14 bg-primary text-white font-bold rounded-xl btn-glow disabled:opacity-30"
            >
              {isSubmitting ? "Checking in..." : "Check In"}
            </button>
          </div>
        )}
      </main>
      <footer className="pb-8 z-10 text-white/20 text-xs flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm">groups</span> @expanprophetic
      </footer>
    </div>
  );
};

export default AttendanceLogin;
