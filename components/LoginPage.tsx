import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    setTimeout(() => {
      if (password === "Juanita@93") {
        sessionStorage.setItem("expan_admin_auth", "true");
        sessionStorage.setItem("expan_admin_role", "superadmin");
        navigate("/admin");
      } else {
        setError("Incorrect password.");
        setShakeError(true);
        setTimeout(() => setShakeError(false), 600);
        setLoading(false);
      }
    }, 600);
  };

  const loginCard = (
    <div className={`card p-8 ${shakeError ? "animate-shake" : ""}`}>
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center shadow-md mb-4 animate-bounce-in" style={{ opacity: 0 }}>
          <span className="material-symbols-outlined text-3xl text-white">admin_panel_settings</span>
        </div>
        <h1 className="font-serif text-2xl text-ink">Admin Login</h1>
        <p className="text-ink-muted text-sm mt-1">Enter password to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <span className="material-symbols-outlined text-lg text-ink-faint group-focus-within:text-brand transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="clean-input w-full pl-12 pr-4 py-3.5 text-ink"
            autoFocus
            required
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm animate-slide-in-right bg-red-50 px-4 py-2.5 rounded-lg border border-red-200">
            <span className="material-symbols-outlined text-lg">error</span>
            <span>{error}</span>
          </div>
        )}
        <button
          type="submit"
          disabled={loading || !password}
          className="btn-brand w-full h-14 flex items-center justify-center text-base"
        >
          {loading ? (
            <span className="flex items-center gap-3">
              <span className="spinner"></span>
              Verifying...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>
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
          <p className="text-white/50 text-sm mt-4">Admin access portal.</p>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 lg:px-16">
        <div className="w-full max-w-md">
          <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-ink-muted hover:text-ink mb-8 transition-colors group">
            <span className="material-symbols-outlined text-lg transition-transform group-hover:-translate-x-0.5">arrow_back</span>
            <span className="text-sm font-medium">Back</span>
          </button>

          {loginCard}

          <p className="text-center text-xs text-ink-faint mt-6">EXPAN Prophetic · Admin Access</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
