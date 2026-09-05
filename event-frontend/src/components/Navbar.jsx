import React from "react";

export const Navbar = ({ onOpenRegister, eventPrice = 20 }) => {
  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-[1440px] rounded-full border border-white/10 shadow-2xl bg-[#121218]/80 backdrop-blur-xl flex justify-between items-center px-6 py-3 z-50 transition-all">
      <div className="text-xl sm:text-2xl font-bold text-[#e5e1e5] tracking-tight">
        AI Video Mastery
      </div>

      <nav className="hidden md:flex gap-6 items-center text-sm font-medium">
        <a
          className="text-[#c0c1ff] font-semibold active:scale-95 transition-transform"
          href="#curriculum"
        >
          Curriculum
        </a>
        <a
          className="text-[#c7c4d7] hover:text-[#c0c1ff] transition-colors duration-300 active:scale-95"
          href="#pricing"
        >
          Pricing
        </a>
        <a
          className="text-[#c7c4d7] hover:text-[#c0c1ff] transition-colors duration-300 active:scale-95"
          href="#faq"
        >
          FAQ
        </a>
      </nav>

      <div className="flex items-center gap-4">
        <span className="hidden lg:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#94A3B8]">
          <span className="w-2 h-2 rounded-full bg-[#ffb4ab] animate-pulse"></span>
          Live Interactive Session
        </span>
        <button
          onClick={onOpenRegister}
          className="bg-[#494bd6] hover:bg-[#494bd6]/90 text-white px-5 sm:px-6 py-2 rounded-full text-sm font-semibold transition-all shadow-[0_0_20px_rgba(73,75,214,0.3)] hover:shadow-[0_0_30px_rgba(73,75,214,0.5)] active:scale-95"
        >
          Enroll Now
        </button>
      </div>
    </header>
  );
};
