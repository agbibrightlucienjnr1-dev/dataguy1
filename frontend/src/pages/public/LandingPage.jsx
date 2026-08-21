import { Link } from "react-router-dom";
import {
  Wifi,
  ArrowRight,
  Shield,
  Zap,
  Wallet,
  Users,
  CheckCircle2,
  TrendingUp,
  Smartphone,
  BadgeCheck,
  Facebook,
  Twitter,
  Instagram,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../components/ui";
import { ordersApi } from "../../api";

export default function LandingPage() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ["publicStats"],
    queryFn: () => ordersApi.getPublicStats(),
    staleTime: 5 * 60 * 1000,
  });

  const stats = statsData?.data || {};

  const formatStatNumber = (value, fallback) => {
    if (isLoading) return "...";
    if (value === undefined || value === null) return fallback;
    if (value >= 1000) {
      return (value / 1000).toFixed(1).replace(/\.0$/, "") + "K+";
    }
    return value;
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Navigation */}
      <nav className="z-30 glass-panel border-b border-white/40 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-linear-to-br from-brand-600 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-300/50 transform group-hover:scale-105 transition-all">
                <Wifi className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-display font-extrabold bg-clip-text text-transparent bg-linear-to-r from-brand-700 to-fuchsia-600 tracking-tight">DataGuy</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-brand-700 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm font-semibold text-slate-600 hover:text-brand-700 transition-colors">
                How it Works
              </a>
              <Link to="/track" className="text-sm font-semibold text-slate-600 hover:text-brand-700 transition-colors">
                Track Order
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="font-semibold hover:bg-brand-50 hover:text-brand-700">Sign in</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" className="font-semibold shadow-md shadow-violet-300/40 hover:shadow-lg transition-shadow">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero — split layout: copy left, product mockup right */}
      <section className="relative pt-16 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        <div className="absolute top-0 -left-24 w-96 h-96 bg-brand-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob pointer-events-none"></div>
        <div className="absolute top-40 -right-24 w-96 h-96 bg-action-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            {/* Copy column */}
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-200 bg-brand-50 text-brand-700 text-sm font-medium mb-6">
                <span className="flex h-2 w-2 rounded-full bg-action-500"></span>
                The #1 Data Reselling Platform in Ghana
              </div>

              <h1 className="text-5xl sm:text-6xl font-display font-extrabold text-slate-900 leading-[1.08] tracking-tight text-balance">
                Sell data bundles.
                <br />
                <span className="bg-clip-text text-transparent bg-linear-to-r from-brand-600 via-violet-500 to-fuchsia-500">
                  Earn more daily.
                </span>
              </h1>
              <p className="mt-6 text-lg text-slate-600 max-w-lg leading-relaxed">
                Become a DataGuy agent and start selling MTN, Telecel &amp; AirtelTigo data
                bundles. Set your own prices, earn commissions on every sale, and grow a
                business you control.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
                <Link to="/register" className="w-full sm:w-auto">
                  <Button variant="success" size="lg" className="w-full sm:w-auto px-8 h-12 shadow-lg shadow-action-500/30 hover:-translate-y-0.5 transition-all">
                    Start Selling Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/track" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 h-12 border-slate-200 hover:border-brand-300 hover:bg-brand-50/60 hover:text-brand-700 transition-all">
                    Track an Order
                  </Button>
                </Link>
              </div>

              {/* Inline stat row, not boxed */}
              <div className="mt-12 flex items-center gap-8 flex-wrap">
                <div>
                  <div className="text-3xl font-display font-extrabold text-slate-900">
                    {formatStatNumber(stats.activeAgents, "5K+")}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Active Agents</div>
                </div>
                <div className="w-px h-10 bg-slate-200"></div>
                <div>
                  <div className="text-3xl font-display font-extrabold text-slate-900">
                    {formatStatNumber(stats.ordersDelivered, "100K+")}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Orders Delivered</div>
                </div>
                <div className="w-px h-10 bg-slate-200"></div>
                <div>
                  <div className="text-3xl font-display font-extrabold text-action-600">
                    {isLoading ? "..." : (stats.successRate !== undefined ? `${stats.successRate}%` : "99.9%")}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Success Rate</div>
                </div>
              </div>
            </div>

            {/* Visual column — mock product card, not a boxed stat grid */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-md animate-float-slow">
                {/* Main app-preview card */}
                <div className="relative rounded-[2rem] bg-white shadow-2xl shadow-violet-300/40 border border-slate-100 p-6 rotate-2">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-linear-to-br from-brand-600 to-fuchsia-500 flex items-center justify-center">
                        <Smartphone className="w-4.5 h-4.5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-display font-bold text-slate-900">Buy Data Bundle</div>
                        <div className="text-xs text-slate-400">dataguy.shop/buy</div>
                      </div>
                    </div>
                    <BadgeCheck className="w-5 h-5 text-action-500" />
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2.5 py-1 rounded-lg bg-yellow-400 text-[11px] font-bold text-slate-900">MTN</span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-400">Telecel</span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-400">AirtelTigo</span>
                  </div>

                  <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-4 mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">10GB · 30 Days</div>
                        <div className="text-xs text-slate-500">Non-expiry data plan</div>
                      </div>
                      <div className="text-xl font-display font-extrabold text-brand-700">₵45.00</div>
                    </div>
                  </div>

                  <div className="w-full h-11 rounded-xl bg-linear-to-r from-action-600 to-emerald-500 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-action-500/30">
                    Pay with Mobile Money
                  </div>
                </div>

                {/* Floating success toast */}
                <div className="absolute -bottom-6 -left-8 bg-white rounded-2xl shadow-xl shadow-slate-300/40 border border-slate-100 p-4 flex items-center gap-3 -rotate-3 animate-float">
                  <div className="w-10 h-10 rounded-full bg-action-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-action-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Delivered instantly</div>
                    <div className="text-xs text-slate-500">to 024 XXX XXXX</div>
                  </div>
                </div>

                {/* Floating earnings chip */}
                <div className="absolute -top-6 -right-4 bg-linear-to-br from-brand-600 to-fuchsia-500 rounded-2xl shadow-xl shadow-violet-400/40 p-4 text-white animate-float animation-delay-2000">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-100">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Commission earned
                  </div>
                  <div className="text-xl font-display font-extrabold mt-1">+₵6.50</div>
                </div>
              </div>
            </div>
          </div>

          {/* Trusted networks strip */}
          <div className="mt-24 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Sell bundles for</span>
            <div className="flex items-center gap-8">
              <span className="flex items-center gap-2 text-slate-700 font-display font-bold">
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>MTN
              </span>
              <span className="flex items-center gap-2 text-slate-700 font-display font-bold">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>Telecel
              </span>
              <span className="flex items-center gap-2 text-slate-700 font-display font-bold">
                <span className="w-3 h-3 rounded-full bg-blue-600"></span>AirtelTigo
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features — asymmetric bento grid */}
      <section id="features" className="py-24 relative bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-slate-900">
              Why choose DataGuy?
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Everything you need to run your data reselling business efficiently, with
              premium tools at your fingertips.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-6">
            {/* Large featured card */}
            <div className="lg:col-span-2 lg:row-span-2 rounded-3xl bg-linear-to-br from-brand-700 via-violet-700 to-fuchsia-700 p-8 flex flex-col justify-between text-white relative overflow-hidden">
              <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                  <Wallet className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-3">Earn commissions on every sale</h3>
                <p className="text-violet-100 leading-relaxed max-w-sm">
                  Set your own resale prices above the wholesale rate and keep the
                  difference. Withdraw straight to your Mobile Money, anytime.
                </p>
              </div>
              <div className="relative z-10 mt-8 flex items-center gap-2 text-sm font-semibold text-white">
                No caps. No waiting periods. <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 p-7 hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-100 transition-all duration-300">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-5">
                <Zap className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-display font-bold text-slate-900 mb-2">Instant Delivery</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Bundles land on the recipient's line seconds after payment confirms.
              </p>
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 p-7 hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-100 transition-all duration-300">
              <div className="w-12 h-12 bg-fuchsia-100 rounded-xl flex items-center justify-center mb-5">
                <Shield className="h-6 w-6 text-fuchsia-600" />
              </div>
              <h3 className="text-lg font-display font-bold text-slate-900 mb-2">Secure Payments</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Every transaction runs through Paystack — safe, reliable, automated.
              </p>
            </div>

            <div className="lg:col-span-2 rounded-3xl bg-white border border-slate-200 p-7 flex items-center gap-6 hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-100 transition-all duration-300">
              <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center shrink-0">
                <Users className="h-6 w-6 text-brand-600" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-slate-900 mb-1">Build your own team</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Recruit sub-agents under you and earn passive income from every sale they make. Scale infinitely.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works — connected stepper */}
      <section id="how-it-works" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-slate-900">How it works</h2>
            <p className="mt-4 text-lg text-slate-600">Get started and make your first sale in under 5 minutes</p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-8 left-[16.6%] right-[16.6%] h-0.5 bg-linear-to-r from-brand-300 via-violet-300 to-action-300"></div>

            <div className="grid md:grid-cols-3 gap-12 md:gap-8">
              {[
                {
                  n: "1",
                  title: "Create Account",
                  desc: "Sign up as an agent or sub-agent instantly. No upfront fees required.",
                  grad: "from-brand-600 to-violet-500",
                },
                {
                  n: "2",
                  title: "Share Your Link",
                  desc: "Get your unique payment link and share with customers on WhatsApp or social media.",
                  grad: "from-violet-500 to-fuchsia-500",
                },
                {
                  n: "3",
                  title: "Earn & Withdraw",
                  desc: "Earn commission instantly on every fully automated sale. Withdraw anytime.",
                  grad: "from-action-500 to-emerald-600",
                },
              ].map((step) => (
                <div key={step.n} className="relative text-center">
                  <div
                    className={`relative z-10 w-16 h-16 mx-auto rounded-2xl bg-linear-to-br ${step.grad} shadow-lg shadow-violet-200 flex items-center justify-center text-2xl font-display font-extrabold text-white`}
                  >
                    {step.n}
                  </div>
                  <h3 className="mt-6 text-xl font-display font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-slate-600 leading-relaxed px-2">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA — split layout with checklist, not a centered box */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-brand-700 via-violet-700 to-fuchsia-700"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-fuchsia-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-action-400 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-display font-extrabold text-white mb-6">
                Ready to start earning?
              </h2>
              <p className="text-violet-100 text-lg mb-8 max-w-lg">
                Join the platform empowering thousands of agents to build reliable
                income streams selling data bundles across Ghana.
              </p>
              <Link to="/register">
                <Button variant="success" size="lg" className="h-14 px-10 text-lg font-bold shadow-xl shadow-action-900/30 hover:-translate-y-1 transition-all">
                  Create Free Account
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                "No setup or listing fees",
                "Instant Mobile Money payouts",
                "Unlimited sub-agent network",
                "24/7 automated delivery",
              ].map((item) => (
                <div key={item} className="glass-panel-dark rounded-2xl p-5">
                  <CheckCircle2 className="w-5 h-5 text-action-400 mb-3" />
                  <p className="text-white text-sm font-medium leading-snug">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer — multi-column */}
      <footer className="pt-16 pb-8 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-linear-to-br from-brand-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
                  <Wifi className="w-4 h-4 text-white" />
                </div>
                <span className="font-display font-bold text-white text-lg">DataGuy</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                Ghana's data bundle reselling platform for MTN, Telecel and AirtelTigo agents.
              </p>
              <div className="flex items-center gap-3 mt-5">
                <a href="#" className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-display font-bold text-white mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
                <li><Link to="/track" className="hover:text-white transition-colors">Track Order</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-display font-bold text-white mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link to="/support" className="hover:text-white transition-colors">Support</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Become an Agent</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-display font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">© 2026 DataGuy. All rights reserved.</p>
            <p className="text-sm text-slate-500">Made for agents across Ghana 🇬🇭</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
