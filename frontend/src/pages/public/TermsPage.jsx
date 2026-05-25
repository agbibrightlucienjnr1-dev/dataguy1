import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, FileText, Wifi } from "lucide-react";
import { Card, Button } from "../../components/ui";

export default function TermsPage() {
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
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Terms of Use
          </h1>
          <p className="text-slate-600 mt-2">
            Last Updated: May 24, 2026
          </p>
        </div>

        <Card className="p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 bg-white/90 backdrop-blur-md">
          <div className="space-y-8 text-slate-700 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing, using, or registering on the DataGuy platform ("the Services"), you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use the platform.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">
                2. Data Sales & Delivery
              </h2>
              <p>
                DataGuy facilitates the purchasing and reselling of mobile data bundles (MTN, Telecel, AT iSHARE, AT Big Time). While most bundle deliveries are processed instantly, processing speeds depend on the cellular networks' uptime and our wholesale supplier's connection. DataGuy is not liable for delayed delivery due to third-party telecommunication operator downtimes or connection timeouts.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">
                3. User & Agent Responsibilities
              </h2>
              <p>
                For regular customers purchasing bundles, you are responsible for providing the correct recipient phone number. For agents and sub-agents registering on our system:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li>You must provide your real name, email, and phone number during registration.</li>
                <li>You are solely responsible for all activity conducted through your account dashboard.</li>
                <li>You must safeguard your dashboard credentials to prevent unauthorized wallet withdrawals.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">
                4. Refund & Cancellation Policy
              </h2>
              <div className="p-4 bg-slate-50 border-l-4 border-slate-800 rounded-r-xl">
                <p className="font-semibold text-slate-900 mb-1">Important Notice:</p>
                <p>
                  Refunds are **only available if the data bundle cannot be delivered** to the destination number. Once a data bundle has been successfully sent to the network operator and delivered, all sales are final, and transactions cannot be reversed or cancelled.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">
                5. Accuracy of Recipient Information
              </h2>
              <p>
                DataGuy automatically initiates deliveries using the exact phone number inputted on the purchase form. We do not inspect or verify if the recipient's phone number belongs to the intended person. DataGuy is not liable for losses resulting from customer or agent input errors.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">
                6. Amendments to Services
              </h2>
              <p>
                We reserve the right to amend these Terms of Use or adjust data bundle availability and prices at any time to adapt to operator pricing modifications. Continued use of the Services following updates constitutes acceptance of the changes.
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
