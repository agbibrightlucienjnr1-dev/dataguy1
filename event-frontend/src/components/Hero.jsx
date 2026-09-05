import React, { useState, useEffect } from "react";

export const Hero = ({ onOpenRegister, eventPrice = 20, eventDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 45,
    seconds: 30,
  });

  useEffect(() => {
    const targetDate = eventDate
      ? new Date(eventDate)
      : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const updateTimer = () => {
      const difference = +targetDate - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [eventDate]);

  return (
    <section className="flex flex-col items-center text-center pt-24 md:pt-36 max-w-4xl mx-auto gap-8 px-4 sm:px-6">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-inner">
        <span
          className="material-symbols-outlined text-[16px] text-[#ffb783]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          star
        </span>
        <span className="text-sm font-medium text-[#e5e1e5]">
          1-Day Intensive Online Masterclass
        </span>
      </div>

      {/* Main Headline */}
      <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-[#e5e1e5] tracking-tight leading-[1.15]">
        Master Cinema-Grade <br className="hidden md:block" />
        Long &amp; Short-Form Video with AI
      </h1>

      {/* Description */}
      <p className="text-base sm:text-lg text-[#94A3B8] max-w-2xl leading-relaxed">
        Transform your ideas into professional, high-retention videos without
        cameras, actors, or expensive equipment. Join the definitive guide to
        modern AI video generation.
      </p>

      {/* Countdown Timer */}
      <div className="flex gap-3 sm:gap-4 md:gap-6 mt-2">
        {[
          { label: "Days", val: timeLeft.days },
          { label: "Hours", val: timeLeft.hours },
          { label: "Mins", val: timeLeft.minutes },
          { label: "Secs", val: timeLeft.seconds },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-[#0B0B0F] border border-white/10 rounded-lg p-3 sm:p-4 w-18 sm:w-20 md:w-24 flex flex-col items-center justify-center shadow-lg"
          >
            <span className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#e5e1e5] font-mono">
              {String(item.val).padStart(2, "0")}
            </span>
            <span className="text-[11px] sm:text-xs text-[#94A3B8] mt-1 uppercase font-semibold tracking-wider">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Primary CTA & Trust Badges */}
      <div className="flex flex-col items-center gap-4 mt-4 w-full max-w-md">
        <button
          onClick={onOpenRegister}
          className="w-full bg-[#494bd6] hover:bg-[#494bd6]/90 text-white py-4 px-6 rounded-xl font-semibold text-base transition-all shadow-[0_0_30px_rgba(73,75,214,0.25)] hover:shadow-[0_0_40px_rgba(73,75,214,0.45)] flex items-center justify-center gap-2 group active:scale-[0.98]"
        >
          <span>Register &amp; Join Class — GH₵ {eventPrice.toFixed(2)}</span>
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-[20px]">
            arrow_forward
          </span>
        </button>

        <div className="flex items-center gap-4 text-xs text-[#94A3B8] opacity-80">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">lock</span>
            Secured by Paystack
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">
              verified_user
            </span>
            VIP WhatsApp Access
          </span>
        </div>
      </div>
    </section>
  );
};
