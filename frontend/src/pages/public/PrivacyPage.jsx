import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Lock, Wifi } from "lucide-react";
import { Card, Button } from "../../components/ui";

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Subtle Background Blobs */}
      <div className="absolute top-0 -left-64 w-96 h-96 bg-slate-200 rounded-full mix-blend-multiply filter blur-3xl opacity-35 pointer-events-none"></div>
      <div className="absolute top-1/3 -right-64 w-96 h-96 bg-slate-300 rounded-full mix-blend-multiply filter blur-3xl opacity-35 pointer-events-none"></div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-md transform group-hover:scale-105 transition-all">
                <Wifi className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-slate-900 to-slate-700">
                DataGuy
              </span>
            </Link>
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate("/");
                }
              }}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 transition-colors px-3 py-1.5 rounded-full border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-12 relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-slate-900/10">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-slate-600 mt-2">
            Last Updated: May 24, 2026
          </p>
        </div>

        <Card className="p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 bg-white/90 backdrop-blur-md">
          <div className="space-y-8 text-slate-700 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">
                1. Information We Collect
              </h2>
              <p>
                We only collect minimal data necessary to provide data bundle purchases and dashboard reseller services. Our collection guidelines are:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>
                  **For Regular Customers**: We collect only the recipient's phone number and an optional recipient name to route and label the order.
                </li>
                <li>
                  **For Registered Agents & Sub-agents**: We collect your name, email address, and phone number during registration to create your account, manage your balance wallet, and track order histories.
                </li>
                <li>
                  **Payment Information**: We do not store or process your credit card numbers or Mobile Money PINs. Payment collections are securely handled directly by third-party processors (Paystack and Moolre) through their encrypted iframe or redirect windows.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">
                2. How We Use Your Information
              </h2>
              <p>
                Your information is used solely to:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li>Process data purchases and trigger automatic network operator deliveries.</li>
                <li>Verify Mobile Money payments and authorize bank notifications.</li>
                <li>Send transactional order confirmation SMS to recipient phone numbers.</li>
                <li>Verify agent/sub-agent payouts and withdrawals.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">
                3. Information Sharing and Disclosure
              </h2>
              <p>
                We value your privacy and do not sell or lease user data to marketers. Your data is only shared with trusted third parties under these circumstances:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li>
                  **Telecom Networks**: The recipient's phone number is sent to network operator APIs (MTN, Telecel, AirtelTigo) to complete the bundle top-up.
                </li>
                <li>
                  **Payment Gateways**: Billing numbers are shared with Paystack/Moolre to prompt and authorize Mobile Money charges.
                </li>
                <li>
                  **Legal Requirements**: If required to comply with financial regulations or judicial summons.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">
                4. Data Security
              </h2>
              <p>
                We implement robust security measures including SSL/TLS encryption for all data in transit, firewall access restrictions, and password hashes for agent logins. However, please remember that no method of transmission over the Internet is 100% secure, and agents are advised to safeguard their password credentials.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">
                5. Contact and Inquiries
              </h2>
              <p>
                If you have any questions about this Privacy Policy or how your personal information is handled, you can reach out to our administration team directly at **admin@dataguy.shop**.
              </p>
            </section>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-20 py-8 relative z-10">
        <div className="max-w-3xl mx-auto px-4 text-center text-sm text-slate-500">
          <p>© 2026 DataGuy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
