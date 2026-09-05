import React from "react";

export const PricingCard = ({ onOpenRegister, eventPrice = 20 }) => {
  const perks = [
    "Full Access to Live Hands-On Masterclass",
    "Complete Masterclass Video Recording Replay",
    "High-Converting Viral AI Prompt Sheets & Templates",
    "Curated Free & Budget-Friendly AI Tools Directory",
    "Exclusive Access to Private WhatsApp VIP Student Group",
    "Live Interactive Q&A Session With Instructor",
  ];

  return (
    <section className="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6 w-full" id="pricing">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#ffdcc5] mb-3">
          <span className="material-symbols-outlined text-[16px]">verified</span>
          <span>Limited Early Bird Access</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#e5e1e5] tracking-tight">
          Simple, Transparent Enrollment
        </h2>
        <p className="text-sm text-[#94A3B8] mt-2">
          Affordable access designed to make high-income AI video creation skills accessible to everyone.
        </p>
      </div>

      <div className="bg-[#121218] border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#494bd6] to-transparent"></div>

        <div className="text-center pb-8 border-b border-white/10">
          <div className="flex items-baseline justify-center gap-1.5 mb-1">
            <span className="text-sm font-semibold text-[#94A3B8]">GH₵</span>
            <span className="text-5xl sm:text-6xl font-bold text-[#e5e1e5] tracking-tight">
              {eventPrice.toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-[#64748B] line-through">
            Standard Price: GH₵ 150.00
          </div>
          <div className="text-xs text-[#10B981] font-medium mt-1">
            Save over 93% with early bird registration
          </div>
        </div>

        <div className="py-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {perks.map((perk, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[#10B981] text-[20px] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              <span className="text-xs sm:text-sm text-[#e5e1e5]">
                {perk}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2 flex flex-col items-center gap-3">
          <button
            onClick={onOpenRegister}
            className="w-full sm:max-w-md bg-[#494bd6] hover:bg-[#494bd6]/90 text-white py-4 px-6 rounded-xl font-semibold text-base transition-all shadow-[0_0_30px_rgba(73,75,214,0.3)] hover:shadow-[0_0_40px_rgba(73,75,214,0.5)] flex items-center justify-center gap-2 group active:scale-[0.98]"
          >
            <span>Register &amp; Join WhatsApp Group</span>
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-[20px]">
              arrow_forward
            </span>
          </button>
          <div className="text-xs text-[#94A3B8] opacity-80 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">lock</span>
            Secured by Paystack • Instant WhatsApp Group invite link
          </div>
        </div>
      </div>
    </section>
  );
};
