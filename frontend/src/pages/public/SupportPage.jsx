import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Clock, HelpCircle, Wifi, ShieldAlert } from "lucide-react";
import { Card, Button } from "../../components/ui";

export default function SupportPage() {
  const navigate = useNavigate();

  const faqs = [
    {
      q: "How long does it take for a data bundle to arrive?",
      a: "Most data bundles are delivered instantly. If there is a minor network delay from the operator's end, it may take 5 to 15 minutes. You can monitor your purchase in real-time on our Order Tracking page."
    },
    {
      q: "My payment went through, but I haven't received my data. What should I do?",
      a: "Go to the Order Tracking page, input the recipient's phone number or Order ID, and click 'Verify Payment'. The system will automatically double-check with the payment processor and push the delivery. If the delivery still fails, our system automatically schedules a refund."
    },
    {
      q: "Can I get a refund if I entered a wrong phone number?",
      a: "Unfortunately, we cannot process refunds if the data bundle was successfully delivered to the phone number you entered. Please double-check the recipient number before completing payment."
    },
    {
      q: "How do I become an agent or sub-agent?",
      a: "Simply click the 'Get Started' or 'Become an Agent' buttons on our landing page. Registration is completely free and instantly creates your dashboard where you can fund your wallet and set custom retail pricing."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Subtle Background Blobs */}
      <div className="absolute top-0 -left-64 w-96 h-96 bg-slate-200 rounded-full mix-blend-multiply filter blur-3xl opacity-35"></div>
      <div className="absolute top-1/3 -right-64 w-96 h-96 bg-slate-300 rounded-full mix-blend-multiply filter blur-3xl opacity-35"></div>

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
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Support Center
          </h1>
          <p className="text-slate-600 mt-2">
            Get help with your transactions, orders, and agent settings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Email Support Card */}
          <Card className="p-6 md:col-span-2 flex flex-col justify-between border border-slate-200 shadow-sm bg-white/95">
            <div>
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                <Mail className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Email Support</h3>
              <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                Reach out to us directly via email for order inquiries, payment issues, or agent portal troubleshooting. We respond to all inquiries within 24 hours.
              </p>
            </div>
            <a
              href="mailto:admin@dataguy.shop"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors"
            >
              admin@dataguy.shop
            </a>
          </Card>

          {/* Working Hours Card */}
          <Card className="p-6 border border-slate-200 shadow-sm bg-white/95 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Support Hours</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Our support team is active and monitoring transaction processes daily.
              </p>
              <div className="mt-4 space-y-2 text-xs font-semibold text-slate-500">
                <div className="flex justify-between">
                  <span>Mon - Fri</span>
                  <span className="text-slate-800">8:00 AM - 8:00 PM</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2">
                  <span>Sat - Sun</span>
                  <span className="text-slate-800">10:00 AM - 5:00 PM</span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/track">
                <Button variant="outline" className="w-full text-xs">
                  Track Your Order
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* FAQs */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-slate-700" />
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {faqs.map((faq, i) => (
              <Card key={i} className="p-6 border border-slate-200 shadow-[0_2px_8px_rgb(0,0,0,0.02)] bg-white/90">
                <h3 className="font-bold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
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
