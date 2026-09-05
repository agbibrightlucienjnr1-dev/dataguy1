import React, { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { WhatYouWillLearn } from "./components/WhatYouWillLearn";
import { PricingCard } from "./components/PricingCard";
import { FAQ } from "./components/FAQ";
import { Footer } from "./components/Footer";
import { RegistrationModal } from "./components/RegistrationModal";
import { PaymentSuccessModal } from "./components/PaymentSuccessModal";
import { getEventDetails, verifyEventPayment } from "./services/api";

function App() {
  const [eventData, setEventData] = useState({
    title: "AI Video Creation Masterclass (Long & Short Form)",
    price: 20,
    eventDate: null,
    slug: "ai-video-masterclass",
  });
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [confirmedData, setConfirmedData] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // Load event details
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await getEventDetails("ai-video-masterclass");
        if (data) {
          setEventData(data);
        }
      } catch (err) {
        console.warn("Could not fetch latest event info, using defaults:", err);
      }
    };

    fetchEvent();
  }, []);

  // Check URL parameters for Paystack callback / reference
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference =
      urlParams.get("reference") ||
      urlParams.get("trxref") ||
      urlParams.get("paystack_ref");

    if (reference) {
      setVerifyingPayment(true);
      const verify = async () => {
        try {
          const result = await verifyEventPayment(reference);
          if (result && result.status === "confirmed") {
            setConfirmedData(result);
            setSuccessModalOpen(true);
            toast.success("Payment verified! Please join the WhatsApp group.");
          } else {
            toast.error("Payment not completed or still processing.");
          }
        } catch (err) {
          console.error("Verification error:", err);
          toast.error("Could not verify payment reference.");
        } finally {
          setVerifyingPayment(false);
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        }
      };

      verify();
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#050507] text-[#e5e1e5] font-sans antialiased selection:bg-[#494bd6]/30 selection:text-[#c0c1ff] flex flex-col justify-between">
      {/* Top Navbar */}
      <Navbar
        onOpenRegister={() => setRegisterModalOpen(true)}
        eventPrice={eventData.price}
      />

      {/* Verifying Payment Banner */}
      {verifyingPayment && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-[#494bd6] text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2 animate-pulse">
          <span className="material-symbols-outlined text-[16px]">sync</span>
          <span>Verifying payment with Paystack...</span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow flex flex-col">
        <Hero
          onOpenRegister={() => setRegisterModalOpen(true)}
          eventPrice={eventData.price}
          eventDate={eventData.eventDate}
        />

        <WhatYouWillLearn />

        <PricingCard
          onOpenRegister={() => setRegisterModalOpen(true)}
          eventPrice={eventData.price}
        />

        <FAQ />
      </main>

      {/* Footer */}
      <Footer />

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        eventPrice={eventData.price}
        eventTitle={eventData.title}
        eventSlug={eventData.slug}
      />

      {/* Payment Success Modal */}
      <PaymentSuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        registrationData={confirmedData}
      />

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#121218",
            color: "#e5e1e5",
            border: "1px solid rgba(255,255,255,0.08)",
            fontSize: "13px",
            borderRadius: "10px",
          },
          success: {
            iconTheme: {
              primary: "#10B981",
              secondary: "#ffffff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ffb4ab",
              secondary: "#121218",
            },
          },
        }}
      />
    </div>
  );
}

export default App;
