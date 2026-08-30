import React, { useState } from "react";

export const FAQ = () => {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: "Where and how will the masterclass take place?",
      a: "The class will be held live online. Once your GH₵ 20.00 registration is verified, you will immediately be given access to join our private WhatsApp student group where session links, class reminders, and templates are distributed.",
    },
    {
      q: "What if I miss the live class time?",
      a: "All registered attendees will receive the complete masterclass recording replay and prompt swipe files directly in the WhatsApp group.",
    },
    {
      q: "Do I need a high-end PC or camera equipment?",
      a: "No! All AI platforms demonstrated (ChatGPT, ElevenLabs, Runway, Kling, CapCut) run seamlessly in standard web browsers or on smartphones.",
    },
    {
      q: "Why is the registration only GH₵ 20.00?",
      a: "We believe high-leverage AI video skills should be accessible to students, aspiring content creators, and entrepreneurs without large upfront financial barriers.",
    },
    {
      q: "Which payment methods are accepted?",
      a: "Payments are processed securely via Paystack with instant support for Mobile Money (MTN, Telecel, AT) and all major debit/credit cards.",
    },
  ];

  return (
    <section className="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6 w-full" id="faq">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#c0c1ff] mb-3">
          <span className="material-symbols-outlined text-[16px]">help</span>
          <span>Common Questions</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#e5e1e5] tracking-tight">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, i) => {
          const isOpen = openIdx === i;
          return (
            <div
              key={i}
              className="bg-[#0B0B0F] border border-white/10 rounded-xl overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? -1 : i)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4"
              >
                <span className="text-sm sm:text-base font-semibold text-[#e5e1e5]">
                  {faq.q}
                </span>
                <span
                  className={`material-symbols-outlined text-[#94A3B8] text-[20px] transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-[#c0c1ff]" : ""
                  }`}
                >
                  expand_more
                </span>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-[#94A3B8] leading-relaxed border-t border-white/5 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
