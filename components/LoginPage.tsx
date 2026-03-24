import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-church overflow-hidden">
      <div className="absolute top-[-20%] right-[-15%] w-[400px] h-[400px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md px-6 z-10 animate-fade-up">
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-white/50 hover:text-white/80 mb-8 transition-colors">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="glass-card rounded-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg mb-4">
              <span className="material-symbols-outlined text-3xl text-white">admin_panel_settings</span>
            </div>
            <h1 className="font-serif text-2xl text-white font-bold">Admin Login</h1>
            <p className="text-white/40 text-sm mt-1">Enter password to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              className="glass-input w-full px-4 py-3.5 rounded-xl text-white border border-white/10 outline-none focus:border-accent/50"
              autoFocus
              required
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full h-14 bg-primary text-white font-bold rounded-xl btn-glow disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Sign In"}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-white/20 mt-6">EXPAN Prophetic · Admin Access</p>
      </div>
    </div>
  );
};

export default LoginPage;
