import React from "react";
import { FormData } from "../types";

interface StepSuccessProps {
  formData: FormData;
}

const StepSuccess: React.FC<StepSuccessProps> = ({ formData }) => {
  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center px-6 text-center relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="max-w-sm w-full z-10">
        <div className="animate-fade-up">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl rotate-3">
            <span className="material-symbols-outlined text-4xl text-white">celebration</span>
          </div>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <h1 className="text-3xl font-extrabold text-white mb-3">
            Welcome, <span className="text-gradient">{formData.firstName}</span>!
          </h1>
          <p className="text-white/40 text-base leading-relaxed mb-4">
            You are now part of the EXPAN Prophetic family.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 mb-8 text-left animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <p className="text-xs font-bold text-accent/70 uppercase tracking-[0.15em] mb-3">
            EXTREME PROPHETIC EXPAN ALL-NIGHT
          </p>
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-accent" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
            <span className="text-white font-semibold flex-1 text-sm">Friday, 27th March 2026</span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-accent" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
            <span className="text-white font-semibold">8:00 PM Prompt</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-accent mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
            <span className="text-white/70 text-sm leading-tight flex-1">@Thea Villa Events Hub, Tadisco Down - Takoradi</span>
          </div>
        </div>

        <button onClick={() => window.location.reload()} className="w-full glass-card hover:bg-white/8 text-white font-bold py-4 rounded-xl active:scale-[0.98]">
          Register Another Person
        </button>
      </div>
    </div>
  );
};

export default StepSuccess;
