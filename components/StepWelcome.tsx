
import React from 'react';

interface StepWelcomeProps {
  onContinue: () => void;
}

const StepWelcome: React.FC<StepWelcomeProps> = ({ onContinue }) => {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>

      <header class="w-full pt-12 flex justify-center z-10">
        <div class="flex flex-col items-center gap-2">
          <span class="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1", color: '#e11d48' }}>bolt</span>
          <div class="w-px h-8 bg-rose-500/20"></div>
        </div>
      </header>

      <main class="flex-1 flex flex-col items-center justify-center px-6 max-w-2xl w-full text-center z-10">
        <h1 class="font-serif text-5xl md:text-7xl text-white leading-[1.1] mb-8 tracking-tight">
          Welcome to <br/>
          <span class="italic font-normal">EXPAN</span>
        </h1>

        <div class="relative w-full aspect-[16/9] mb-10 overflow-hidden rounded-xl shadow-2xl shadow-primary/10">
          <div 
            class="absolute inset-0 bg-center bg-no-repeat bg-cover transform scale-105" 
            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBYIqF62Ly0daqgKAJ82aFiDCY6wWKtDM1TplwThmt4frnIkML3p9kv71ggWn4VHjZLHTaChx4PZ9OrgTUYeSXAdr6BUiOWqPOa2dar1Hx2Rjk5pERad3DBQ9m6bQUOvoNcSerF7VPKaFxVBc1uVvQMmbqmARPq-MioUODHcoL826ZfFjg9_4iY5vP0chYYf_Up8tP_irW5SsT_GT-SZFZL_rZXrIpgggHYYEiiQN-hE3E8gAAjZm3IJNv-2-lKRECIOKiaM6KbtnQ")' }}
          ></div>
          <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        <p class="text-slate-400 text-lg md:text-xl font-normal leading-relaxed max-w-lg mb-12">Extreme Prophetic</p>
      </main>

      <footer class="w-full max-w-md px-6 pb-16 z-10">
        <div class="flex flex-col gap-6">
          <button 
            onClick={onContinue}
            class="group relative flex h-16 w-full items-center justify-center overflow-hidden rounded-xl bg-primary text-white text-lg font-bold transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
          >
            <span class="relative z-10 flex items-center gap-2">
              Continue
              <span class="material-symbols-outlined text-xl transition-transform group-hover:translate-x-1">arrow_forward</span>
            </span>
            <div class="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
          
          <p class="text-center text-sm text-slate-500">
            Already have an account? 
            <button class="ml-1 text-white font-semibold hover:text-primary transition-colors underline underline-offset-4 decoration-primary/30">Log in</button>
          </p>
        </div>

        <div class="mt-12 flex justify-center gap-2">
          <div class="h-1.5 w-8 rounded-full bg-primary"></div>
          <div class="h-1.5 w-1.5 rounded-full bg-primary/20"></div>
          <div class="h-1.5 w-1.5 rounded-full bg-primary/20"></div>
        </div>
      </footer>
    </div>
  );
};

export default StepWelcome;
