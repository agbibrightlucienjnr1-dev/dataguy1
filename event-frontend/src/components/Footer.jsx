import React from "react";

export const Footer = () => {
  return (
    <footer className="w-full py-12 border-t border-white/10 bg-[#050507] mt-12">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-12 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-[#94A3B8]">
        <div className="text-base font-semibold text-[#e5e1e5]">
          AI Video Mastery
        </div>
        <div className="flex gap-6 text-xs sm:text-sm">
          <a className="hover:text-[#e5e1e5] transition-colors" href="#curriculum">
            Curriculum
          </a>
          <a className="hover:text-[#e5e1e5] transition-colors" href="#pricing">
            Pricing
          </a>
          <a className="hover:text-[#e5e1e5] transition-colors" href="#faq">
            FAQ
          </a>
        </div>
        <div className="text-xs text-[#64748B]">
          © {new Date().getFullYear()} AI Video Mastery. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
