import { Link } from "react-router-dom";
import { Wifi, ArrowRight, Shield, Zap, Wallet, Users } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-slate-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-slate-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-slate-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-4000"></div>

      {/* Navigation */}
      <nav className="z-10 glass-panel border-b border-white/40 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-linear-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-all">
                <Wifi className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-slate-900 to-slate-700 tracking-tight">DataGuy</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                How it Works
              </a>
              <a
                href="#pricing"
                className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Pricing
              </a>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="font-semibold hover:bg-slate-100">Sign in</Button>
              </Link>
              <Link to="/register">
                <Button className="font-semibold shadow-md hover:shadow-lg transition-shadow bg-slate-900 hover:bg-slate-800 text-white">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto animate-float-slow">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-slate-100 text-slate-700 text-sm font-medium mb-8">
              <span className="flex h-2 w-2 rounded-full bg-slate-900"></span>
              The #1 Data Reselling Platform
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
              Sell Data Bundles.
              <br />
              <span className="text-slate-600">Earn More Daily.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Become a DataGuy agent and start selling MTN, Telecel & AirtelTigo data
              bundles. Set your own prices, earn commissions, and grow your
              business.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto px-8 h-12 shadow-slate-900/20 shadow-lg hover:-translate-y-0.5 transition-all bg-slate-900 hover:bg-slate-800 text-white border-0">
                  Start Selling Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/track">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto px-8 h-12 bg-white/50 backdrop-blur-sm border-slate-300 hover:bg-white hover:text-slate-900 hover:-translate-y-0.5 transition-all shadow-sm"
                >
                  Track an Order
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-2xl mx-auto p-8 glass-panel rounded-2xl relative z-10 animate-float">
              <div className="text-center sm:text-left">
                <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-slate-900 to-slate-700">
                  {formatStatNumber(stats.activeAgents, "5K+")}
                </div>
                <div className="text-sm font-semibold text-slate-500 mt-2 uppercase tracking-wide">Active Agents</div>
              </div>
              <div className="border-y sm:border-y-0 sm:border-x border-slate-200/50 py-4 sm:py-0 text-center">
                <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-slate-900 to-slate-700">
                  {formatStatNumber(stats.ordersDelivered, "100K+")}
                </div>
                <div className="text-sm font-semibold text-slate-500 mt-2 uppercase tracking-wide">
                  Orders Delivered
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-slate-900 to-slate-700">
                  {isLoading ? "..." : (stats.successRate !== undefined ? `${stats.successRate}%` : "99.9%")}
                </div>
                <div className="text-sm font-semibold text-slate-500 mt-2 uppercase tracking-wide">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 relative z-10 bg-white/50 backdrop-blur-lg border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              Why Choose DataGuy?
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need to run your data reselling business efficiently, with premium tools at your fingertips.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="glass-panel p-8 rounded-2xl hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mb-6 shadow-sm border border-slate-200/50">
                <Zap className="h-7 w-7 text-slate-900" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Instant Delivery
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Data bundles are delivered instantly after payment confirmation. No waiting, no hassle.
              </p>
            </div>

            <div className="glass-panel p-8 rounded-2xl hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mb-6 shadow-sm border border-slate-200/50">
                <Wallet className="h-7 w-7 text-slate-900" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Earn Commissions
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Set your own prices and earn on every sale. Withdraw anytime directly to your Mobile Money.
              </p>
            </div>

            <div className="glass-panel p-8 rounded-2xl hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mb-6 shadow-sm border border-slate-200/50">
                <Users className="h-7 w-7 text-slate-900" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Build Your Team
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Recruit sub-agents and earn passive income from their sales too. Scale infinitely.
              </p>
            </div>

            <div className="glass-panel p-8 rounded-2xl hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mb-6 shadow-sm border border-slate-200/50">
                <Shield className="h-7 w-7 text-slate-900" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Secure Payments
              </h3>
              <p className="text-slate-600 leading-relaxed">
                All transactions secured with Paystack. Safe, reliable, and entirely automated.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">How It Works</h2>
            <p className="mt-4 text-lg text-slate-600">
              Get started and make your first sale in under 5 minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="w-20 h-20 bg-white shadow-xl shadow-slate-200/50 rounded-2xl flex items-center justify-center text-3xl font-extrabold text-slate-900 mx-auto mb-6 transform group-hover:-translate-y-2 transition-all duration-300 border border-slate-100">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Create Account
              </h3>
              <p className="text-slate-600 leading-relaxed px-4">
                Sign up as an agent or sub-agent instantly. No upfront fees required.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-white shadow-xl shadow-slate-200/50 rounded-2xl flex items-center justify-center text-3xl font-extrabold text-slate-900 mx-auto mb-6 transform group-hover:-translate-y-2 transition-all duration-300 border border-slate-100">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Share Your Link
              </h3>
              <p className="text-slate-600 leading-relaxed px-4">
                Get your unique payment link and share with customers on WhatsApp or social media.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-white shadow-xl shadow-slate-200/50 rounded-2xl flex items-center justify-center text-3xl font-extrabold text-slate-900 mx-auto mb-6 transform group-hover:-translate-y-2 transition-all duration-300 border border-slate-100">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Earn & Withdraw
              </h3>
              <p className="text-slate-600 leading-relaxed px-4">
                Earn commission instantly on every fully automated sale. Withdraw anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-slate-900"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-slate-700 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-slate-800 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
        
        <div className="max-w-4xl mx-4 sm:mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 glass-panel-dark rounded-3xl p-12 mt-4 shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-slate-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Join the platform that is empowering thousands of agents to build reliable income streams selling data bundles across Ghana.
          </p>
          <Link to="/register">
            <Button
              size="lg"
              className="bg-white text-slate-900 hover:bg-slate-100 border-0 h-14 px-10 text-lg font-bold shadow-xl shadow-white/10 hover:-translate-y-1 transition-all"
            >
              Create Free Account
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <Wifi className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900">DataGuy</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-slate-600">
              <Link to="/terms" className="hover:text-slate-900">
                Terms
              </Link>
              <Link to="/privacy" className="hover:text-slate-900">
                Privacy
              </Link>
              <Link to="/track" className="hover:text-slate-900">
                Track Order
              </Link>
              <Link to="/support" className="hover:text-slate-900">
                Support
              </Link>
            </div>

            <div className="text-sm text-slate-500">
              © 2026 DataGuy. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
