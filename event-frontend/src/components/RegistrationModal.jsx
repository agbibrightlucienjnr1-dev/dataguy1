import React, { useState } from "react";
import { registerForEvent } from "../services/api";
import toast from "react-hot-toast";

export const RegistrationModal = ({
  isOpen,
  onClose,
  eventPrice = 20,
  eventTitle = "AI Video Creation Masterclass",
  eventSlug = "ai-video-masterclass",
}) => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (!phone.trim() || phone.trim().length < 9) {
      toast.error("Please enter a valid phone/WhatsApp number");
      return;
    }

    setLoading(true);

    try {
      const callbackUrl = `${window.location.origin}/?payment=callback`;

      const result = await registerForEvent({
        slug: eventSlug,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        callbackUrl,
      });

      if (result.authorizationUrl) {
        toast.success("Connecting to Paystack gateway...");
        window.location.href = result.authorizationUrl;
      } else {
        toast.error("Failed to retrieve checkout URL. Please try again.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Registration error:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Could not initiate registration. Please try again.";
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050507]/80 backdrop-blur-md animate-in fade-in duration-200">
      <main className="w-full max-w-[480px] relative z-10">
        {/* Ambient Glow */}
        <div className="absolute -inset-10 bg-[#494bd6]/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Modal Card */}
        <div
          className="relative bg-[#121218]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Line */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent"></div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors z-20"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          {/* Header Section */}
          <header className="pt-8 pb-5 px-8 text-center border-b border-white/10 bg-[#0B0B0F]/50">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 mb-4 text-[#c0c1ff]">
              <span
                className="material-symbols-outlined text-[24px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                movie_creation
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#e5e1e5] mb-1 tracking-tight">
              Secure Checkout
            </h2>
            <p className="text-xs sm:text-sm text-[#94A3B8]">
              Complete registration for the AI Video Creation Masterclass.
            </p>
          </header>

          {/* Form Section */}
          <div className="p-6 sm:p-8 space-y-5 flex-1">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label
                  className="block text-xs font-semibold text-[#c7c4d7] uppercase tracking-widest"
                  htmlFor="fullName"
                >
                  Full Name <span className="text-[#ffb4ab]">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8] group-focus-within:text-[#c0c1ff]">
                    <span className="material-symbols-outlined text-[20px]">
                      person
                    </span>
                  </div>
                  <input
                    type="text"
                    id="fullName"
                    required
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg pl-11 pr-4 py-3 text-sm text-[#e5e1e5] placeholder-[#94A3B8]/40 focus:outline-none focus:border-[#494bd6] focus:ring-2 focus:ring-[#494bd6]/20 transition-all"
                  />
                </div>
              </div>

              {/* WhatsApp Phone */}
              <div className="space-y-1.5">
                <label
                  className="block text-xs font-semibold text-[#c7c4d7] uppercase tracking-widest"
                  htmlFor="whatsapp"
                >
                  WhatsApp Number <span className="text-[#ffb4ab]">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8] group-focus-within:text-[#c0c1ff]">
                    <span className="material-symbols-outlined text-[20px]">
                      chat
                    </span>
                  </div>
                  <input
                    type="tel"
                    id="whatsapp"
                    required
                    placeholder="+233 XX XXX XXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg pl-11 pr-4 py-3 text-sm text-[#e5e1e5] placeholder-[#94A3B8]/40 focus:outline-none focus:border-[#494bd6] focus:ring-2 focus:ring-[#494bd6]/20 transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label
                    className="block text-xs font-semibold text-[#c7c4d7] uppercase tracking-widest"
                    htmlFor="email"
                  >
                    Email Address
                  </label>
                  <span className="text-[11px] text-[#64748B]">Optional</span>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8] group-focus-within:text-[#c0c1ff]">
                    <span className="material-symbols-outlined text-[20px]">
                      mail
                    </span>
                  </div>
                  <input
                    type="email"
                    id="email"
                    placeholder="hello@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg pl-11 pr-4 py-3 text-sm text-[#e5e1e5] placeholder-[#94A3B8]/40 focus:outline-none focus:border-[#494bd6] focus:ring-2 focus:ring-[#494bd6]/20 transition-all"
                  />
                </div>
              </div>

              {/* Order Summary Box */}
              <div className="mt-4 bg-[#0B0B0F] border border-white/10 rounded-lg p-4">
                <h3 className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-3">
                  Order Summary
                </h3>
                <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/10 border-dashed text-sm text-[#e5e1e5]">
                  <span>Masterclass Entry Ticket</span>
                  <span className="font-semibold">GH₵ {eventPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#94A3B8]">Total due today</span>
                  <span className="text-lg font-bold text-[#c0c1ff]">
                    GH₵ {eventPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#494bd6] hover:bg-[#494bd6]/90 text-white text-sm font-semibold py-3.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_4px_24px_-4px_rgba(73,75,214,0.4)] hover:shadow-[0_8px_32px_-4px_rgba(73,75,214,0.5)] active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? (
                  <span>Connecting to Paystack...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">
                      lock
                    </span>
                    <span>Pay with Paystack (Mobile Money / Card)</span>
                  </>
                )}
              </button>

              <div className="text-center text-[11px] text-[#94A3B8] flex items-center justify-center gap-1.5 pt-1">
                <span className="material-symbols-outlined text-[15px]">
                  encrypted
                </span>
                <span>Payments are secure and encrypted</span>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
