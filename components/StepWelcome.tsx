import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FormData } from "../types";

const HERO_IMAGES = [
  "/assets/image-1.jpg",
  "/assets/image-2.jpg",
  "/assets/image-3.jpg",
  "/assets/image-4.jpg",
];

interface StepWelcomeProps {
  onContinue: () => void;
  onUpdate?: (data: Partial<FormData>) => void;
}

const StepWelcome: React.FC<StepWelcomeProps> = ({ onContinue }) => {
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  /* ── Shared content blocks ── */
  const eventCard = (
    <div className="card p-5">
      <div className="flex items-center gap-3.5 mb-4 opacity-0 animate-stagger-1">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-brand" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
        </div>
        <div>
          <p className="text-ink font-bold text-sm">Friday, 27th March 2026</p>
          <p className="text-ink-muted text-xs">8:00 PM — All Night</p>
        </div>
      </div>
      <div className="h-px bg-ink-faint/30 mb-4"></div>
      <div className="flex items-center gap-3.5 opacity-0 animate-stagger-2">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-brand" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
        </div>
        <div>
          <p className="text-ink font-bold text-sm">Thea Villa Events Hub</p>
          <p className="text-ink-muted text-xs">Tadisco Down — Takoradi</p>
        </div>
      </div>
    </div>
  );

  const ctaFooter = (
    <div>
      <button
        onClick={onContinue}
        className="btn-brand w-full h-14 flex items-center justify-center gap-2 text-base"
      >
        <span className="material-symbols-outlined text-xl">person_add</span>
        Register Now
      </button>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/login")}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-ink-faint hover:text-ink-muted hover:bg-ink/5 transition-all duration-200"
          title="Admin Login"
        >
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
        </button>
        <p className="text-[11px] text-ink-muted flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">groups</span>
          @expanprophetic
        </p>
        <div className="w-8"></div>
      </div>

      <div className="mt-5 flex justify-center gap-1.5">
        <div className="h-1 w-6 rounded-full progress-active"></div>
        <div className="h-1 w-1.5 rounded-full bg-ink-faint/30"></div>
        <div className="h-1 w-1.5 rounded-full bg-ink-faint/30"></div>
        <div className="h-1 w-1.5 rounded-full bg-ink-faint/30"></div>
      </div>
    </div>
  );

  /* ── Desktop layout ── */
  const desktopLayout = (
    <div className="hidden lg:flex min-h-screen">
      {/* Left: hero panel with crossfade */}
      <div className="relative w-[55%] xl:w-[60%] overflow-hidden">
        {HERO_IMAGES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`Ministration ${i + 1}`}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
            style={{ opacity: i === activeImage ? 1 : 0 }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/30"></div>

        {/* Brand overlay at bottom-left */}
        <div className="absolute bottom-12 left-12 z-10">
          <div className="pill bg-white/15 backdrop-blur-md text-white border border-white/20 mb-6">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <span>All-Night Service</span>
          </div>
          <p className="text-white/50 text-xs font-bold tracking-[0.2em] uppercase mb-3">Extreme Prophetic Encounter</p>
          <h1 className="font-serif text-white text-6xl xl:text-7xl leading-[0.93] tracking-tight">
            EXPAN
          </h1>
          <h2 className="font-serif italic text-white/70 text-6xl xl:text-7xl leading-[0.93] tracking-tight">
            Prophetic
          </h2>
          <p className="text-white/40 text-sm mt-4 max-w-xs">An encounter that will change your life. Come experience the supernatural.</p>
        </div>

        {/* Dot indicators for desktop crossfade */}
        <div className="absolute bottom-12 right-12 flex flex-col gap-2 z-10">
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveImage(i)}
              className={`w-1.5 rounded-full transition-all duration-500 ${i === activeImage ? "h-5 bg-white" : "h-1.5 bg-white/40"}`}
            />
          ))}
        </div>
      </div>

      {/* Right: content */}
      <div className="flex-1 bg-cream flex flex-col justify-between px-16 py-12">
        <div>
          <div className="opacity-0 animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <p className="text-xs font-bold text-brand tracking-[0.2em] uppercase mb-3">
              Extreme Prophetic Encounter
            </p>
            <h1 className="font-serif text-[42px] text-ink leading-[0.95] tracking-tight mb-1">
              Join us for<br />a night of<br /><span className="text-brand italic">supernatural</span><br />encounter.
            </h1>
          </div>

          <div className="mt-8 opacity-0 animate-fade-up" style={{ animationDelay: "0.25s" }}>
            {eventCard}
          </div>

          <p className="text-ink-muted text-xs mt-6 opacity-0 animate-fade-up" style={{ animationDelay: "0.35s" }}>
            ✨ Experience the supernatural
          </p>
        </div>

        <div className="opacity-0 animate-slide-up" style={{ animationDelay: "0.4s" }}>
          {ctaFooter}
        </div>
      </div>
    </div>
  );

  /* ── Mobile layout (unchanged) ── */
  const mobileLayout = (
    <div className="lg:hidden min-h-screen bg-cream flex flex-col relative">
      {/* Subtle pattern overlay for lower content area */}
      <div className="absolute inset-0 top-[42vh] pointer-events-none z-0" style={{ backgroundImage: "url('/cream-bg-pattern.png')", backgroundSize: "300px 300px", backgroundRepeat: "repeat", opacity: 0.4 }}></div>
      {/* Hero Image Section */}
      <div className="relative w-full" style={{ height: "42vh", minHeight: "280px" }}>
        <div className="relative w-full h-full overflow-hidden hero-photo">
          {HERO_IMAGES.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={`Ministration ${i + 1}`}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
              style={{ opacity: i === activeImage ? 1 : 0 }}
            />
          ))}
          <div className="absolute bottom-6 inset-x-0 flex justify-center gap-1.5 z-10">
            {HERO_IMAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${i === activeImage ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-cream to-transparent"></div>
        <div className="absolute top-5 left-5 opacity-0 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="pill bg-white/90 text-ink shadow-sm backdrop-blur-sm">
            <span className="material-symbols-outlined text-sm text-brand" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <span className="text-ink-light">All-Night Service</span>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col px-6 max-w-lg w-full mx-auto -mt-4 relative z-10">
        <div className="opacity-0 animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <p className="text-xs font-bold text-brand tracking-[0.2em] uppercase mb-2">
            Extreme Prophetic Encounter
          </p>
          <h1 className="font-serif text-[42px] text-ink leading-[0.95] tracking-tight mb-1">
            EXPAN
          </h1>
          <h2 className="font-serif italic text-[42px] text-brand leading-[0.95] tracking-tight">
            Prophetic
          </h2>
        </div>

        <div className="mt-6 opacity-0 animate-fade-up" style={{ animationDelay: "0.25s" }}>
          {eventCard}
        </div>

        <p className="text-ink-muted text-xs text-center mt-6 opacity-0 animate-fade-up" style={{ animationDelay: "0.35s" }}>
          ✨ Experience the supernatural
        </p>
      </main>

      <footer className="w-full max-w-lg mx-auto px-6 pb-8 pt-4 opacity-0 animate-slide-up" style={{ animationDelay: "0.4s" }}>
        {ctaFooter}
      </footer>
    </div>
  );

  return (
    <>
      {desktopLayout}
      {mobileLayout}
    </>
  );
};

export default StepWelcome;
