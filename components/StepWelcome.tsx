import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EVENT } from "../lib/event";
import { useEventAccess } from "../lib/useEventAccess";
import { FormData } from "../types";

interface WelcomeSlide {
  src: string;
  alt: string;
  contain?: boolean;
}

const PHOTO_SLIDES: WelcomeSlide[] = [
  { src: "/assets/image-1.jpg", alt: "EXPAN ministration" },
  { src: "/assets/image-2.jpg", alt: "EXPAN worship moment" },
  { src: "/assets/image-3.jpg", alt: "EXPAN ministration" },
  { src: "/assets/image-4.jpg", alt: "EXPAN worship moment" },
];

const TABLET_SLIDES: WelcomeSlide[] = [
  ...PHOTO_SLIDES.slice(0, 2),
  { src: EVENT.flyer, alt: `${EVENT.name} flyer`, contain: true },
  ...PHOTO_SLIDES.slice(2),
];

interface StepWelcomeProps {
  onContinue: () => void;
  onUpdate?: (data: Partial<FormData>) => void;
}

const StepWelcome: React.FC<StepWelcomeProps> = ({ onContinue }) => {
  const navigate = useNavigate();
  const isCheckInOpen = useEventAccess("check-in");
  const isRegistrationOpen = useEventAccess("registration");
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPhone, setIsPhone] = useState(() => window.innerWidth < 768);

  const slides = isPhone ? PHOTO_SLIDES : TABLET_SLIDES;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateViewport = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsPhone(event.matches);
      setActiveSlide(0);
    };

    updateViewport(mediaQuery);
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const eventDetails = (immersive = false) => (
    <div className={immersive
      ? "grid grid-cols-2 gap-2.5"
      : "card p-5"
    }>
      <div className={immersive
        ? "rounded-2xl border border-white/25 bg-black/35 backdrop-blur-xl p-3.5 flex items-center gap-3 shadow-lg"
        : "flex items-center gap-3.5 mb-4"
      }>
        <div className={immersive
          ? "w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0"
          : "w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0"
        }>
          <span className={`material-symbols-outlined ${immersive ? "text-white" : "text-brand"}`} style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
        </div>
        <div className="min-w-0">
          <p className={`font-bold text-xs sm:text-sm leading-tight ${immersive ? "text-white" : "text-ink"}`}>Friday, 14th August</p>
          <p className={`text-[10px] sm:text-xs mt-1 ${immersive ? "text-white/75" : "text-ink-muted"}`}>8:00 PM Prompt</p>
        </div>
      </div>

      {!immersive && <div className="h-px bg-ink-faint/30 mb-4" />}

      <div className={immersive
        ? "rounded-2xl border border-white/25 bg-black/35 backdrop-blur-xl p-3.5 flex items-center gap-3 shadow-lg"
        : "flex items-center gap-3.5"
      }>
        <div className={immersive
          ? "w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0"
          : "w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0"
        }>
          <span className={`material-symbols-outlined ${immersive ? "text-white" : "text-brand"}`} style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
        </div>
        <div className="min-w-0">
          <p className={`font-bold text-xs sm:text-sm leading-tight ${immersive ? "text-white" : "text-ink"}`}>{EVENT.venue}</p>
          <p className={`text-[10px] sm:text-xs mt-1 leading-tight ${immersive ? "text-white/75" : "text-ink-muted"}`}>{EVENT.address}</p>
        </div>
      </div>
    </div>
  );

  const actions = (immersive = false) => (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
      <button
        onClick={() => navigate("/check-in")}
        disabled={!isCheckInOpen}
        title={!isCheckInOpen ? `Opens ${EVENT.checkInOpensLabel}` : undefined}
        className="btn-brand h-12 sm:h-14 flex items-center justify-center gap-2 text-sm sm:text-base"
      >
        <span className="material-symbols-outlined text-lg sm:text-xl">how_to_reg</span>
        {isCheckInOpen ? "Check In" : "Check In · 7 PM"}
      </button>
      <button
        onClick={onContinue}
        disabled={!isRegistrationOpen}
        title={!isRegistrationOpen ? `Opens ${EVENT.registrationOpensLabel}` : undefined}
        className={`h-12 sm:h-14 flex items-center justify-center gap-2 rounded-[0.875rem] border-2 font-bold active:scale-[0.98] transition-all text-sm sm:text-base ${
          immersive
            ? "border-white/70 text-white bg-white/10 backdrop-blur-xl hover:bg-white/20"
            : "border-brand text-brand bg-white hover:bg-brand-50"
        } disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100`}
      >
        <span className="material-symbols-outlined text-lg sm:text-xl">person_add</span>
        {isRegistrationOpen ? "Register" : "Register · 7 PM"}
      </button>
    </div>
  );

  const slider = (
    <div className="absolute inset-0 overflow-hidden bg-[#24002f]">
      {slides.map((slide, index) => (
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
            slide.contain
              ? "object-contain"
              : "object-cover max-md:scale-[1.06] max-md:-translate-y-6"
          }`}
          style={{ opacity: index === activeSlide ? 1 : 0 }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-[#17001d] via-[#17001d]/55 to-black/5" />
    </div>
  );

  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* Phone + tablet: the selected immersive, single-screen slider. */}
      <div className="lg:hidden relative h-[100svh] min-h-[640px] overflow-hidden">
        {slider}

        <div className="absolute top-5 right-5 sm:top-7 sm:right-7 z-20 flex gap-1.5">
          {slides.map((slide, index) => (
            <button
              key={slide.src}
              onClick={() => setActiveSlide(index)}
              aria-label={`Show slide ${index + 1}`}
              className={`h-1.5 rounded-full transition-all duration-500 ${index === activeSlide ? "w-6 bg-white" : "w-1.5 bg-white/45"}`}
            />
          ))}
        </div>

        <div className="relative z-10 h-full flex flex-col justify-end px-5 pb-5 pt-16 sm:px-9 sm:pb-8">
          <div className="max-w-2xl w-full mx-auto opacity-0 animate-fade-up">
            <div className="pill bg-white/15 backdrop-blur-xl text-white border border-white/20 mb-3 sm:mb-5">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <span>All-Night Service</span>
            </div>
            <p className="text-[10px] sm:text-xs font-bold text-white/65 tracking-[0.18em] uppercase mb-2">
              Extreme Prophetic Encounter
            </p>
            <h1 className="font-serif text-[34px] sm:text-5xl text-white leading-[0.96] tracking-tight max-w-xl">
              Come expectant for a night of <span className="italic text-white/75">encounter.</span>
            </h1>

            <div className="mt-4 sm:mt-6">{eventDetails(true)}</div>
            <div className="mt-3 sm:mt-4">{actions(true)}</div>

            <div className="mt-3 flex items-center justify-between text-white/55">
              <button
                onClick={() => navigate("/login")}
                className="w-8 h-8 rounded-lg hover:text-white hover:bg-white/10 transition-all"
                title="Admin Login"
                aria-label="Admin Login"
              >
                <span className="material-symbols-outlined text-base">admin_panel_settings</span>
              </button>
              <p className="text-[10px] flex items-center gap-1"><span className="material-symbols-outlined text-sm">groups</span>@expanprophetic</p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: flyer and content remain side by side. */}
      <div className="hidden lg:grid min-h-screen grid-cols-[minmax(420px,1.05fr)_minmax(430px,0.95fr)]">
        <section className="bg-[#24002f] flex items-center justify-center min-h-screen">
          <img src={EVENT.flyer} alt={`${EVENT.name} flyer`} className="w-full h-screen object-contain" />
        </section>

        <section className="relative flex flex-col justify-center px-14 xl:px-20 min-h-screen">
          <div className="max-w-xl w-full mx-auto opacity-0 animate-fade-up">
            <div className="pill bg-brand-50 text-brand mb-5">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <span>All-Night Service</span>
            </div>
            <p className="text-xs font-bold text-brand tracking-[0.2em] uppercase mb-3">Extreme Prophetic Encounter</p>
            <h1 className="font-serif text-5xl xl:text-[56px] leading-[0.98] tracking-tight">
              Come expectant for a night of <span className="text-brand italic">encounter.</span>
            </h1>
            <p className="text-ink-muted text-sm mt-4 max-w-md">Returning guests can check in with their registered phone number. If you have not registered before, please register.</p>
            <div className="mt-7">{eventDetails()}</div>
            <div className="mt-7">{actions()}</div>
            <div className="mt-6 flex items-center justify-between">
              <button onClick={() => navigate("/login")} className="w-8 h-8 rounded-lg text-ink-faint hover:text-ink-muted hover:bg-ink/5 transition-all" title="Admin Login" aria-label="Admin Login">
                <span className="material-symbols-outlined text-base">admin_panel_settings</span>
              </button>
              <p className="text-[11px] text-ink-muted flex items-center gap-1"><span className="material-symbols-outlined text-sm">groups</span>@expanprophetic</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default StepWelcome;
