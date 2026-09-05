import React from "react";

export const PaymentSuccessModal = ({
  isOpen,
  onClose,
  registrationData,
}) => {
  if (!isOpen || !registrationData) return null;

  const whatsappLink =
    registrationData.whatsappGroupLink ||
    "https://chat.whatsapp.com/invite-placeholder";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050507]/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Ambient Glow Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#c0c1ff] rounded-full blur-[160px] opacity-[0.04] pointer-events-none z-0"></div>

      {/* Main Card Canvas */}
      <main className="w-full max-w-lg z-10 flex flex-col items-center">
        <div
          className="glass-card w-full rounded-2xl p-6 sm:p-8 flex flex-col items-center glow-shadow text-center relative overflow-hidden bg-[#121218]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle accent top line */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#10B981] to-transparent opacity-60"></div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors z-20"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          {/* Verified Emerald Badge */}
          <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.1)] flex items-center justify-center mb-5 border border-[rgba(16,185,129,0.2)]">
            <span
              className="material-symbols-outlined text-[#10B981] text-[32px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-2xl sm:text-3xl font-bold text-[#e5e1e5] mb-1 tracking-tight">
            Payment Confirmed
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] mb-6">
            Welcome to AI Video Creation Masterclass
          </p>

          {/* Receipt Summary */}
          <div className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl p-5 mb-6 text-left text-xs sm:text-sm">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/10">
              <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                Transaction ID
              </span>
              <span className="text-[#e5e1e5] font-mono text-xs">
                #{registrationData.paymentReference || "TXN-VERIFIED"}
              </span>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[#94A3B8]">Attendee</span>
                <span className="text-[#e5e1e5] font-medium">
                  {registrationData.fullName || "Student"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#94A3B8]">Phone Number</span>
                <span className="text-[#e5e1e5]">
                  {registrationData.phone || "—"}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-[#94A3B8]">Amount Paid</span>
                <span className="text-[#10B981] font-semibold">
                  GH₵ {registrationData.amountPaid ? Number(registrationData.amountPaid).toFixed(2) : "20.00"}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Action Button (Direct Join Only) */}
          <div className="w-full">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#494bd6] hover:bg-[#494bd6]/90 text-white text-sm font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(73,75,214,0.3)] hover:shadow-[0_0_30px_rgba(73,75,214,0.5)] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px]">
                forum
              </span>
              <span>Join Private WhatsApp Student Group</span>
            </a>
          </div>

          {/* Footer / Return */}
          <div className="mt-6">
            <button
              onClick={onClose}
              className="text-xs text-[#94A3B8] hover:text-[#e5e1e5] transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">
                arrow_back
              </span>
              <span>Return to Page</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
