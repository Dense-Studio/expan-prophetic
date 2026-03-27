import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { FormData } from "../types";

interface StepSuccessProps {
  formData: FormData;
}

const StepSuccess: React.FC<StepSuccessProps> = ({ formData }) => {
  useEffect(() => {
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#7B1E34", "#A13350", "#E8B4BD", "#F5D0D6"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#7B1E34", "#A13350", "#E8B4BD", "#F5D0D6"],
      });

      if (Date.now() < end) requestAnimationFrame(frame);
    };

    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.6 },
      colors: ["#7B1E34", "#A13350", "#E8B4BD", "#F5D0D6"],
    });

    setTimeout(frame, 300);
  }, []);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6 text-center">
      <div className="max-w-sm w-full">
        {/* Animated checkmark */}
        <div className="animate-bounce-in mb-8" style={{ opacity: 0 }}>
          <div className="w-24 h-24 mx-auto rounded-3xl bg-brand flex items-center justify-center shadow-lg rotate-3">
            <svg
              className="w-12 h-12 text-white"
              viewBox="0 0 52 52"
              fill="none"
            >
              <circle
                cx="26"
                cy="26"
                r="25"
                stroke="currentColor"
                strokeWidth="2"
                className="check-circle"
              />
              <path
                d="M14 27l8 8 16-16"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="check-mark"
              />
            </svg>
          </div>
        </div>

        <div
          className="opacity-0 animate-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          <h1 className="font-serif text-[32px] text-ink mb-2">
            Welcome,{" "}
            <span className="text-brand italic">{formData.firstName}</span>!
          </h1>
          <p className="text-ink-muted text-base mb-6">
            You are now part of the EXPAN Prophetic family.
          </p>
        </div>

        {/* Event card */}
        <div
          className="card card-hover p-5 text-left mb-8 opacity-0 animate-fade-up"
          style={{ animationDelay: "0.5s" }}
        >
          <p className="text-[10px] font-bold text-brand uppercase tracking-[0.15em] mb-3">
            EXTREME PROPHETIC EXPAN ALL-NIGHT
          </p>
          <div className="flex items-center gap-3 mb-2.5 opacity-0 animate-stagger-3">
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-brand text-base"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                calendar_today
              </span>
            </div>
            <span className="text-ink font-semibold text-sm">
              Friday, 27th March 2026
            </span>
          </div>
          <div className="flex items-center gap-3 mb-2.5 opacity-0 animate-stagger-4">
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-brand text-base"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                schedule
              </span>
            </div>
            <span className="text-ink font-semibold text-sm">
              8:00 PM Prompt
            </span>
          </div>
          <div className="flex items-start gap-3 opacity-0 animate-stagger-5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
              <span
                className="material-symbols-outlined text-brand text-base"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                location_on
              </span>
            </div>
            <span className="text-ink-light text-sm leading-snug">
              @Thea Villa Events Hub, Tadisco Down - Takoradi
            </span>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full card card-hover py-3.5 text-ink font-bold active:scale-[0.98] transition-all group opacity-0 animate-fade-up"
          style={{ animationDelay: "0.7s" }}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-lg text-brand">
              person_add
            </span>
            Register Another Person
          </span>
        </button>
      </div>
    </div>
  );
};

export default StepSuccess;
