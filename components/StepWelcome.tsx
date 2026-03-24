import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FormData } from "../types";

interface StepWelcomeProps {
  onContinue: () => void;
  onUpdate?: (data: Partial<FormData>) => void;
}

const StepWelcome: React.FC<StepWelcomeProps> = ({ onContinue }) => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex flex-col items-center overflow-hidden bg-bg-deep">
      {/* Background Image — single on mobile, 2x2 grid on md+ */}
      <div className="absolute inset-0 z-0 opacity-50">
        {/* Mobile: single image */}
        <img src="/assets/image-1.jpg" alt="Ministration" className="md:hidden w-full h-full object-cover" />
        {/* Desktop: 2x2 grid */}
        <div className="hidden md:grid grid-cols-2 grid-rows-2 w-full h-full">
          <img src="/assets/image-1.jpg" alt="Ministration 1" className="w-full h-full object-cover border-[0.5px] border-white/5" />
          <img src="/assets/image-2.jpg" alt="Ministration 2" className="w-full h-full object-cover border-[0.5px] border-white/5" />
          <img src="/assets/image-3.jpg" alt="Ministration 3" className="w-full h-full object-cover border-[0.5px] border-white/5" />
          <img src="/assets/image-4.jpg" alt="Ministration 4" className="w-full h-full object-cover border-[0.5px] border-white/5" />
        </div>
        
        {/* Blending Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-bg-deep/60 via-bg-deep/20 to-bg-deep/80"></div>
        <div className="absolute inset-0 bg-bg-deep/30 backdrop-blur-[1px]"></div>
      </div>

      {/* Animated background orbs */}
      <div className="absolute top-[-20%] right-[-15%] w-[400px] h-[400px] bg-primary/20 rounded-full blur-[120px] animate-pulse-soft pointer-events-none z-1"></div>
      
      <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg w-full text-center z-10">
        <div className="mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="w-32 h-32 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center shadow-2xl shadow-primary/20 ring-2 ring-white/20">
            <span className="material-symbols-outlined text-6xl text-primary">auto_awesome</span>
          </div>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <span className="text-xs font-bold text-accent/70 tracking-[0.2em] uppercase mb-4 block">
            Extreme Prophetic Encounter
          </span>
          <h1 className="font-serif text-5xl md:text-6xl text-white leading-[0.95] mb-4 tracking-tighter">
            EXPAN
            <br />
            <span className="text-gradient italic">Prophetic</span>
          </h1>
        </div>

        <div className="w-full mt-6 animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <div className="glass-card rounded-3xl p-6 border border-white/10">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                <span className="material-symbols-outlined text-accent" style={{ fontVariationSettings: "'FILL' 1" }}>event_available</span>
              </div>
              <div className="text-left">
                <p className="text-white font-bold text-lg">All-Night</p>
                <p className="text-white/50 text-xs">Join thousands for a divine shifting</p>
              </div>
            </div>

            <div className="h-px bg-white/5 mb-5"></div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg text-accent/70" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">8:00 PM</p>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider">Prompt</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg text-accent/70" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Thea Villa</p>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider">Takoradi</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-white/40 text-sm mt-8 animate-fade-up" style={{ animationDelay: "0.4s" }}>
          ✨ Experience the supernatural
        </p>
      </main>

      <footer className="w-full max-w-lg px-6 pb-10 z-10 animate-slide-up" style={{ animationDelay: "0.5s" }}>
        <div className="flex flex-col gap-3">
          <button
            onClick={onContinue}
            className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-primary text-white text-base font-bold transition-all duration-300 btn-glow active:scale-[0.97]"
          >
            <span className="material-symbols-outlined mr-2 text-xl">person_add</span>
            <span className="relative z-10 flex items-center gap-2">Register Now</span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary-light/0 via-white/10 to-primary-light/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/login")}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-white/15 hover:text-white/40 hover:bg-white/5 transition-all duration-300"
            title="Admin Login"
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
          </button>
          <p className="text-xs text-white/30 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">groups</span>
            @expanprophetic
          </p>
          <div className="w-8"></div>
        </div>

        <div className="mt-6 flex justify-center gap-1.5">
          <div className="h-1 w-6 rounded-full bg-accent"></div>
          <div className="h-1 w-1.5 rounded-full bg-white/10"></div>
          <div className="h-1 w-1.5 rounded-full bg-white/10"></div>
          <div className="h-1 w-1.5 rounded-full bg-white/10"></div>
        </div>
      </footer>
    </div>
  );
};

export default StepWelcome;
