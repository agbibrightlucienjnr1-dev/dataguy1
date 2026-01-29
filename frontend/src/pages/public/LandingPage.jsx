import { Link } from "react-router-dom";
import { Wifi, ArrowRight, Shield, Zap, Wallet, Users } from "lucide-react";
import { Button } from "../../components/ui";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center">
                <Wifi className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">DataGuy</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-slate-600 hover:text-slate-900"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-slate-600 hover:text-slate-900"
              >
                How it Works
              </a>
              <a
                href="#pricing"
                className="text-slate-600 hover:text-slate-900"
              >
                Pricing
              </a>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link to="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
              Sell Data Bundles.
              <br />
              <span className="text-slate-500">Earn More.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
              Become a DataGuy agent and start selling MTN & AirtelTigo data
              bundles. Set your own prices, earn commissions, and grow your
              business.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto px-8">
                  Start Selling Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/track">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto px-8"
                >
                  Track an Order
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <div>
                <div className="text-3xl font-bold text-slate-900">5K+</div>
                <div className="text-sm text-slate-500 mt-1">Active Agents</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">100K+</div>
                <div className="text-sm text-slate-500 mt-1">
                  Orders Delivered
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">99.9%</div>
                <div className="text-sm text-slate-500 mt-1">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">
              Why Choose DataGuy?
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Everything you need to run your data reselling business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl border border-slate-100">
              <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Instant Delivery
              </h3>
              <p className="text-slate-600">
                Data bundles are delivered instantly after payment confirmation.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-100">
              <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mb-4">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Earn Commissions
              </h3>
              <p className="text-slate-600">
                Set your own prices and earn on every sale. Withdraw anytime.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-100">
              <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Build Your Team
              </h3>
              <p className="text-slate-600">
                Recruit sub-agents and earn from their sales too.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-100">
              <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Secure Payments
              </h3>
              <p className="text-slate-600">
                All transactions secured with Paystack. Safe & reliable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">How It Works</h2>
            <p className="mt-4 text-lg text-slate-600">
              Get started in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Create Account
              </h3>
              <p className="text-slate-600">
                Sign up as an agent or sub-agent in under 2 minutes.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Share Your Link
              </h3>
              <p className="text-slate-600">
                Get your unique payment link and share with customers.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Earn & Withdraw
              </h3>
              <p className="text-slate-600">
                Earn commission on every sale. Withdraw to mobile money or bank.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-slate-300 text-lg mb-8">
            Join thousands of agents selling data bundles across Ghana.
          </p>
          <Link to="/register">
            <Button
              size="lg"
              className="bg-white text-slate-900 hover:bg-slate-100"
            >
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
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
              <a
                href="mailto:support@dataguy.com"
                className="hover:text-slate-900"
              >
                Support
              </a>
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
